---
title: Programmatic client (with audio)
sidebar_label: Programmatic client
sidebar_position: 2
description: Connect, mirror AgentView, and place a call with a native WebRTC audio leg.
---

# Programmatic client (with audio)

The programmatic client mirrors the agent's `AgentView` and lets you send typed intents. Pass a
`mediaFactory` (the browser default) to get a real **WebRTC** audio leg so your TypeScript app can place
and answer calls.

```ts
import { BabelconnectClient, passwordGrant } from "@babelforce/babelconnect-sdk";

const serverUrl = "https://agent.example.com"; // babelconnect-server origin

// In production, obtain the bearer token from your own login; passwordGrant() is a convenience.
const token = await passwordGrant({ serverUrl, user: "agent@acme.com", pass: "…" });

const bc = BabelconnectClient.connect({ serverUrl, token });

bc.subscribe((view) => render(view)); // your UI is a function of AgentView
bc.register();                        // announce reachability (enables WebRTC)
bc.placeCall("+49301234567");         // dial out — the agent's own leg auto-answers

// Inbound calls appear in view.activeCalls; answer one explicitly:
//   bc.answerCall(call.id);
```

:::tip Use PKCE for interactive apps
`passwordGrant()` is a convenience for quick dev and first-party scripts. An app that logs a human in —
a SPA, the web/mobile client — should use **Authorization Code + PKCE**
(`pkceChallenge` → `buildAuthorizeUrl` → `authorizationCodeGrant`) so no password ever reaches the browser.
See [Choosing a flow](../guides/authentication.md#choosing-a-flow) and the
[Authorization Code + PKCE](../guides/authentication.md#authorization-code--pkce) walkthrough.
:::

## What's happening

- `connect()` opens the gRPC-web session and starts mirroring `AgentView` into an in-memory `StateCache`.
- `subscribe()` fires on every state change — render straight from the `view`; never keep your own copy.
- `register()` announces the agent as reachable and arms the WebRTC media path.
- `placeCall()` dials out. The agent's **own** leg auto-answers; the audio is negotiated over WebRTC from
  the offer carried on the ringing `CallState`.

Notice these calls run **synchronously right after `connect()`** — you never await a "ready" event. Intents
sent before the first snapshot are **queued** and flushed automatically once the stream is live, so `register()`
and an early `placeCall()` just work.

That self-answer is the `autoAnswer` option ([`ConnectOptions`](./api/index/interfaces/ConnectOptions), default
`true`) and applies to **outbound** calls only — **inbound** calls (and outbound **callbacks**, which the agent
accepts on purpose) always wait for an explicit `answerCall` or `hangup`.

:::note The subscribe callback
`subscribe(fn)` calls `fn` **immediately** with the current snapshot, then again on every update. Each call
gets a fresh **deep clone** of the `AgentView` — safe to read and pass around — so render straight from it
rather than keeping a separate mutable copy that can drift. The callback runs synchronously on the receive
path, so keep it light; hand slow work (network, heavy rendering) to a later tick, or you'll delay the next
state update.
:::

## Inbound calls

Inbound calls show up in `view.activeCalls` and **do not** auto-answer. Answer or reject explicitly:

```ts
import { CallLifecycle, CallDirection } from "@babelforce/babelconnect-sdk";

bc.subscribe((view) => {
  for (const call of view.activeCalls) {
    // call.state / call.direction are numeric enums, not strings
    if (call.state === CallLifecycle.RINGING && call.direction === CallDirection.INBOUND) {
      // bc.answerCall(call.id);  // accept
      // bc.hangup(call.id);      // reject
    }
  }
});
```

:::tip Reading state directly
`bc.view` returns the current `AgentView` synchronously (a deep copy — an empty view before the first snapshot,
never `undefined`), and `bc.activeCall()` returns the first entry of `activeCalls` (or `undefined`) — a
convenience for single-call softphones, so you don't index the array yourself.
:::

## Bring your own media

`BrowserWebrtcMedia` (via `browserMediaFactory`) is the default. To integrate a different WebRTC stack,
implement the [`Media`](./api/index/interfaces/Media) interface — just two methods, one leg per call — and
pass a `mediaFactory` that builds one:

```ts
interface Media {
  answer(offer: string, iceServers?: RTCIceServer[]): Promise<string>; // take the SDP offer, return the SDP answer
  close(): Promise<void>;                                               // tear the leg down
}
```

Wire it in with a **`MediaFactory`** — `(callId: string) => Media` — passed to `connect`; the SDK calls it
once per call:

```ts
const bc = BabelconnectClient.connect({ serverUrl, token, mediaFactory: (callId) => new MyMedia(callId) });
```

The SDK calls `answer` with the SDP from the ringing `CallState.webrtcOffer` and the call's
`iceServers`. Apply those STUN/TURN servers to your peer connection — the default `BrowserWebrtcMedia` hands
them straight to `new RTCPeerConnection({ iceServers })` — so audio traverses NAT when the agent is
off-network.

Per-call media is **managed for you**: the SDK calls `answer` when a call needs a leg and `close` when that
call leaves `activeCalls` (ends) — so do your cleanup in `close`. You only ever `bc.close()` the whole session.

To run with no audio at all, see [Control only](./quickstart-control-only).

## Cleanup

`subscribe()` returns an **unsubscribe** function; call it to detach a renderer. To tear the whole session
down — abort the stream and close any media legs — `await bc.close()`:

```ts
const stop = bc.subscribe(render);
// …later:
stop();            // detach this renderer
await bc.close();  // end the session and release the WebRTC leg(s)
```

In a single-page app, call `bc.close()` when the component unmounts, so the stream and the microphone are
released.

See the full options on [`ConnectOptions`](./api/index/interfaces/ConnectOptions) and the client API on
[`BabelconnectClient`](./api/index/classes/BabelconnectClient).

## Next steps

- **[Recipes](../guides/recipes)** — copy-paste UI built from this client: a presence selector, an
  incoming-call card, a conversation list, the wrap-up timer.
- **[Intents reference](../concepts/intents)** — the full catalogue of what you can send (calls,
  conferencing, recording, SMS, presence, identity).
- **[Errors & reconnects](../guides/errors-and-reconnects)** — handle command rejections, sequence gaps, and
  disconnects to make a long-lived session production-ready.
