---
title: Back-end automation (no audio)
sidebar_label: Back-end automation
sidebar_position: 3
description: Use Go for state and commands, understand silent media, and add a real audio backend when needed.
---

# Back-end automation (no audio)

Use the [terminal example](./quickstart-client) as the connection skeleton for a service.
Check [module availability](./getting-started) first. Each token identifies one agent;
a team integration needs independently authenticated clients.

## When to use it

Observe state for a dashboard, fetch history and contacts, or send SMS and presence commands.
These are control operations and do not require audible media.
`Options.Media: nil` selects `SyntheticMediaFactory`; it does **not** disable WebRTC.

## What works without real audio

The synthetic leg negotiates PCMA, sends A-law silence and counts incoming RTP. It is cgo-free
and needs no sound device. Calls, mute, hold, DTMF, recording and conference controls still run
on the server. `cli.Stats()` returns aggregate sent/received packet counts for active legs;
counts do not prove audible quality.

For calls a human hears on an external phone, register, then set `SetWebrtc(false)` and
`SetAgentNumber(number)`. Confirm routing in state before dialing and restore it after each new
registration. Registration requests WebRTC reachability regardless of capabilities; omitting
`"webrtc"` does not make it a passive observer. A pure state reader should register only when its
reference data are needed. Auto-answer is off unless explicitly enabled.

## Adding real audio later

Pass a factory `func(callID string) (Media, error)` as `Options.Media`. It creates one leg per call:

```go
type Media interface {
    Answer(ctx context.Context, offer string, iceServers []*bcv1.IceServer) (string, error)
    Stats() (sent, received int64)
    Close() error
}
```

Apply the call's `IceServers` (`Urls`, `Username`, `Credential`) to your peer connection for NAT
traversal. Return the SDP answer from `Answer`. The SDK closes legs when calls disappear, the
stream ends, or `Close` runs. Your factory supplies microphone/speaker capture and playback;
control and state code stay the same.

## See also

[Client lifecycle](./quickstart-client) · [Intents](../concepts/intents) ·
[Errors & reconnects](../guides/errors-and-reconnects).
