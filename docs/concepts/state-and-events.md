---
title: State & events
sidebar_label: State & events
sidebar_position: 1
description: How babelconnect-server streams agent state — the snapshot, the patches, and how to consume them.
---

# State & events

babelconnect is **server-authoritative**: babelconnect-server owns the canonical per-agent **`AgentView`** and
streams every change to your client. You never assemble state yourself — you **render `AgentView`** and **send
intents**. This page explains exactly what comes down the stream, so you can reason about it (and debug it).

The machine-readable companion is the **[Events API reference](pathname:///reference/events/)** (AsyncAPI);
this is the prose version.

## The stream: snapshot, then patches

When your client opens the control stream (the `Session` / `Subscribe` RPC — see
[native vs browser streaming](../protocol/overview#how-they-relate) for why there are two), the server sends a
single message type — **`StateUpdate`** — carrying one of three things:

| `StateUpdate.update` | When | Meaning |
|---|---|---|
| `snapshot` (`AgentView`) | once, on open | the full current state |
| `patch` (`Patch`) | as things change | one entity-level delta |
| `error` (`Error`) | out-of-band | a command rejection or warning |

So the shape is always: **one snapshot, then a stream of patches.** The SDK's `StateCache` applies the
snapshot, folds each patch into it, and notifies your subscriber with the updated `AgentView` — keeping your
UI a pure function of that view:

```text
AgentView₀ (snapshot)  →  +patch  →  +patch  →  +patch  →  …
```

## `seq`: ordering and gap recovery

Every `StateUpdate` carries a monotonically increasing **`seq`**. A `snapshot` sets it; each `patch`
increments it by one. If your client sees a gap (a `seq` that skips), it has missed a patch and its view is no
longer trustworthy — it should **resubscribe** to get a fresh snapshot. The SDKs detect this and surface it
(e.g. the `onGap` callback); the rule is simply *on a gap, reconnect*. A `notification`, though transient, is a
patch — so it advances `seq` like any other; only an `error` is out-of-band and does **not** advance `seq`.

## The patch types

A `Patch` is a **oneof** — exactly one of ten entity deltas. Upserts are keyed: they replace the whole entity
by its key — a call/conference by `id`, a conversation by `peer` (a one-field change still carries the **full**
object) — or append it if new; removes carry just that key. The SDK caches apply them mechanically:

| Patch | Payload | Effect on `AgentView` |
|---|---|---|
| `agent` | `AgentInfo` | replace the agent block (presence, number, capabilities) |
| `callUpsert` | `CallState` | add or update a call by id |
| `callRemove` | call id | drop a call |
| `wrapUp` | `WrapUpStatus` | set the after-call-work countdown |
| `smsUpsert` | `SmsConversation` | add or update a conversation |
| `smsRemove` | the conversation's `peer` | drop a conversation |
| `conferenceUpsert` | `Conference` | add or update a conference |
| `conferenceRemove` | conference id | drop a conference |
| `config` | `AppConfig` | set the per-account feature config (which capabilities are enabled) |
| `notification` | `Notification` | **transient** — a one-shot CTI screen-pop; fired as an event, not stored |

`notification` is the only arm that isn't stored: the TypeScript client hands it to your `onNotification`
callback and then forgets it (the Go client doesn't currently surface notifications). A `Notification` carries
a `kind` (e.g. `cti.message`), a `title` / `body` to show, a `ts`, and `dataJson` — the screen-pop payload,
JSON-encoded — for your integration to act on:

```ts
const bc = BabelconnectClient.connect({
  serverUrl, token,
  onNotification: (n) => {
    if (n.kind === "cti.message") crm.screenPop(JSON.parse(n.dataJson || "{}"));
  },
});
```

Because it's transient, handle a `notification` when it fires — it won't be in any later `AgentView`.
Everything else mutates `AgentView` and persists until a later patch changes it.

**Feature gating.** The `config` patch carries an `AppConfig` of per-deployment feature flags — `calls`,
`messaging`, `history`, `phonebook`, `account`, `outbound`, and `cti` — each with an `enabled` flag. Some carry
finer settings: `calls.allowTransfer` / `calls.allowConference` (the transfer and conference actions),
`cti.screenPop` / `cti.emitCallEvents` (whether to surface screen-pop notifications, and whether to emit
`cti.call` to an embedding host), and `account.allowDeviceSwitch` / `account.showStatus` (the browser/telephone
device selector, and the Status/About section). The other features carry only `enabled`. `AppConfig` also
carries `serverVersion` — the babelconnect-server build, for a Status/About surface. Gate your UI and
actions on `AgentView.config` rather than assuming every capability is on. In TypeScript, `config` and its
feature objects are optional until the config patch arrives — reach them defensively, e.g.
`config?.calls?.enabled`. In Go, the generated `GetConfig().GetCalls().GetEnabled()` getters are nil-safe, so
the same access never panics.

**Wire types.** The messages behind this section are
[`StateUpdate`](../protocol/grpc#babelconnect-v1-StateUpdate) (the `snapshot` · `patch` · `error` envelope) and
the [`Patch`](../protocol/grpc#babelconnect-v1-Patch) oneof — see the [gRPC reference](../protocol/grpc) for
every field.

## A call, end to end

An inbound call arrives as a sequence of patches (`seq` increasing each step):

| Step | Patch | What you render |
|---|---|---|
| 1. Call rings | `callUpsert` — `CallState{ state: ringing, webrtc_offer }` | an incoming-call card; the offer is the SDP to answer |
| 2. You answer | *(you send the `answerCall` intent)* | — |
| 3. Call connects | `callUpsert` — `CallState{ state: in_progress }` | the in-call UI (mute / hold / transfer) |
| 4. You mute | `callUpsert` — `CallState{ muted: true }` | the mute button lit |
| 5. Far end hangs up | `callRemove` — the call id | clear the call; a `wrapUp` patch may start the ACW timer |

Notice the loop: **you send an intent, the server reduces it, and the result comes back as a patch.** You never
set `muted` locally — you call `mute(callId, true)` and wait for the `callUpsert` that reflects it. That's what
"server-authoritative" buys you: every client (and every browser tab) shows identical state.

An **outbound** call (`placeCall`) is the same loop minus step 2 — the SDK auto-answers the agent's own leg, so
it moves `RINGING` → `IN_PROGRESS` without you calling `answerCall` (this is the `autoAnswer` default). The one
exception is a **callback** (a scheduled outbound call the agent accepts): it arrives `RINGING` with
`CallState.source` = `callback` and waits for `answerCall` like an inbound call, **even with `autoAnswer` on**.

Although this walks through one call, `activeCalls` is a **list** — an agent can have more than one at once (a
call in progress while a second rings, or one parked on hold during a consult). Each is independent; render
them all and target intents by the call's `id`.

A `CallState` carries everything you render for one call:

| Field | What it is |
|---|---|
| `id` | server call id — target intents (`answer`, `mute`, `hangup`, …) with it |
| `state` · `direction` | lifecycle (`CallLifecycle`) and inbound/outbound (`CallDirection`) |
| `source` | how the call originated (`CallSource`) — `queue`, `transfer`, `dialer`, `callback`, `conference`, `api`, `webrtc` |
| `from` · `to` | the two numbers — the far party is `from` on an inbound call, `to` on an outbound one; `queueName` is set when the call came via a queue |
| `anonymous` | the far party withheld their number — render it as *Anonymous* |
| `muted` · `onHold` · `recording` | toggles you reflect in the in-call UI |
| `recordingId` · `recordingTags` · `recordingFlagged` | the active recording's id (target `stopRecording`/`flagRecording`/`setRecordingTags` with it), its tags, and the flagged toggle |
| `webrtcOffer` | the SDP to answer — set only while `RINGING` |
| `iceServers` | STUN/TURN servers your media leg applies when answering the offer — for off-host NAT traversal |
| `establishedAt` | unix seconds when the call bridged (`0` until then) — once it's non-zero, your live call timer is `now − establishedAt` |

Unlike `CallRecord` and `SmsConversation`, a live `CallState` has **no contact label** — to show a name rather
than the raw `from`/`to` number, resolve it against `agent.phonebook`.

`state` walks the `CallLifecycle` enum — you mostly branch on `RINGING` (to answer) and watch for the call
leaving the list, but the full progression is:

| `CallLifecycle` | What it means |
|---|---|
| `INIT` | created, not yet ringing — a nascent outbound leg |
| `RINGING` | ringing; `webrtcOffer` is set — answer it |
| `IN_PROGRESS` | answered, connecting the media |
| `BRIDGED` | connected, audio flowing both ways (`establishedAt` is now set) |
| `COMPLETED` | ended normally |
| `FAILED` | could not be established |

At the end the server emits a final `callUpsert` carrying the terminal `state` — `COMPLETED` (ended normally)
or `FAILED` (no answer, busy, or error) — and *then* the `callRemove` that drops the call. So to record a
call's outcome, read the last `state` you saw for that id before it left `activeCalls`. Branch on the named
enum, never the raw integer — the numbers are an implementation detail. The names differ by SDK:
`CallLifecycle.RINGING` in TypeScript, `CallLifecycle_CALL_LIFECYCLE_RINGING` in Go.

## An SMS conversation, end to end

Messaging rides the same patch stream but is **independent of calls** — you can send and receive SMS with no
active call; it's a separate channel. Each `SmsConversation` is a **summary** of one thread — an `id` (target
`markConversationRead` / `setConversationOpen` / `getSmsThread` with it), the `peer` (plus a `contactLabel`, the
phonebook name for that number when known), a `lastText` preview with its `lastDirection` and `lastTs`, an
`unread` count, and an `open` (unresolved) flag. The thread is keyed by `peer` — there's one conversation per
number — while the `id` is the backend conversation id you pass to the intents above; `id` can be empty until
the backend assigns it, which is why `getSmsThread` also accepts the `peer`. Sort the thread list by `lastTs`,
and sum `unread` across it for a total messaging-tab badge. The full message history comes from the
`getSmsThread` fetch — a list of `SmsMessage`s, each with an `id` (a stable key for your list), `direction`
(`INBOUND` = received, `OUTBOUND` = sent), `from` / `to`, `text`, `ts`, and a `state` — a **display-only**
string (`received` / `sent` / `delivered` / `failed` / `scheduled`). Show `state` as a delivery label; don't
branch on it as a typed enum — it's free-form text.

All timestamps in `AgentView` — `ts`, `lastTs`, `establishedAt`, and history `time` — are **unix seconds**;
multiply by 1000 for a JavaScript `Date` (`durationMs`, by contrast, is already milliseconds).

| Step | Patch | What you render |
|---|---|---|
| 1. Inbound SMS arrives | `smsUpsert` — `SmsConversation{ lastDirection: inbound, unread: 1 }` | the thread, with an unread badge |
| 2. You read it (`markConversationRead`) | `smsUpsert` — `unread: 0` | the badge cleared |
| 3. You reply (`sendSms`) | `smsUpsert` — `lastDirection: outbound, lastText` | your reply atop the thread |
| 4. You resolve it (`setConversationOpen(id, false)`) | `smsUpsert` — `open: false` | the thread marked closed |
| 5. Conversation dropped | `smsRemove` — the **peer** (the thread key) | remove it from the list |

Same loop as calls: **send an intent, the server reduces it, the `smsUpsert` reflects it.**

## A conference, end to end

A `Conference` has a `members` list (agents or external numbers), an `iAmModerator` flag, and a `state`
(`created` → `finishing` → `finished`). Each `conferenceUpsert` carries the **whole** conference (every member),
not a per-member delta — re-render the panel from it. The steps below show only what changed:

| Step | Patch | What you render |
|---|---|---|
| 1. You start one (`startConference`) | `conferenceUpsert` — `Conference{ iAmModerator: true, members: [you, the other party] }` | the conference panel + moderator controls |
| 2. You add a member (`addConferenceMember`) | `conferenceUpsert` — a member, `state: pending` → `added` | the joining participant |
| 3. Moderator holds / mutes a member | `conferenceUpsert` — that member's `onHold` (or muted) flips | the updated member row |
| 4. A member drops / you kick one | `conferenceUpsert` — `state: removing` → `removed` | the member leaving |
| 5. You end it (`endConference`) | `conferenceRemove` — the conference id | clear the panel |

Gate the moderator controls on `iAmModerator` (see the [Intents reference](./intents)); `leaveConference` drops
only your own leg.

Each `ConferenceMember` carries an `id` (target `kick` / `hold` / `mute` with it), a `display` label, a `state`
(`pending` → `added` → `removing` → `removed`, or `failed`), an `onHold` flag, `moderator` / `isMe` flags for
badges, and a `callId` (the member's call leg — for your own `isMe` member it matches your `CallState.id`); the
participant is an agent (`agentId`) or an external `number`. `Conference.myMemberId` is your own member id —
that's the leg `leaveConference` drops.

Both `Conference.state` and `ConferenceMember.state` are **free-form strings** (like the SMS `state`), not
typed enums — render them as labels and don't branch on them as enum constants. (The call `state`, by
contrast, *is* the typed `CallLifecycle` enum — branch on that one by name.)

A conference is **separate state** from the call: the agent's own call leg stays in `activeCalls` for the
duration, so you keep driving your own `mute`/`hold`/`hangup` there while the `Conference` tracks the members.

## Wrap-up, end to end

When a call ends the server may open **after-call work** (ACW) — a timed window for the agent to finish
notes before the next call. It arrives as `wrapUp` patches carrying a `WrapUpStatus`:

| Step | Patch | What you render |
|---|---|---|
| 1. Call ends, ACW opens | `wrapUp` — `WrapUpStatus{ active: true, remainingSeconds, lastCallType }` | the wrap-up panel + countdown |
| 2. Countdown | *(local timer from `remainingSeconds`)* | the timer ticking down |
| 3. Agent extends (`wrapUpExtend(30)`) | `wrapUp` — `remainingSeconds` bumped up | the timer jumps |
| 4. Agent finishes early (`wrapUpCancel`) or the timer hits 0 | `wrapUp` — `active: false` | clear the panel; the agent is ready again |

Render the countdown **locally** from `remainingSeconds` (a `setInterval`/ticker) — the server doesn't tick it
per second; reconcile to the value each `wrapUp` patch carries (e.g. after an extend). Show the extend / cancel
controls only when `canExtend` / `canCancel` are set; `lastCallType` labels which call the wrap-up belongs to.

## Consuming it

You rarely touch `StateUpdate` directly — the SDK's `StateCache` does the folding and hands you the current
`AgentView`:

```ts
const bc = BabelconnectClient.connect({ serverUrl, token });
bc.subscribe((view) => {
  // view is the full, current AgentView after every update
  render(view.agent, view.activeCalls, view.sms);
});
bc.register(); // load the agent block + config, arm the media path
```

```go
cli, _ := bcclient.Dial(ctx, bcclient.Options{Addr: addr, Token: token})
cli.Subscribe(func(v *bcv1.AgentView) {
    // v is the full, current AgentView after every update
    render(v.Agent, v.ActiveCalls, v.Sms)
})
cli.Register("webrtc") // load the agent block + config, arm the media path
```

That `AgentView` has six top-level fields:

| Field (TS · Go) | Type | Holds |
|---|---|---|
| `agent` · `Agent` | `AgentInfo` | presence, agent number, capabilities, `presenceOptions`, phonebook snapshot |
| `activeCalls` · `ActiveCalls` | `CallState[]` | live calls (ringing / in-progress) |
| `wrapUp` · `WrapUp` | `WrapUpStatus` | the after-call-work countdown |
| `sms` · `Sms` | `SmsConversation[]` | SMS conversation summaries |
| `conferences` · `Conferences` | `Conference[]` | active conferences (usually 0 or 1) |
| `config` · `Config` | `AppConfig` | per-deployment feature flags |

The `agent` block (`AgentInfo`) is the one you render most — identity, presence, and the outbound-call setup:

| Field | What you render |
|---|---|
| `id` · `accountId` | stable agent + account identifiers — key correlation/logging on these, not the names |
| `name` · `username` · `accountName` | who's signed in (display name, login, account) |
| `number` | the agent's external phone number |
| `presence` | the coarse `AgentState` bucket — for a status icon / colour |
| `presenceName` · `presenceLabel` | the exact current presence (e.g. `break` / "Break") |
| `presenceOptions` | the presence values the agent may switch to — feed your presence selector |
| `lineBlocked` | involuntary ACD block (busy/unreachable/declined/dnd); render Reset when true |
| `webrtcEnabled` | whether the in-browser phone is armed |
| `displayAs` · `availableNumbers` | the selected outbound caller ID, and the numbers to choose from |
| `canRecord` · `availableTags` · `alwaysRecordOutbound` | recording capability, the tags you may apply, and whether outbound is always recorded |
| `phonebook` | a register-time snapshot of dial-from contacts + recent numbers |

The coarse `presence` is the **`AgentState`** enum — one of `OFFLINE`, `AVAILABLE`, `IN_CALL`, `RINGING`,
`WRAP_UP`, `PAUSED`, or `BUSY` — server-computed for a status icon/colour. (Don't confuse it with the agent's
*chosen* presence, `presenceName` / `presenceOptions`, which drives the presence selector.) Branch on the enum
by name — `AgentState.AVAILABLE` in TypeScript, `AgentState_AGENT_STATE_AVAILABLE` in Go.

**Three pieces of availability.** Agent availability is three distinct fields, and conflating them is a common
bug — keep them apart:

| Field | What it is | Who sets it |
|---|---|---|
| `presence` | the coarse `AgentState` enum — for the status icon/colour | server-computed |
| `presenceName` · `presenceLabel` | the agent's *chosen* presence (e.g. `break`) | the agent picks it |
| `lineBlocked` | an **involuntary** ACD line block — the platform stopped routing calls (the external phone went busy/unreachable, declined, or is on DND), recoverable with `resetLineStatus` | the platform sets it |

`lineBlocked` is the flag a "Reset line" action gates on — **not** `presence == BUSY`. A `BUSY` presence can be
*voluntary* (the agent, or a sign-out-as-busy, chose it), which needs no Reset; only an involuntary block does,
and only that sets `lineBlocked`. Render the line-blocked banner + Reset (`resetLineStatus` — see the
[Intents reference](./intents)) when `lineBlocked` is true, and clear them when it flips back to false.

The two paths look alike in the coarse `presence` but differ in `lineBlocked`:

- **Agent chooses pause "break"** → `presenceName` becomes `break` and `presence` shifts (to `PAUSED`);
  `lineBlocked` stays **false**. This is voluntary — show the pause state, but **no** Reset.
- **Platform marks the agent busy** (the line went busy/unreachable/declined) → `lineBlocked` becomes
  **true**. This is involuntary — render the banner + Reset so the agent can clear it.

The list fields — `activeCalls`, `sms`, `conferences` — are always present as (possibly empty) arrays, so you
can iterate them without null checks; `agent` and `config` populate once you `register`.

See the **[TypeScript](../typescript/quickstart-client)** and **[Go](../go/getting-started)** quickstarts for
the language specifics, and the **[Events API reference](pathname:///reference/events/)** for the exact message
and payload schemas. The **[Recipes](../guides/recipes)** guide turns this state into ready-made UI patterns.
