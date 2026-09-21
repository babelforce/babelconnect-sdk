---
title: State & events
sidebar_label: State & events
sidebar_position: 1
description: Read AgentView, apply the snapshot/patch model, and distinguish call state, chosen presence and line blocking.
---

# State & events

The server owns `AgentView`; the SDK mirrors it. Your renderer reads the view, and user actions send
[intents](./intents). The [Events reference](pathname:///reference/events/) gives the exact schemas.

## The stream: snapshot, then patches

`Subscribe` sends a `StateUpdate` containing one of these messages:

| Message | Effect |
|---|---|
| `snapshot` | Replace the entire cached `AgentView` on connection. |
| `patch` | Apply one entity change, then notify renderers. |
| `error` | Report a command rejection or warning without changing state. |
| `keepalive`, `ping` | Transport liveness; SDKs suppress render callbacks and reply to pings. |

```text
snapshot → patch → patch → … → replacement connection → new snapshot
```

The immediate SDK `subscribe` callback returns its current cache, possibly empty. It is separate
from the network snapshot and does not establish connection health.

## `seq`: ordering and gap recovery

A snapshot establishes `seq`; each patch increments it, including transient notifications.
Errors, keepalives and pings do not advance the state sequence. The cache reports a patch whose
sequence is not the previous value plus one, but still applies it. Mark the view stale and
[reconnect for a fresh snapshot](../guides/errors-and-reconnects#2-sequence-gaps-ongap).

**Current TypeScript caveat:** `BabelconnectClient` sends notification patches directly to
`onNotification` without advancing its cache sequence. The following state patch can therefore
raise `onGap` even though the stream delivered every message. Go passes notifications through its
cache for sequencing, but has no dedicated notification callback. Neither SDK replays missed
notifications during snapshot recovery.

## The patch types

Upserts replace the **whole entity**, including when only one field changed. Calls and conferences
use `id`; SMS conversations use `peer`. Removes carry that key.

| Patch | Effect |
|---|---|
| `agent` | Replace `AgentInfo`. |
| `callUpsert`, `callRemove` | Add/replace or remove a call by ID. |
| `wrapUp` | Replace `WrapUpStatus`. |
| `smsUpsert`, `smsRemove` | Add/replace or remove a conversation by peer. |
| `conferenceUpsert`, `conferenceRemove` | Add/replace or remove a conference by ID. |
| `config` | Replace `AppConfig`. |
| `notification` | Transient event; never stored in `AgentView`. |

Notifications carry `kind`, `title`, `body`, `ts` and JSON-encoded `dataJson`. Handle them when
received through TS `onNotification`, and handle malformed JSON in your integration. They will not
be present in a later view.

`config` owns feature gates: `calls`, `messaging`, `history`, `phonebook`, `account`, `outbound`,
and `cti` each have `enabled`. Use `calls.allowTransfer` and `calls.allowConference` for finer call
controls; `cti.screenPop` and `cti.emitCallEvents` govern CTI; `account.allowDeviceSwitch` and
`account.showStatus` govern device and status UI. `serverVersion` identifies the server build.
In TS, read optional fields defensively (`view.config?.calls?.enabled`); Go's generated getters
are nil-safe. Registration loads deployment data in several updates, so don't assume it arrives
atomically. Exact fields: [StateUpdate](../protocol/grpc#babelconnect-v1-StateUpdate) and
[Patch](../protocol/grpc#babelconnect-v1-Patch).

## A call, end to end

| Event | Render or act |
|---|---|
| `callUpsert` with `RINGING` | Show the caller and Answer/Reject controls when an offer exists. |
| Agent clicks Answer | SDK negotiates media and sends the answer; wait for state. |
| `IN_PROGRESS` / `BRIDGED` | Show in-call controls and reflect mute/hold/recording flags. |
| Call ends and `callRemove` arrives | Remove its card; wrap-up may follow. |

Auto-answer applies only to the agent's own outbound ringing offer and excludes
`CallSource.CALLBACK`. It defaults on in TS and off in Go. Inbound calls and callbacks need
explicit acceptance. `activeCalls` is a list: an agent may have a call on hold while another rings.
Render every call and target its ID.

| `CallState` field | Meaning |
|---|---|
| `id` | Target for call commands. |
| `state`, `direction`, `source` | Typed lifecycle, inbound/outbound direction and origin (API, WebRTC, queue, transfer, dialer, conference or callback). |
| `from`, `to`, `queueName`, `anonymous` | Far party is `from` inbound, `to` outbound; display Anonymous when withheld. |
| `muted`, `onHold`, `recording` | Server state for toggle controls. |
| `recordingId`, `recordingTags`, `recordingFlagged` | Active recording metadata; SDK recording methods address the **call ID**. |
| `webrtcOffer`, `iceServers` | SDP offer and STUN/TURN configuration for answering; a ringing call may lack an offer. |
| `establishedAt` | Unix seconds when bridged, or zero; use `now − establishedAt` for a timer. |

A live call has no contact label; look up its number in `agent.phonebook`, skipping labels equal
to `"recent"`. History records and SMS summaries can carry contact labels directly.

| Lifecycle | Meaning |
|---|---|
| `INIT` | Created, not yet ringing. |
| `RINGING` | Awaiting acceptance. |
| `IN_PROGRESS` | Answered/connecting. |
| `BRIDGED` | Connected state; verify audible media separately. |
| `COMPLETED`, `FAILED` | Normal or unsuccessful ending, followed by removal. |

Use named enums (`CallLifecycle.RINGING` in TS,
`CallLifecycle_CALL_LIFECYCLE_RINGING` in Go). A terminal upsert can report the outcome before
removal; don't assume every ending exposes one. Fetch history when you need durable records.

## An SMS conversation, end to end

SMS works independently of calls. Each `SmsConversation` summarizes a thread keyed by `peer`:
`contactLabel`, `lastText`, `lastDirection`, `lastTs`, `unread` and `open` describe its latest state.
Its `id` targets `markConversationRead` and `setConversationOpen`; that ID can be empty until assigned.
Only `getSmsThread` also accepts the peer number.

| Action | Update |
|---|---|
| Receive SMS | `smsUpsert` updates the preview and unread count. |
| Mark read | `smsUpsert` clears unread. |
| Send a reply | `smsUpsert` updates the latest outbound text. |
| Resolve/reopen | `smsUpsert` changes `open`. |
| Remove conversation | `smsRemove` carries the peer. |

Sort summaries by `lastTs`, sum `unread` for the badge, and fetch the full thread separately.
`SmsMessage` has a stable `id`, direction, from/to, text, timestamp and a display-only `state`
(such as received, sent, delivered, failed or scheduled). Render that string without assuming a
closed enum. Messages are returned oldest first.

Timestamps (`ts`, `lastTs`, `establishedAt`, history `time`) are Unix seconds. Multiply by 1000 for
a JavaScript `Date`; `durationMs` is already milliseconds.

## A conference, end to end

Each `conferenceUpsert` replaces the full conference and member list. Starting a conference adds
you and the other party; inviting adds a pending member; hold/kick updates the member; ending
removes the conference. `leaveConference` drops only your own leg.

| Field | Use |
|---|---|
| `Conference.iAmModerator` | Gate moderator controls. |
| `Conference.myMemberId` | Your member ID. |
| `Conference.state` | Display label, commonly created → finishing → finished. |
| Member `id`, `display`, `agentId` / `number` | Target ID, label and participant identity. |
| Member `state`, `failureReason` | Display joining/added/removing/removed/failed and any failure reason. |
| Member `onHold`, `moderator`, `isMe` | Hold state and badges; there is no readable member muted flag. |
| Member `callId` | Member's call leg; your own member corresponds to your `CallState.id`. |

Conference and member states are free-form strings, not typed enums. The agent's own call remains
in `activeCalls`: use call commands for your own mute/hold/hangup and conference commands for members.
See the [conference recipe](../guides/recipes#a-conference-panel).

## Wrap-up, end to end

A `wrapUp` patch opens after-call work with `active`, `remainingSeconds` and `lastCallType`.
Render a local countdown; updates are not guaranteed every second. Reconcile to new server values,
including extensions. A local zero is only a display value: wait for `active: false` to confirm
wrap-up ended. Show Extend/Cancel only when `canExtend`/`canCancel` allow them.

## Consuming it

| `AgentView` field (TS · Go) | Holds |
|---|---|
| `agent` · `Agent` | Identity, presence, routing, capabilities and reference data. |
| `activeCalls` · `ActiveCalls` | Calls keyed by ID. |
| `wrapUp` · `WrapUp` | After-call work. |
| `sms` · `Sms` | Conversation summaries keyed by peer. |
| `conferences` · `Conferences` | Conferences, usually zero or one. |
| `config` · `Config` | Deployment feature settings. |

TS lists are always arrays; message blocks such as `agent` and `config` can be absent. Go getters
handle nil. Treat callback views as read-only copies and keep render work brief.

| `AgentInfo` field | Use |
|---|---|
| `id`, `accountId` | Stable identity; names are display data. |
| `name`, `username`, `accountName` | Signed-in identity labels. |
| `number`, `webrtcEnabled` | External number and WebRTC routing preference. |
| `displayAs`, `availableNumbers` | Selected and allowed outbound caller IDs. |
| `canRecord`, `availableTags`, `alwaysRecordOutbound` | Recording controls, tags and automatic recording policy. |
| `phonebook` | Registration-time contacts and recent numbers. |

**Availability has three separate meanings:**

| Field | Meaning and action |
|---|---|
| `presence` | Server-computed `AgentState`: OFFLINE, AVAILABLE, IN_CALL, RINGING, WRAP_UP, PAUSED or BUSY. Use for a status indicator. |
| `presenceName`, `presenceLabel`, `presenceOptions` | Chosen presence and the available choices. Pass an option's `name` to `setPresence`; display its `label` and `available` flag. |
| `lineBlocked`, `lineBlockedReason` | Involuntary routing block: unreachable, busy, declined or dnd. Reason is empty when not blocked. Offer Reset only when `lineBlocked` is true. |

Chosen busy or a break is voluntary; it needs a presence change, not a line reset. A missed call
or transfer can leave an `unreachable` block that lifts after a short wrap-up. Render the reason
and countdown so the agent knows why calls stopped. The transferring agent may separately see
`transfer_target_no_answer`; a failed conference member carries `failureReason`.

An outbound `agent_not_available` rejection can mean either a blocked line or an unavailable
chosen presence. Check `lineBlocked` first. Use the [banner recipe](../guides/recipes#a-line-blocked-banner)
and [error reference](../protocol/error-codes#outbound--answering) for recovery.
