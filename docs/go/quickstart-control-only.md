---
title: Back-end automation (no audio)
sidebar_label: Back-end automation
sidebar_position: 2
description: Drive intents and observe state from a Go service — no WebRTC stack, no cgo, no audio — using the default synthetic media leg.
---

# Back-end automation (no audio)

The Go SDK's default media backend is **`SyntheticMediaFactory`** — a cgo-free leg that answers the agent's
own call in A-law silence and counts inbound RTP. Two-way media is *verifiable* but **nothing is heard**.
That is exactly what you want for **back-end automation**: a service that drives intents and observes state,
without linking a real WebRTC/audio stack.

You don't configure anything to get it — leave `Options.Media` unset and `Dial` uses it:

```go
cli, err := bcclient.Dial(ctx, bcclient.Options{
    Addr:  "agent.example.com:7090",
    Token: token,                 // your login → a bearer token
    // Media: nil → SyntheticMediaFactory (cgo-free, no real audio)
})
if err != nil { log.Fatal(err) }
defer cli.Close()

cli.Subscribe(func(v *bcv1.AgentView) { react(v) }) // UI/logic = f(state)
cli.SetPresence("available")
cli.SendSms("+49301234567", "On my way!", "", nil)
```

This needs **no cgo** and no system audio libraries, so it builds and runs anywhere a plain Go binary does —
containers, cron jobs, CLIs.

## When to use it

- **Back-end services** — react to state (logging, analytics, automations) or drive intents (place calls,
  send SMS, set presence) on an agent's behalf.
- **Supervisor / wallboard feeds** — subscribe to `AgentView` and stream live call, presence, and queue
  state into a dashboard without touching audio.
- **CLI / tooling** — scripts that fetch history or contacts, set presence, or send SMS.
- **Integration glue** — bridge babelconnect state and intents to another system (CRM, ticketing, bot).

Each client is **one agent** — the bearer token identifies which one. To orchestrate a whole team from one
service, open one client per agent (one token each); they're independent and cheap without a real media leg.

## What works without real audio

Everything except hearing the call. Every intent is a **control-plane command** — it travels over gRPC and
comes back as state, independent of the media leg — and the synthetic leg still *answers*, so call control is
fully exercised:

- ✅ Observe all state — calls, presence, SMS, conferences, wrap-up, config — via `Subscribe`.
- ✅ Every intent — `SetPresence`, `SendSms`, `Transfer`, `Hold`, `Mute`, `SendDigits` (DTMF), the recording
  and conference intents, `MarkConversationRead`, … (see the **[Intents reference](../concepts/intents)**).
  `Mute`/`Hold`/`SendDigits` are server-side commands, not media operations, so they behave identically with
  the synthetic leg.
- ✅ The unary fetches — `GetHistory`, `GetSmsThread`, `GetPhonebook`.
- ⚠️ The one thing you give up is **audible audio**: the synthetic leg sends and receives A-law silence, so
  you won't hear the call and the agent's own audio is silent. Supply a real `MediaFactory` when you need
  mic/speaker audio — or, to place calls a **human** agent hears, turn WebRTC off (`SetWebrtc(false)`) so the
  backend bridges to their external `SetAgentNumber` instead of the silent synthetic leg.

`cli.Stats()` returns the aggregate RTP packet counts (`sent`, `received`) across active media legs — a quick
gauge that media is flowing, even with the silent synthetic leg.

## Adding real audio later

Supply your own [`MediaFactory`](https://pkg.go.dev/github.com/babelforce/babelconnect-sdk-go) —
a `func(callID string) (Media, error)` — via `Options.Media` to negotiate real RTP, with no control or state
code changes. The `Media` it returns is three methods, one leg per call:

```go
type Media interface {
    Answer(ctx context.Context, offer string, iceServers []*bcv1.IceServer) (string, error) // offer → answer SDP
    Stats() (sent, received int64)                                                          // RTP packet counts
    Close() error
}
```

The SDK calls `Answer` with the ringing call's `WebrtcOffer` and `IceServers` — apply those STUN/TURN servers
to your peer connection (the default synthetic leg passes them to `webrtc.Configuration{ICEServers: …}`) so
audio traverses NAT when the agent is off-network. Each `IceServer` carries `Urls`, `Username`, and
`Credential` — map them to your stack's ICE-server config.

That's a separate concern from this page — back-end automation rarely needs it:

```go
cli, _ := bcclient.Dial(ctx, bcclient.Options{
    Addr: addr, Token: token,
    Media: myMediaFactory,   // bring your own WebRTC leg
})
```

## See also

- **[Getting started](./getting-started)** — the full client, with a worked inbound/outbound call.
- **[State & events](../concepts/state-and-events)** · **[Intents reference](../concepts/intents)** — the model and the full intent catalogue.
- **[Errors & reconnects](../guides/errors-and-reconnects)** — keeping a long-lived service session healthy.
