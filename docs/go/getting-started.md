---
title: Getting started
sidebar_label: Getting started
sidebar_position: 1
description: Go SDK availability, transport limits, and entry points for terminal clients and services.
---

# Go SDK

The Go client (`bcclient`) mirrors `AgentView`, sends typed intents, and supports pluggable
WebRTC media. Use it for terminal tools and services.

## Install

These pages describe the current source API. The public `github.com/babelforce/babelconnect-sdk-go`
release **v0.1.0** predates the Connect transport and cannot connect to current servers.
Obtain a matching SDK and generated protocol module from babelforce before using these examples;
`go get github.com/babelforce/babelconnect-sdk-go` alone does not supply that API.

Current source requires **Go 1.25+**. Its module path is
`github.com/babelforce/babelconnect-sdk-go` (package `bcclient`); generated messages come from
`github.com/babelforce/babelconnect-proto/gen/go/babelconnect/v1`.

## What it does

The client opens `Subscribe` and sends unary `Send` requests over **Connect / HTTP/1.1**.
`Options.Addr` is `host:port`; the implementation prepends `http://`. It has no TLS option and
cannot accept an HTTPS URL. Use a trusted local tunnel or explicitly trusted network; do not send
production bearer tokens over an untrusted plaintext connection.

`Dial` opens the subscription but does not wait for the cache's first snapshot. Its context does
not cancel the long-lived stream; explicitly call `Close`.

## Which entry point?

| Goal | Guide |
|---|---|
| Dial, accept and reject from a terminal | [Programmatic client](./quickstart-client) |
| Observe state, send SMS or exercise silent media | [Back-end automation](./quickstart-control-only) |
| Hear microphone/speaker audio | [Supply a MediaFactory](./quickstart-control-only#adding-real-audio-later) |

Default media is cgo-free WebRTC sending PCMA silence and counting received RTP. It needs no system
audio libraries, but it is still a WebRTC stack. It does not produce audible mic/speaker audio.

## API reference

[pkg.go.dev](https://pkg.go.dev/github.com/babelforce/babelconnect-sdk-go) describes the public release,
which may differ from these pages. Use the supplied source's Go documentation for current signatures,
the [protocol reference](../protocol/grpc) for messages, and
[TypeScript vs Go](../guides/typescript-vs-go) for behavior differences.

## Next steps

Run the [terminal example](./quickstart-client), then add
[authentication](../guides/authentication) and [recovery](../guides/errors-and-reconnects).
