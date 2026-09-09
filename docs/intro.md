---
title: Introduction
sidebar_label: Introduction
sidebar_position: 1
description: Build agent experiences — softphone, CTI, messaging — on babelconnect. The model, the transport split, and the SDKs.
---

# babelconnect SDKs

**babelconnect** lets you build browser- and server-side **agent experiences** — softphone, CTI,
and messaging — on top of a single **babelconnect-server** origin. This site documents the public
SDKs and the gRPC/REST contract they speak.

- **[TypeScript SDK](./typescript/getting-started)** — `@babelforce/babelconnect-sdk`. A typed client
  over **gRPC-web** with optional native **WebRTC** audio, plus an **embeddable widget** (`/embed`) that
  drops the prebuilt agent app into your page and drives it from your CRM.
- **[Go SDK](./go/getting-started)** — `github.com/babelforce/babelconnect-sdk-go`. The same
  server-authoritative client for back-end and terminal apps, with a pluggable media leg.
- **[Protocol reference](./protocol/overview)** — the `babelconnect.v1` gRPC contract and its REST/OpenAPI +
  event-stream projections. Every SDK is generated from it.

> **Languages:** TypeScript and Go are available today. They both speak the same contract — so
> [State & events](./concepts/state-and-events) and [Authentication](./guides/authentication) apply to
> every SDK.

## The model: server-authoritative state, typed intents

babelconnect-server owns the canonical, per-agent **`AgentView`** and streams it to the SDK as an initial
**snapshot** followed by entity-level **patches**. The SDK applies them in an in-memory **`StateCache`**
and notifies your subscriber, so **your UI is always a pure function of `AgentView`**:

```text
UI = f(AgentView)
```

You never mutate state directly. You send typed **intents** — `placeCall`, `answerCall`, `mute`,
`transfer`, `sendSms`, `setPresence`, … — and the outcome arrives as **new state** on the stream. One
reduction lives on the server; every client just renders the same authoritative state.

```ts
const bc = BabelconnectClient.connect({ serverUrl, token });
bc.subscribe(render);          // render(AgentView) — your UI, always in sync
bc.register();                 // announce reachability + arm the media path
bc.placeCall("+15551234567");  // send an intent; the resulting state arrives on the stream
```

## Control and audio travel on separate planes

- **Control** is **gRPC** — gRPC-web in the browser, native gRPC on the server. It carries the state
  stream and your intents.
- **Audio** is **WebRTC**, negotiated from the offer carried on a ringing `CallState` and handled by a
  pluggable **`Media`** backend. Browsers get real mic/speaker audio out of the box; you can supply your
  own media implementation, or run **control-only** (no audio) for dashboards, SMS, or presence.

The *unary* operations (get state, send SMS, fetch history/contacts) are **also** exposed as REST/JSON
via OpenAPI, generated from the same contract.

## How it fits together

```text
   your app   (browser · Node · Go)
      │   @babelforce/babelconnect-sdk · babelconnect-sdk-go
      │     StateCache (apply patches) + typed intents + pluggable WebRTC Media
      ▼   gRPC(-web) Session:   Command ↑    StateUpdate(snapshot | patch | error) ↓
 ┌────────────────  babelconnect-server  ────────────────┐
 │  owns the per-agent AgentView                          │
 │  serves gRPC-web + REST/OpenAPI + /oauth/token         │
 │  on one origin                                         │
 └────────────────────────────────────────────────────────┘
            audio: WebRTC  (separate media plane)
```

The SDK talks to **one** babelconnect-server origin, which serves both the gRPC-web API and the
`/oauth/token` endpoint.

## Pick your path

| You want to… | Start here |
|---|---|
| **Build something now** (10-min walkthrough) | **[Tutorial → Your first softphone](./tutorial/first-softphone)** |
| Understand how state arrives | **[Concepts → State & events](./concepts/state-and-events)** |
| Look up an intent (both languages) | **[Concepts → Intents reference](./concepts/intents)** |
| Look up a term (AgentView, patch, wrap-up, …) | **[Concepts → Glossary](./concepts/glossary)** |
| Connect & get a token | **[Guides → Authentication](./guides/authentication)** |
| Harden for production | **[Authentication → Security checklist](./guides/authentication#security-checklist)** |
| Keep a long-lived session healthy | **[Guides → Errors & reconnects](./guides/errors-and-reconnects)** |
| Fix a problem (no audio, won't ring, …) | **[Guides → Troubleshooting](./guides/troubleshooting)** |
| Build a UI piece (presence selector, call card, …) | **[Guides → Recipes](./guides/recipes)** |
| Build a browser softphone / CTI in TypeScript | **[TypeScript → Getting started](./typescript/getting-started)** |
| Embed the prebuilt agent app in a CRM | **[TypeScript → Embedding](./typescript/embedding)** |
| Drive calls from Go (back end / terminal) | **[Go → Getting started](./go/getting-started)** |
| Automate from a Go service (no audio) | **[Go → Back-end automation](./go/quickstart-control-only)** |
| Compare the two SDKs | **[Guides → TypeScript vs Go](./guides/typescript-vs-go)** |
| Compare the API surfaces | **[Protocol → API surfaces](./protocol/overview)** |
| Integrate from a language without an SDK (REST + codegen) | **[Protocol → API surfaces](./protocol/overview#how-they-relate)** |
| Read the wire contract | **[gRPC](./protocol/grpc)** · **[REST / OpenAPI](pathname:///reference/rest/)** · **[Events](pathname:///reference/events/)** |
