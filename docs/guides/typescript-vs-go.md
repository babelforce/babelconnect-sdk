---
title: TypeScript vs Go
sidebar_label: TypeScript vs Go
sidebar_position: 4
description: The same model and contract, two SDKs — the connect/transport, lifecycle, and API differences between @babelforce/babelconnect-sdk and babelconnect-sdk-go, at a glance.
---

# TypeScript vs Go

Both SDKs speak the same [contract](../protocol/overview) and the same [state model](../concepts/state-and-events) —
snapshot + patches in, typed intents out. They differ in language conventions and a few behaviours worth
knowing when you build with one or port between them.

**Which should I use?** Pick by where your code runs, not by preference — they cover different surfaces:

- **TypeScript** for anything in a **browser** — a softphone, CTI, or messaging UI with real WebRTC audio,
  or the embeddable widget. It's the only SDK that runs in the browser.
- **Go** for **back-end and terminal** apps — services, dashboards, bots, and CLIs that drive calls or react
  to state server-side. Audio is optional (the default media leg is silent).

You can also run **both**: a Go service orchestrating calls while a TypeScript front end renders the same
`AgentView` — they're the same model on the wire.

**Neither language?** You can still integrate over **REST/OpenAPI** for the unary operations — fetch state,
send SMS, pull history/contacts — by generating a client from the
[downloadable spec](../protocol/overview#how-they-relate). The live state *stream* rides gRPC(-web) only, so
REST gives you the request/response surface, not the push updates (for those you need an SDK).

| Aspect | TypeScript (`@babelforce/babelconnect-sdk`) | Go (`babelconnect-sdk-go`) |
|---|---|---|
| **Connect** | `BabelconnectClient.connect({ serverUrl, token })` — returns synchronously and **queues** intents until the stream is live | `bcclient.Dial(ctx, Options{ Addr, Token })` — **blocks** until the session is open |
| **Server address** | `serverUrl` — the HTTPS origin | `Addr` — the gRPC `host:port` |
| **Transport** | gRPC-web: `Subscribe` (state) + unary `Send` (intents) | native gRPC: the bidirectional `Session` |
| **Intent methods** | return `void`; send failures arrive on `onError` | return an `error` (the send result) |
| **`autoAnswer` default** | `true` | `false` (the zero value — opt in) |
| **`register` capabilities** | defaults to `["webrtc"]` | variadic — pass `"webrtc"` |
| **Read state now** | `bc.view` · `bc.activeCall()` | `cli.View()` · `cli.ActiveCall()` |
| **Stop a renderer** | `subscribe()` returns an unsubscribe fn | `Subscribe` returns nothing — `Close()` the client |
| **Disconnect** | `onError` with `disconnected` | not signaled — detect from a failing send / stalled updates |
| **Notifications** | `onNotification` callback | not surfaced |
| **Media leg** | `Media` = `answer` + `close`; default `BrowserWebrtcMedia` (real mic/speaker audio) | `Media` = `Answer` + `Stats` + `Close`; default is cgo-free synthetic (silent) |
| **Enum members** | unprefixed (`CallLifecycle.RINGING`) | prefixed (`CallLifecycle_CALL_LIFECYCLE_RINGING`) |
| **`passwordGrant` client_id** | optional `clientId` override | fixed at `"manager"` |
| **OAuth / PKCE helpers** ([authentication](./authentication)) | `pkceChallenge` · `buildAuthorizeUrl` · `authorizationCodeGrant` · `revokeToken` · `DEFAULT_CLIENT_ID` | `GeneratePKCE` · `PkceAuthorizeURL` · `AuthorizationCodeGrant` · `DefaultClientID` — **no `revokeToken` helper** (TS + Dart only); revoke via a direct `POST /oauth/revoke` |
| **Cleanup** | `await bc.close()` — async (`Promise<void>`) | `cli.Close()` — returns `error`, usually `defer`'d |
| **Concurrency** | single-threaded (the event loop) | goroutine-safe — sends are serialised; the `Subscribe` callback runs on the receive loop |

:::caution The `register` default differs — Go has none
TypeScript's `register()` **auto-sends `["webrtc"]`** when you call it with no arguments. Go's `Register()` is
**variadic with no default**, so calling `Register()` with no arguments sends **no** capability and leaves the
agent **not WebRTC-reachable** — calls won't ring at the client. Pass `Register("webrtc")` explicitly when
porting TypeScript that relied on the bare `register()`.
:::

Everything else — `AgentView`, the patch types, the intents, presence, wrap-up, conferencing, SMS — is the
same on both, so the [concepts](../concepts/state-and-events) and the [intents reference](../concepts/intents)
apply to either. Start at the **[TypeScript](../typescript/getting-started)** or
**[Go](../go/getting-started)** getting-started for the language specifics.

## See also

- **[Errors & reconnects](./errors-and-reconnects)** — the **Disconnect** and **intent-method return** rows
  above in depth: how each SDK signals a dropped stream and where send failures surface.
- **[Authentication](./authentication)** — the `passwordGrant` **client_id** difference, the **PKCE** helpers on both SDKs, token handling, and
  the [security checklist](./authentication#security-checklist).
