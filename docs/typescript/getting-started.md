---
title: Getting started
sidebar_label: Getting started
sidebar_position: 1
description: Install the TypeScript SDK and choose a custom client, control-only integration, or embedded agent app.
---

# TypeScript SDK

Use `@babelforce/babelconnect-sdk` to build your own browser interface around live agent state.
**[Your first softphone](../tutorial/first-softphone)** is the complete setup and working example.

## Install

```sh
npm install @babelforce/babelconnect-sdk
```

The package is ESM-only, targets ES2022, and is side-effect-free for tree shaking. It runs in modern
browsers and Node 20+ for control-only use. CommonJS callers use a dynamic import:
`const { BabelconnectClient } = await import("@babelforce/babelconnect-sdk")`.

Browser audio needs microphone permission and a secure context (HTTPS or localhost).
The SDK speaks gRPC-web directly to the server; no separate protocol proxy is required.
Token exchange uses the same origin's `/oauth/token`, but the
[PKCE consent page](../guides/authentication#authorization-code--pkce) may use another origin.
If your app has a different origin, add it to the server's CORS allowlist. An empty list allows
all origins and is intended for development only.

## Which entry point?

| Goal | Entry point | Guide |
|---|---|---|
| Custom UI with browser audio | package root | [Tutorial](../tutorial/first-softphone) · [Client lifecycle](./quickstart-client) |
| State, SMS or external-phone control | package root, `mediaFactory: null` | [Control only](./quickstart-control-only) |
| Ready-made agent UI | `@babelforce/babelconnect-sdk/embed` | [Embedding](./embedding) |

## API surface at a glance

| Area | Reference |
|---|---|
| Connection and options | [BabelconnectClient](./api/index/classes/BabelconnectClient) · [ConnectOptions](./api/index/interfaces/ConnectOptions) |
| State and intents | [State & events](../concepts/state-and-events) · [Intents](../concepts/intents) |
| Login, PKCE, revocation | [Authentication](../guides/authentication) |
| Custom WebRTC | [Media](./api/index/interfaces/Media) · [MediaFactory](./api/index/type-aliases/MediaFactory) |
| Every export | [TypeScript API](./api/index.md) |

Porting a Go client? Read [TypeScript vs Go](../guides/typescript-vs-go) before relying on defaults.
