---
title: Getting started
sidebar_label: Getting started
sidebar_position: 1
description: Install @babelforce/babelconnect-sdk and choose between the programmatic client and the embeddable widget.
---

# TypeScript SDK

The **TypeScript SDK for babelconnect** — build browser-based agent experiences (softphone, CTI,
messaging) on top of a babelconnect-server origin. There are two ways to use it:

- **Programmatic client** — a typed, server-authoritative client over **gRPC-web**. You get a live mirror
  of the agent's state (`AgentView`), a typed intent API (`placeCall`, `answerCall`, `mute`, `transfer`,
  `sendSms`, …), and an optional **WebRTC** audio leg so a pure-TypeScript app can place and answer real
  calls in the browser.
- **Embeddable widget** (`/embed`) — drop the prebuilt babelconnect agent app into your page via an
  `<iframe>` and a `postMessage` bridge, and drive it (click-to-dial, prefill, tab routing) from your CRM.

## Install

```sh
npm install @babelforce/babelconnect-sdk
```

ESM-only (`"type": "module"`) and side-effect-free, so bundlers tree-shake unused exports. Targets ES2022. Runs
in modern browsers; Node 20+ for control-only (no-audio) use. Native WebRTC audio requires a browser, a
**secure context** (HTTPS, or `localhost` in dev), and microphone permission — `getUserMedia` is unavailable
over plain HTTP.

In a **CommonJS** Node project you can't `require()` it (ESM-only) — load it with a dynamic import:
`const { BabelconnectClient } = await import("@babelforce/babelconnect-sdk");`.

:::info One origin, and CORS
The SDK talks to a single **babelconnect-server** origin, which serves both the gRPC-web API and the
`/oauth/token` endpoint. If your app is served from a **different** origin, that origin must be in the
server's CORS allowlist — an empty allowlist permits all origins and is for development only.

The server speaks **gRPC-web natively** — there's no separate Envoy or proxy to run (it wraps the gRPC server
and handles the gRPC-web CORS preflight itself). Point the SDK at the server origin and you're done.
:::

## Which entry point?

| Goal | Import | Guide |
|---|---|---|
| Place/answer calls from your own UI, with audio | `@babelforce/babelconnect-sdk` | [Programmatic client](./quickstart-client) |
| Dashboards, SMS, presence — no audio | `@babelforce/babelconnect-sdk` (`mediaFactory: null`) | [Control only](./quickstart-control-only) |
| Embed the prebuilt agent app in a CRM | `@babelforce/babelconnect-sdk/embed` | [Embedding](./embedding) |

The full per-symbol reference is under **[API reference (TypeDoc)](./api/index.md)**. Using the Go SDK too?
See **[TypeScript vs Go](../guides/typescript-vs-go)**.

## API surface at a glance

| Area | Exports |
|---|---|
| Client | `BabelconnectClient`, `ConnectOptions` |
| State | `StateCache`, plus the generated `babelconnect.v1` messages & enums (`AgentView`, `CallState`, `Command`, …) |
| Auth | `passwordGrant`, `pkceChallenge`, `buildAuthorizeUrl`, `authorizationCodeGrant` |
| Media | `BrowserWebrtcMedia`, `browserMediaFactory`, `Media`, `MediaFactory` |
| Embed (`/embed`) | `BabelconnectEmbed`, `EmbedOptions` |

`BabelconnectClient` intents cover calls (`placeCall`, `answerCall`, `hangup`, `mute`, `hold`, `sendDigits`,
`transfer`), conferencing (`startConference`, `addConferenceMember`, …), recording (`startRecording`,
`stopRecording`, `flagRecording`, …), wrap-up (`wrapUpExtend`, `wrapUpCancel`), messaging (`sendSms`,
`markConversationRead`), presence/identity (`setPresence`, `setDisplayAs`, `setAgentNumber`, `setWebrtc`), and
history/contacts fetches (`getHistory`, `getSmsThread`, `getPhonebook`).
