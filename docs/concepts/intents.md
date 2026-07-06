---
title: Intents reference
sidebar_label: Intents reference
sidebar_position: 2
description: Every typed intent an SDK can send — what it does, the state it produces, and the TypeScript and Go method names.
---

# Intents reference

You never mutate agent state directly. You send a typed **intent**, the server reduces it, and the result
comes back as a **[patch](./state-and-events#the-patch-types)** on the state stream. This page is the full
catalogue of intents — one per `Command` in the `babelconnect.v1` contract — with the **TypeScript** and
**Go** method that sends each one, and the part of `AgentView` it moves.

:::tip The loop
Every row is the same shape: **you call the method → the server reduces it → a patch updates `AgentView`.**
Read [State & events](./state-and-events) first if that loop isn't familiar yet.
:::

Method names differ only by language convention — TypeScript is `camelCase` on
[`BabelconnectClient`](../typescript/api/index/classes/BabelconnectClient), Go is `PascalCase` on the
`bcclient.Client`. They map one-to-one.

## Session & identity

| Intent | What it does | Result in `AgentView` | TypeScript · Go |
|---|---|---|---|
| Register | Announce reachability + arm the media path, and load the agent's deployment data (presence options, caller-ID numbers, phonebook, feature config). | `config`, `agent` | `register(caps?)` · `Register(caps...)` |
| Set WebRTC | Toggle the in-browser phone on/off. | `agent` | `setWebrtc(on)` · `SetWebrtc(on)` |
| Set agent number | Set the external phone to bridge to. | `agent` | `setAgentNumber(num)` · `SetAgentNumber(num)` |
| Set presence | Switch presence (`"available"` or a pause reason). | `agent` | `setPresence(name)` · `SetPresence(name)` |
| Set display-as | Choose the outbound number presented to the consumer. | `agent` | `setDisplayAs(num)` · `SetDisplayAs(num)` |

**Presence values** are deployment-defined: read the list from `AgentView.agent.presenceOptions` — each has a
`name` to pass to `setPresence`, a display `label`, and an `available` flag — rather than hard-coding pause
reasons. Don't confuse this with `agent.presence` (an `AgentState`): that's the **coarse, server-computed**
status bucket for a status icon — `available`, `in_call`, `ringing`, `wrap_up`, `paused`, `busy`, `offline` —
which you render but never set. `setPresence` moves the agent's *chosen* presence (reflected in `presenceName`
/ `presenceLabel`); the server derives the `presence` bucket from that plus what the agent is actually doing.

**Outbound caller ID:** the numbers the agent can present are `AgentView.agent.availableNumbers`; the current
selection is `agent.displayAs`, and `setDisplayAs` changes it.

**Number format:** phone numbers (`to`, `from`, `displayAs`, transfer targets) are **E.164** — a leading `+`,
country code, then the national number, no spaces or punctuation (e.g. `+49301234567`), as in the examples.

**Where calls ring:** `setWebrtc` and `setAgentNumber` choose the agent's audio path. With WebRTC **enabled**
(`setWebrtc(true)`) the agent's call leg routes to the in-browser phone; with it **disabled**, the backend
bridges the call to the agent's external number (`setAgentNumber`) instead. `AgentView.agent.webrtcEnabled`
tells you which is active. An agent needs **one of the two** — WebRTC on, or an agent number set — to be
reachable; with neither, calls can't reach them.

**Register capabilities:** TypeScript defaults the list, so `register()` sends `["webrtc"]`; Go is variadic
with no default, so pass it explicitly — `Register("webrtc")`. Note that **registering marks the agent
WebRTC-reachable** on the backend regardless of the list, so its call leg routes to this client. A
**control-only** client has no media leg to carry that audio — follow `register()` with `setWebrtc(false)` +
`setAgentNumber(...)` to bridge calls to an external phone instead (see
[Control only → reachability](../typescript/quickstart-control-only)).

## Calls

| Intent | What it does | Result in `AgentView` | TypeScript · Go |
|---|---|---|---|
| Place call | Dial out; the agent's own leg auto-answers. Go's positional args are `to` (destination), `displayAsTo` (what the **consumer** sees), `displayAsFrom` (what the **agent** sees), `record`. | `callUpsert` | `placeCall(to, opts?)` · `PlaceCall(to, displayAsTo, displayAsFrom, record)` |
| Answer | Accept a `RINGING` call by id. | `callUpsert` (→ in-progress) | `answerCall(id)` · `Answer(id)` |
| Hangup | End / reject a call by id. | `callRemove` | `hangup(id)` · `Hangup(id)` |
| Mute | Mute or unmute your leg. | `callUpsert` | `mute(id, on)` · `Mute(id, on)` |
| Hold | Hold or retrieve a call. | `callUpsert` | `hold(id, on)` · `Hold(id, on)` |
| Send digits | Send DTMF into the call. | — (tones only) | `sendDigits(id, digits)` · `SendDigits(id, digits)` |
| Transfer | Hand the call to a number, agent, or queue (`warm` = attended). | `callUpsert` / `callRemove` | `transfer(id, to, opts?)` · `Transfer(id, to, agentID, applicationID, warm)` |
| Reset line status | Clear a blocked line (busy / unreachable). | `agent` | `resetLineStatus()` · `ResetLineStatus()` |

**Answering:** `answerCall(id)` does more than flip state — the SDK takes the ringing call's `webrtcOffer`,
runs it through your media leg to produce the WebRTC SDP answer, and sends that. So answering needs a media
leg; a control-only client (no `mediaFactory`) raises [`no_media`](../guides/errors-and-reconnects#1-command-rejections-onerror) instead.

**Place-call options:** `to` is the **destination** number being dialled; `displayAsTo` is the service number
the **consumer** sees (the outbound caller ID); `displayAsFrom` is the number shown to the **agent**.
`record: true` starts the recording from answer (instead of calling `startRecording` later). In TypeScript
these are `opts` keys (`placeCall(to, { displayAsTo, displayAsFrom, record })`); in Go they're **positional**,
in this order — `PlaceCall(to, displayAsTo, displayAsFrom, record)` — so it's easy to swap the two caller-ID
arguments by mistake. The TypeScript `opts` also accepts a `session` map — opaque CTI correlation, the same
keys the embed bridge sets via `session.set` (see [SMS `session`](#messaging-sms)); the Go signature omits it.

**Transfer targets:** set the field that matches the destination — an external **number** as `to`, another
**agent** as `agentId`, or a **queue / voice application** as `applicationId`. In TypeScript, `to` is the
second argument and `agentId` / `applicationId` are `opts` keys (`transfer(id, to, { agentId })`); in Go all
three are positional params — `Transfer(id, to, agentID, applicationID, warm)`. `warm: true` is an attended
(warm) transfer; `false` is blind (cold).

**Warm transfer is a two-step consult.** An attended (`warm: true`) transfer isn't a single call: first
`addConferenceMember` to pull the target into a conference (the customer is parked on hold while you consult
privately), then `transfer(id, …, { warm: true })` to complete — that unholds the customer and drops your own
leg, leaving them connected to the target. Calling the warm transfer before the target is in a conference
returns the `no_conference` [error](../guides/errors-and-reconnects#1-command-rejections-onerror). A blind
(`warm: false`) transfer is the single hand-off, no consult.

Because of that, the two transfers gate on **different** config flags: a **blind** transfer is gated by
`config.calls.allowTransfer` (the cold-transfer action), but a **warm** transfer runs through a conference, so
gate that control on `config.calls.allowConference` — with conferencing disabled there's no consult step, and
the warm transfer can't happen.

**DTMF:** `sendDigits` sends RFC-2833 tones to the far end — valid characters are `0`–`9`, `*`, `#`, and
`A`–`D`. The `digits` string can carry several at once (e.g. `"1234#"`), sent in sequence; it needs an active
call.

**Reset line status:** if the agent's external phone goes **busy, unreachable, or declines** a call, the line
can get stuck so new calls no longer reach the agent. `resetLineStatus` clears that blocked state — confirmed
back via an `agent` presence patch — so they can take calls again.

## Wrap-up (after-call work)

| Intent | What it does | Result in `AgentView` | TypeScript · Go |
|---|---|---|---|
| Extend wrap-up | Add seconds to the ACW countdown. | `wrapUp` | `wrapUpExtend(seconds)` · `WrapUpExtend(seconds)` |
| Cancel wrap-up | End after-call work early. | `wrapUp` | `wrapUpCancel()` · `WrapUpCancel()` |

**Wrap-up:** `wrapUpExtend` adds time to the after-call-work countdown — the TypeScript form **defaults to 30
seconds** (`wrapUpExtend()`), while Go takes an explicit `int32`. Show the extend / cancel controls only when
`wrapUp.canExtend` / `wrapUp.canCancel` are set, and render the countdown **locally** from `remainingSeconds`
(the server doesn't tick it per second; reconcile to each `wrapUp` patch). See the
[wrap-up walkthrough](./state-and-events#wrap-up-end-to-end) for the full sequence.

**Wrap-up (ACW)** is the timed after-call-work window: when a call ends the server may start it, emitting a
`wrapUp` patch with `active: true` and a `remainingSeconds` countdown. Show the extend / cancel controls only
when `WrapUpStatus.canExtend` / `canCancel` are set.

## Recording

| Intent | What it does | Result in `AgentView` | TypeScript · Go |
|---|---|---|---|
| Start recording | Begin recording the current call. | `callUpsert` | `startRecording(id)` · `StartRecording(id)` |
| Stop recording | Stop recording. | `callUpsert` | `stopRecording(id)` · `StopRecording(id)` |
| Flag recording | Toggle the "flagged" tag on the recording. | `callUpsert` | `flagRecording(id)` · `FlagRecording(id)` |
| Set recording tags | Replace the recording's tags. | `callUpsert` | `setRecordingTags(id, tags)` · `SetRecordingTags(id, tags)` |

**Recording:** gate these on `AgentView.agent.canRecord`. The call's `recording` flag, `recordingId`,
`recordingTags`, and `recordingFlagged` reflect the current state; pick tags from `agent.availableTags`. When
`agent.alwaysRecordOutbound` is set, outbound calls record automatically — and `placeCall`'s `record` option
starts recording from answer without a separate `startRecording`.

## Conferencing

| Intent | What it does | Result in `AgentView` | TypeScript · Go |
|---|---|---|---|
| Start conference | Open a conference around the current call. | `conferenceUpsert` | `startConference(hold?)` · `StartConference(hold)` |
| Add member | Invite an agent or a number. | `conferenceUpsert` | `addConferenceMember(opts)` · `AddConferenceMember(agentID, number)` |
| Kick member | Moderator removes a member. | `conferenceUpsert` | `kickConferenceMember(id)` · `KickConferenceMember(id)` |
| Hold member | Moderator holds / unholds a member. | `conferenceUpsert` | `holdConferenceMember(id, on)` · `HoldConferenceMember(id, on)` |
| Mute member | Moderator mutes / unmutes a member. | `conferenceUpsert` | `muteConferenceMember(id, on)` · `MuteConferenceMember(id, on)` |
| End conference | Moderator ends the whole conference. | `conferenceRemove` | `endConference()` · `EndConference()` |
| Leave conference | Hang up only your own leg. | `conferenceUpsert` / `conferenceRemove` | `leaveConference()` · `LeaveConference()` |

**Conferencing:** the agent who calls `startConference` becomes the **moderator** — gate the moderator-only
controls (kick / hold / mute member, end) on `Conference.iAmModerator`. Each member is an agent or an external
number with its own `state` and `onHold`; `endConference` finishes it for everyone, while `leaveConference`
drops only your own leg. `startConference` opens the conference around your **current call** (you need an
active call, or it's rejected with `no_call`); its `hold` flag parks that call while you add members and
consult before bridging them together. You don't have to call it explicitly:
**`addConferenceMember` starts a conference for you if none is active, and that auto-start parks the current
call on hold** — which is why a [warm transfer](#calls) is just `addConferenceMember(target)` then `transfer`,
with no separate `startConference`.

## Messaging (SMS)

| Intent | What it does | Result in `AgentView` | TypeScript · Go |
|---|---|---|---|
| Send SMS | Send a message; optionally a `from` and CTI `session`. | `smsUpsert` | `sendSms(to, text, opts?)` · `SendSms(to, text, from, session)` |
| Set conversation open | Open or close (resolve) a thread. | `smsUpsert` | `setConversationOpen(id, open)` · `SetConversationOpen(id, open)` |
| Mark conversation read | Clear the unread count on a thread. | `smsUpsert` | `markConversationRead(id)` · `MarkConversationRead(id)` |

**SMS `from` & `session`:** `from` is the sending number (which of your numbers the message goes out from);
`session` attaches opaque CTI correlation — the same data the embed bridge sets via `session.set`.

Sending is the same operation on either surface: the `sendSms` stream intent and `POST /v1/agent/sms` send the
identical message, and the unary REST form returns the upserted `SmsConversation` summary directly.

## Reference data (unary — not intents)

These are **request/response** calls, not stream intents: they fetch reference data and return it directly,
without producing a patch. They're also the operations exposed over
[REST/OpenAPI](pathname:///reference/rest/) — `GET /v1/agent/history`, `GET /v1/agent/sms/thread`, and
`GET /v1/agent/phonebook` (plus `GET /v1/agent/state` for the snapshot and `POST /v1/agent/sms` to send a
message), each with the same bearer token (see [Authentication](../guides/authentication)).

| Operation | What it returns | TypeScript · Go |
|---|---|---|
| Get history | Recent call records (paged). | `getHistory(max=50, page=1)` · `GetHistory(ctx, max, page)` |
| Get SMS thread | Messages in one conversation (paged). | `getSmsThread(id, max=50, page=1)` · `GetSmsThread(ctx, id, max, page)` |
| Get phonebook | Contact entries (paged, searchable). | `getPhonebook(max=200, page=1, query='')` · `GetPhonebook(ctx, max, page, query)` |

**Paging** is 1-based offset paging: pass `max` (page size — default 50, or 200 for the phonebook) and `page`
(default 1). The responses
carry only the list — there's no total or `hasMore` — so you've reached the end when a page returns fewer than
`max` items (or none). `getPhonebook` also takes a `query` to filter contacts server-side.

```ts
// Fetch every page — there's no total, so stop on the first short page.
async function allHistory(pageSize = 50) {
  const out = [];
  for (let page = 1; ; page++) {
    const batch = await bc.getHistory(pageSize, page);
    out.push(...batch);
    if (batch.length < pageSize) return out; // a short (or empty) page is the last one
  }
}
```

The Go pattern is identical — loop `GetHistory(ctx, max, page)` (or `GetSmsThread` / `GetPhonebook`),
incrementing `page` until a call returns fewer than `max` records.

**SMS thread:** `getSmsThread`'s `id` is normally the `SmsConversation.id`, but it also accepts the **peer's
phone number** — handy for opening a thread for a contact before any conversation exists yet. Messages come
back **oldest-first**, ready to render top-to-bottom. (`markConversationRead` and `setConversationOpen` need
the actual conversation `id`, though — only `getSmsThread` takes the peer.)

**History entries** (`CallRecord`) carry an `id`, `direction`, `from` / `to` (with a `contact` phonebook label
when known), `time` (unix seconds), `durationMs` (call length in milliseconds), and `hasRecording` + a
`recordingUrl` for playback (set only when `hasRecording`).

**Phonebook** is also available without a fetch: `AgentView.agent.phonebook` is a register-time snapshot
(dial-from contacts + recent numbers). Each `PhonebookEntry` is just a `label` + `number`, where `label` is
the contact name — or the literal `"recent"` for a recently-dialed number, so you can separate the two in the
UI. Use `getPhonebook` for a paged, searchable refresh.

## See also

- **[State & events](./state-and-events)** — the snapshot→patches model these intents feed into.
- **[Recipes](../guides/recipes)** — copy-paste UI patterns built from these intents.
- **[TypeScript quickstart](../typescript/quickstart-client)** · **[Go quickstart](../go/quickstart-client)** — sending intents in context.
- **[gRPC / proto reference](../protocol/grpc)** — the exact `Command` and `Patch` message shapes.
