---
title: TypeScript vs Go
sidebar_label: TypeScript vs Go
sidebar_position: 4
description: Compare current SDK defaults, transport, media, authentication and lifecycle limits.
---

# TypeScript vs Go

Use TypeScript for browser audio or embedding, and Go for terminal tools and services.
Both render the same [state model](../concepts/state-and-events), but their defaults and delivery
status differ. [Go availability](../go/getting-started) must be checked before using its examples.

| Aspect | TypeScript | Current Go source |
|---|---|---|
| Distribution | Public npm package | Current API requires matching SDK/protocol source; public v0.1.0 is older |
| Control | gRPC-web `Subscribe` + unary `Send` | Connect `Subscribe` + unary `Send` |
| Address | `serverUrl`, normally HTTPS | `Addr` = `host:port`; constructs plain `http://`, no TLS option |
| Open | `connect` returns immediately and queues early intents | `Dial` opens the subscription; doesn't await a cached snapshot; its context doesn't cancel the stream |
| Send result | Most commands return void; `send_failed` on `onError` | Most commands return a send error |
| Auto-answer | `true` by default | `false` by default |
| Answer policy | Own outbound ringing offer, excluding callbacks | Same |
| Register arguments | Defaults to `["webrtc"]` | Variadic, no default; current server ignores capabilities in both cases |
| Current state | `view`, `activeCall()` | `View()`, `ActiveCall()` |
| Subscribe | Immediate cache callback, then updates; returns unsubscribe | Immediate cache callback, then updates; no unsubscribe |
| Stream end | `disconnected` on thrown failure; clean end silent | No disconnect callback; closes media |
| Recovery | Application owns reconnect and token renewal | Same |
| Notifications | `onNotification`; see [sequence caveat](../concepts/state-and-events#seq-ordering-and-gap-recovery) | No dedicated notification callback |
| Media default | Browser mic/speaker WebRTC; `null` disables media | Synthetic WebRTC silence/RTP counts; nil selects this default |
| Media interface | `answer`, `close` | `Answer`, `Stats`, `Close` |
| Enums | `CallLifecycle.RINGING` | `CallLifecycle_CALL_LIFECYCLE_RINGING` |
| Password helper | Optional client ID; default `manager` | Fixed `manager` |
| PKCE helpers | `pkceChallenge`, `buildAuthorizeUrl`, `authorizationCodeGrant` (full response) | `GeneratePKCE`, `PkceAuthorizeURL`, `AuthorizationCodeGrant` (access token only) |
| Revoke helper | `revokeToken` | `RevokeToken`, `RevokeTokenClient` |
| Cleanup | `await close()` | `Close()` returns error; usually deferred |
| Concurrency | Event loop; keep callbacks short | Serialized sends; synchronize shared callback state |

Registration loads data and requests reachability in both clients. A media-free observer and a
silent-media client differ; neither should register without considering where calls will ring.
See [TypeScript control only](../typescript/quickstart-control-only) and
[Go automation](../go/quickstart-control-only).

## See also

[Authentication](./authentication) owns endpoint and token details;
[Errors & reconnects](./errors-and-reconnects) explains lifecycle limits.
For other languages, [API surfaces](../protocol/overview#how-they-relate) distinguishes generated
REST clients from clients that can consume live updates.
