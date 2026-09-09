---
title: Glossary
sidebar_label: Glossary
sidebar_position: 3
description: The core babelconnect terms — AgentView, patches, intents, presence, wrap-up, transfers — in one place.
---

# Glossary

The vocabulary the rest of these docs use. Each term links to where it's covered in depth.

### AgentView
The server-owned, per-agent **state** — calls, presence, SMS, conferences, wrap-up, and feature config. Your UI
is a pure function of it (`UI = f(AgentView)`). You render it; you never assemble it. See
[State & events](./state-and-events).

### Snapshot
The **full `AgentView`** the server sends once, when the control stream opens. Everything after it is a
[patch](#patch). See [the stream](./state-and-events#the-stream-snapshot-then-patches).

### Patch
One **entity-level delta** folded into `AgentView` (a `oneof` of ten — `callUpsert`, `wrapUp`, `smsUpsert`, …).
Upserts replace by id; removes carry just the key. See [the patch types](./state-and-events#the-patch-types).

### Intent
A **typed command** you send (`placeCall`, `mute`, `transfer`, `sendSms`, …). The server reduces it and the
result comes back as a [patch](#patch) — you never mutate state directly. See the
[Intents reference](./intents).

### StateCache
The SDK's in-memory mirror that applies the [snapshot](#snapshot) and folds each [patch](#patch), then notifies
your subscriber with the current `AgentView`. One lives in each SDK.

### seq
A **monotonic sequence number** on every state update. A gap means a patch was missed and the view is stale —
[resubscribe](../guides/errors-and-reconnects#2-sequence-gaps-ongap) for a fresh snapshot.

### Control plane / media plane
**Control** is gRPC(-web) — the state stream and your intents. **Media** is WebRTC — the call audio,
negotiated separately. They travel independently; see [the intro](../intro#control-and-audio-travel-on-separate-planes).

### Control-only
Running the client **without a media leg** (`mediaFactory: null` in TS, the synthetic leg in Go) — for
dashboards, SMS, presence, and back-end automation. See
[Control only](../typescript/quickstart-control-only).

### Register
The client action (`register()` in TS, `Register(...)` in Go) that **announces the agent as reachable** and
loads its deployment data — presence options, caller-ID numbers, phonebook, feature config. It also marks the
agent **WebRTC-reachable** on the backend, so a [control-only](#control-only) client that takes calls pairs it
with `setWebrtc(false)` + an [agent number](#agent-number). See [Session & identity](./intents#session--identity).

### display-as
The **outbound caller ID** the consumer sees on a call the agent places. Chosen from
`agent.availableNumbers` via `setDisplayAs`. See [Session & identity](./intents#session--identity).

### Agent number
The agent's **external phone**. When the in-browser WebRTC phone is off, the backend bridges the call to this
number instead. Set with `setAgentNumber`; see [where calls ring](./intents#session--identity).

### Presence
The agent's availability, surfaced as three facets: `presence` is the **coarse, server-computed** `AgentState`
**enum** (`available` / `in_call` / …) for a status icon; `presenceName` is the agent's **chosen** presence
(set via `setPresence`, e.g. `break`); and [`line_blocked`](#line_blocked) is an **involuntary** block the
platform sets — separate from the chosen one. See [State & events](./state-and-events) and
[Set presence](./intents#session--identity).

### line_blocked
An **involuntary** block set by the [ACD](#acd-state) / platform (busy / unreachable / declined / dnd),
distinct from a chosen `busy` [presence](#presence) the agent selected; cleared via Reset (`resetLineStatus`).
See [State & events](./state-and-events).

### ACD state
The **platform's routing state** for the agent — what the ACD (automatic call distributor) thinks of the
agent's availability for distributing calls. It can differ from the agent's **chosen** [presence](#presence):
e.g. the agent picks `available` but the ACD has marked the line blocked (see [`line_blocked`](#line_blocked)).

### Wrap-up (ACW)
**After-call work** — the timed window after a call ends. Surfaced as a `wrapUp` patch with a countdown you can
extend or cancel. See the [wrap-up walkthrough](./state-and-events#wrap-up-end-to-end).

### Moderator
The agent who starts a conference. Moderator-only controls (kick / hold / mute a member, end) are gated on
`Conference.iAmModerator`. See [Conferencing](./intents#conferencing).

### Warm / blind transfer
**Warm** (attended) is a two-step consult — pull the target into a conference, talk privately, then complete.
**Blind** (cold) is a single hand-off, no consult. See [Transfer](./intents#calls).

### Callback
A **scheduled outbound call the agent accepts** — it surfaces like an inbound call (`RINGING`, with
`CallState.source` = `callback`) and waits for `answerCall` / `hangup` instead of auto-answering, even when
`autoAnswer` is on. Not to be confused with a programming callback (`onError`, `subscribe`). See
[A call, end to end](./state-and-events#a-call-end-to-end).

### Notification
A **transient CTI screen-pop** — the one patch arm that isn't stored. The TypeScript client hands it to your
`onNotification` callback and forgets it. See [the patch types](./state-and-events#the-patch-types).

### Embed
The prebuilt babelconnect **agent app** dropped into a host page via an `<iframe>` and a `postMessage` bridge,
driven from your CRM — instead of building your own UI. See [Embedding](../typescript/embedding).
