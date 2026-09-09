---
title: Programmatic client (with audio)
sidebar_label: Programmatic client
sidebar_position: 2
description: Connect, mirror AgentView, place a call, and handle inbound calls from a Go client.
---

# Programmatic client (with audio)

The programmatic client mirrors the agent's `AgentView` and lets you send typed intents. `Dial` blocks
until the session is open, so you can `Register` and place or answer calls immediately — no readiness
handshake.

```go
ctx := context.Background()

// PasswordGrant is a convenience for local tools/tests; in production, bring your own token.
token, err := bcclient.PasswordGrant(ctx, "https://login.example.com", user, pass)
if err != nil { log.Fatal(err) }

cli, err := bcclient.Dial(ctx, bcclient.Options{
    Addr: "agent.example.com:7091", Token: token, AutoAnswer: true,
})
if err != nil { log.Fatal(err) } // Dial blocks until the session is open, so this catches connect failures
defer cli.Close()

cli.Subscribe(func(v *bcv1.AgentView) { render(v) })              // UI = f(state)
cli.Register("webrtc")                                            // announce reachability (arms WebRTC)
cli.PlaceCall("+1990001000", "+1990002000", "+1990003000", false) // to, displayAsTo, displayAsFrom, record
```

:::tip Use PKCE for interactive apps
`PasswordGrant` is a convenience for local tools and tests. A program that logs a human in should use
**Authorization Code + PKCE** (`GeneratePKCE` → `PkceAuthorizeURL` → `AuthorizationCodeGrant`) so no
password is handled by the client. See [Choosing a flow](../guides/authentication.md#choosing-a-flow) and the
[Authorization Code + PKCE](../guides/authentication.md#authorization-code--pkce) walkthrough.
:::

The two imports the example uses are the client package and the `bcv1` type alias:

```go
import (
    "github.com/babelforce/babelconnect-sdk-go"                          // package bcclient
    bcv1 "github.com/babelforce/babelconnect-proto/gen/go/babelconnect/v1"
)
```

## What's happening

- `Dial()` opens the gRPC `Agent.Session` and starts mirroring `AgentView` into an in-memory `StateCache`.
  It **blocks until the session is open**, so the returned `error` catches connect failures and you can send
  intents right away.
- `Subscribe()` fires on every state change — render straight from the `v` it hands you; never keep your own
  copy.
- `Register("webrtc")` announces the agent as reachable and arms the WebRTC media path.
- `PlaceCall()` dials out. With `AutoAnswer: true` the agent's **own** leg picks up; the audio is negotiated
  over WebRTC from the offer carried on the ringing `CallState`.

:::caution `AutoAnswer` is off by default
`AutoAnswer` is the zero value `false`, so set `AutoAnswer: true` (as above) for the agent's own leg to pick
up on `PlaceCall`. (The TypeScript client defaults `autoAnswer` to `true` instead, so this is one place the
two SDKs differ — see [TypeScript vs Go](../guides/typescript-vs-go).) It applies to **outbound** calls only:
an **inbound** call — or an outbound **callback** (a scheduled call the agent accepts) — always rings until you
`Answer` (accept) or `Hangup` (reject), even with `AutoAnswer` on.
:::

:::note Two address forms
`PasswordGrant` takes the server's **HTTPS URL** (it calls the `/oauth/token` endpoint), while `Dial`'s
**`Addr`** is the gRPC **`host:port`** — a native gRPC dial target, not a URL.
:::

:::caution Pass `"webrtc"` explicitly
Go's `Register(caps...)` is variadic with **no default**, so calling `Register()` with no arguments leaves
the agent **not WebRTC-reachable** — pass `Register("webrtc")`. (TypeScript's `register()` defaults to
`["webrtc"]`, so it differs here; see [TypeScript vs Go](../guides/typescript-vs-go).)
:::

## Handling inbound calls

Inbound calls arrive as `CallState`s in the `RINGING` lifecycle and **do not** auto-answer. With
`AutoAnswer: false` you decide — accept with `Answer`, reject with `Hangup`:

```go
cli.Subscribe(func(v *bcv1.AgentView) {
    for _, call := range v.ActiveCalls {
        ringing := call.State == bcv1.CallLifecycle_CALL_LIFECYCLE_RINGING
        inbound := call.Direction == bcv1.CallDirection_CALL_DIRECTION_INBOUND
        if ringing && inbound {
            cli.Answer(call.Id) // accept …
            // cli.Hangup(call.Id) // … or reject
        }
    }
})
```

:::note Enum members are prefixed
The Go enum members carry the full proto prefix —
`bcv1.CallDirection_CALL_DIRECTION_INBOUND`, `bcv1.CallLifecycle_CALL_LIFECYCLE_RINGING` — not the short
`CallDirection.INBOUND` the TypeScript SDK uses.
:::

You send the intent; the result comes back as a `callUpsert` patch (the call flips to in-progress) — you
never set call state yourself. That round-trip is the whole model; see
[State & events](../concepts/state-and-events) and the full [Intents reference](../concepts/intents).

:::tip Reading state directly
Besides `Subscribe`, `cli.View()` returns the current `*bcv1.AgentView` synchronously (a fresh clone, safe to
hold; an empty view before the first snapshot, never `nil`), and `cli.ActiveCall()` returns the first active
call (or `nil`) — handy for a single-call flow without holding your own copy.
:::

## Concurrency

The client is built for concurrent use:

- **Intent methods** (`PlaceCall`, `Answer`, `Transfer`, …) are safe to call from any goroutine — sends are
  serialised internally.
- Your **`Subscribe` callback** is invoked from a single internal goroutine, one update at a time (never
  concurrently), so you don't need a lock inside it. The `*bcv1.AgentView` it receives is a private clone,
  safe to read directly.
- That callback runs on the receive loop, so **keep it quick** — hand slow work to your own goroutine or
  channel, or it will delay later state updates.
- `Subscribe` returns nothing — call it **once** and `Close()` the client to stop (there's no per-callback
  unsubscribe like the TypeScript client's).

## Bring your own media

The default `SyntheticMediaFactory` is cgo-free — it answers in PCMA, streams A-law silence, and counts
inbound RTP (two-way media is verifiable, but nothing is heard). For real mic/speaker audio, supply your own
`MediaFactory` via `Options.Media` — no control/state code changes. See
**[Back-end automation → Adding real audio](./quickstart-control-only#adding-real-audio-later)** for the
`Media` interface and how the SDK drives it.

## Next steps

- **[Intents reference](../concepts/intents)** — the full catalogue of what you can send (calls,
  conferencing, recording, SMS, presence, identity).
- **[Errors & reconnects](../guides/errors-and-reconnects)** — handle command rejections, sequence gaps, and
  disconnects to make a long-lived session production-ready.
- **[Back-end automation (no audio)](./quickstart-control-only)** — the same client without a real media leg,
  for services, dashboards, and CLIs.
