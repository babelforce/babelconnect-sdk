---
title: Getting started
sidebar_label: Getting started
sidebar_position: 1
description: Install babelconnect-sdk-go and open a server-authoritative session with typed intents and a pluggable media leg.
---

# Go SDK

The **Go SDK** for babelconnect-server — a server-authoritative "dumb renderer" client: it mirrors the
agent's state and exposes typed intents over gRPC, with a pluggable WebRTC media leg. Use it for back-end and
terminal apps — services, dashboards, bots, and CLIs that drive calls or react to state server-side.

## Install

```sh
go get github.com/babelforce/babelconnect-sdk-go
```

Module `github.com/babelforce/babelconnect-sdk-go`, package `bcclient`. Requires **Go 1.24+**. The default
media leg is cgo-free, so a plain `go build` works anywhere — no C toolchain or system audio libraries.

## What it does

babelconnect-server is **state-authoritative**: it owns the per-agent `AgentView` and streams a snapshot +
entity-level patches over the gRPC `Agent.Session`. This SDK:

- opens the session and keeps a **`StateCache`** mirror of the `AgentView`, applying snapshot/patches
  mechanically — no domain logic, so your UI is a pure function of the state;
- exposes typed **intent** senders (`PlaceCall`, `Answer`, `Hangup`, `Mute`, `Hold`, `SendDigits`,
  `SetDisplayAs`, `SetPresence`, `SetWebrtc`, `SetAgentNumber`, `Transfer`, the conference, recording, and
  wrap-up intents, and SMS `SendSms`/`SetConversationOpen`/`MarkConversationRead`) plus the unary fetches
  `GetHistory`/`GetSmsThread`/`GetPhonebook`;
- drives a pluggable **`Media`** leg (WebRTC). The default `SyntheticMediaFactory` is cgo-free — it answers
  in PCMA, streams A-law silence, and counts inbound RTP (two-way media is verifiable, but nothing is
  heard). Supply your own `Media` for real mic/speaker audio — no control/state code changes.

Your UI binds to `Subscribe(...)` and dispatches intents. That's the whole contract.

## Which entry point?

| Goal | Default media | Guide |
|---|---|---|
| Place/answer calls with real audio | bring your own `MediaFactory` | [Programmatic client](./quickstart-client) |
| A service, dashboard, bot, or CLI — no audio | cgo-free `SyntheticMediaFactory` (silent) | [Back-end automation](./quickstart-control-only) |

**Building a service, dashboard, or CLI?** You don't need a real audio leg — the default media leg is
cgo-free and silent. Start at **[Back-end automation (no audio)](./quickstart-control-only)**.

:::caution `Register("webrtc")`, not `Register()`
Go's `Register(caps...)` is variadic with **no default** — calling `Register()` with no arguments leaves the
agent **not WebRTC-reachable**, so pass `Register("webrtc")` explicitly. (TypeScript's `register()` defaults
to `["webrtc"]`, so the two SDKs differ here.) See [TypeScript vs Go](../guides/typescript-vs-go) for the
full list of behavioural differences.
:::

## API reference

The full per-symbol reference is published on **pkg.go.dev**:

**[pkg.go.dev/github.com/babelforce/babelconnect-sdk-go](https://pkg.go.dev/github.com/babelforce/babelconnect-sdk-go)**

Coming from the TypeScript SDK? See **[TypeScript vs Go](../guides/typescript-vs-go)** for the behavioural
differences.

The data types (`AgentView`, `CallState`, `Command`, …) come from the generated contract. The two imports the
quickstart uses are the client package and the `bcv1` type alias:

```go
import (
    "github.com/babelforce/babelconnect-sdk-go"                          // package bcclient
    bcv1 "github.com/babelforce/babelconnect-proto/gen/go/babelconnect/v1"
)
```

See the [gRPC / proto reference](../protocol/grpc) for every message and enum.

## Next steps

- **[Programmatic client (with audio)](./quickstart-client)** — the worked example: connect, mirror
  `AgentView`, place a call, and handle inbound calls.
- **[Back-end automation (no audio)](./quickstart-control-only)** — drive intents and observe state from a
  service or CLI with the default silent media leg.
