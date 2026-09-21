---
title: Programmatic client (with audio)
sidebar_label: Programmatic client
sidebar_position: 2
description: Understand the TypeScript client's lifecycle, answering policy, and media seam.
---

# Programmatic client (with audio)

For a complete application, follow [Your first softphone](../tutorial/first-softphone).
This page explains the lifecycle when integrating the client into an existing UI.

## What's happening

| Call | Behavior |
|---|---|
| `BabelconnectClient.connect({ serverUrl, token })` | Returns immediately; opens `Subscribe` and queues intents until the first state message. |
| `bc.subscribe(render)` | Calls `render` immediately with a possibly empty cache, then after snapshots and state patches. Returns an unsubscribe function. |
| `bc.register()` | Loads deployment data and requests WebRTC reachability. Capabilities default to `["webrtc"]`; the current server ignores that list. |
| `bc.placeCall(number)` | Sends an intent; success or rejection arrives asynchronously. |

Views are deep copies. Treat them as read-only and keep callbacks short: slow synchronous work delays
state processing. `bc.view` returns the current view, never `undefined`; `bc.activeCall()` returns its
first call or `undefined`. Neither indicates that the network is healthy.

## Inbound calls

`autoAnswer` defaults to `true` for an outbound ringing leg with an offer, except callbacks.
Inbound calls and callbacks wait for `answerCall(id)` or `hangup(id)`.
Render buttons as in the tutorial; don't answer from a render callback.
`answerCall` returns a promise, but command completion still comes through state and
[errors](../guides/errors-and-reconnects).

## Bring your own media

The default `browserMediaFactory` creates one `BrowserWebrtcMedia` per answered call.
A custom [`MediaFactory`](./api/index/type-aliases/MediaFactory) implements:

```ts
interface Media {
  answer(offer: string, iceServers?: RTCIceServer[]): Promise<string>;
  close(): Promise<void>;
}
```

Pass it as `mediaFactory: (callId) => new MyMedia(callId)`, where `MyMedia` is your implementation.
Apply the supplied STUN/TURN servers when negotiating the SDP answer; off-network clients may need them.
The SDK closes media when a call leaves `activeCalls` or the client closes. Mute and hold remain
server commands. Pass `mediaFactory: null` for [control only](./quickstart-control-only).

## Cleanup

Call the function returned by `subscribe` to detach that renderer, then `await bc.close()` to
abort the stream and close all media. Do this when your component unmounts. Closing does not
[revoke the token](../guides/authentication#logout).

## Next steps

Use [Recipes](../guides/recipes) for UI tasks, [Intents](../concepts/intents) for controls, and
[Errors & reconnects](../guides/errors-and-reconnects) for recovery. The
[client reference](./api/index/classes/BabelconnectClient) lists every method.
