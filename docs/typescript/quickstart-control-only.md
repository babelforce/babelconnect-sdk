---
title: Control only (no audio)
sidebar_label: Control only
sidebar_position: 3
description: Run the client without a WebRTC leg — for dashboards, back-end services, SMS, and presence.
---

# Control only (no audio)

Pass `mediaFactory: null` to skip the WebRTC leg entirely. The client still opens the control stream, mirrors
`AgentView`, and accepts every non-audio intent — it just never negotiates audio. This is the right mode
whenever audio is handled elsewhere (or not at all):

:::caution `null`, not omitted
It must be explicitly `null`. **Omitting** `mediaFactory` defaults to the browser audio leg
(`browserMediaFactory`) — so leaving it out does *not* give you a control-only client.
:::

```ts
import { BabelconnectClient } from "@babelforce/babelconnect-sdk";

const bc = BabelconnectClient.connect({ serverUrl, token, mediaFactory: null });

bc.subscribe(render);                       // render(AgentView) on every update
bc.sendSms("+49301234567", "On my way!");
bc.setPresence("available");
```

This runs in **Node 20+** as well as the browser, with no WebRTC dependency.

:::caution Reachability: `register()` still marks the agent WebRTC-reachable
`register()` does two jobs — it loads the agent's reference data (presence options, caller-ID numbers,
contacts, feature config) **and** marks the agent **WebRTC-reachable** on the backend so its call leg routes
to this client. A control-only client has **no media leg to carry that audio**, so a call ringing here can't
be answered — it rings at a client that can't carry audio and fails on answer. If this agent takes live calls,
a call-taking control-only client **must** pair `register()` with **`setWebrtc(false)` + `setAgentNumber(...)`**
(see below) to bridge calls to an external phone instead. If the agent never takes calls here — a pure
wallboard, or an outbound-only automation whose audio lives elsewhere — you can leave it; no audio leg simply
means no audio.
:::

## When to use it

- **Supervisor / wallboard dashboards** — subscribe to `AgentView` and render live call, presence, and queue
  state without ever touching audio.
- **Back-end services** — a Node process that reacts to state (logging, analytics, automations) or drives
  intents (place calls, send SMS) on behalf of agents.
- **CLI / tooling** — scripts that fetch history or contacts, set presence, or send SMS.
- **Bring-your-own audio** — the call's audio is handled by a separate device or stack, and this client only
  drives control + state.

## What works without audio

Everything except answering a call with in-browser audio:

- ✅ Observe all state — calls, presence, SMS, conferences, wrap-up, config — via `subscribe`.
- ✅ Non-audio intents — `setPresence`, `transfer`, `hangup`, `sendSms`, `markConversationRead`, recording
  controls, conference management, etc.
- ✅ Unary fetches — history, SMS threads, contacts.
- ⚠️ **Audio answering** — there's no media leg, so this client won't produce mic/speaker audio for a call. It
  still *sees* the ringing call in `AgentView`; it just can't carry the audio itself.
- ⚠️ **Placing calls** still works as an intent, but the agent's own audio has to live elsewhere — turn WebRTC
  off (`setWebrtc(false)`) so the backend bridges the call to the agent's external `setAgentNumber`.

The omission is **silent by design**: a control-only client simply doesn't act on the WebRTC offer. If you need
audio, supply a `mediaFactory` (the browser default, or your own `Media` implementation) instead of `null`.

See [`ConnectOptions`](./api/index/interfaces/ConnectOptions) for the full set of connect options,
[State & events](../concepts/state-and-events) for what the `subscribe` callback delivers, and the
[Intents reference](../concepts/intents) for everything you can send. Doing the same from a Go service? See
[Back-end automation (no audio)](../go/quickstart-control-only).
