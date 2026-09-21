---
title: Introduction
sidebar_label: Introduction
sidebar_position: 1
description: Build a TypeScript softphone, embed the agent app, or integrate with the babelconnect contract.
---

# babelconnect SDKs

Build a softphone that fits your application. The TypeScript SDK gives you live agent state,
typed call controls, and browser WebRTC audio. You supply the interface.

**Start with [Your first softphone](./tutorial/first-softphone):** create a project, render calls,
dial, answer an incoming call with a button, and release the microphone when you leave.

| Your goal | Start here |
|---|---|
| Build a custom browser client | [TypeScript tutorial](./tutorial/first-softphone) · [SDK setup](./typescript/getting-started) |
| Put the ready-made agent UI in a CRM | [Embedding](./typescript/embedding) |
| Observe state or send SMS without audio | [TypeScript control only](./typescript/quickstart-control-only) |
| Build a terminal tool or Go service | [Go setup and availability](./go/getting-started) |
| Find a field, method, or error | [TypeScript API](./typescript/api/index.md) · [Intents](./concepts/intents) · [Error codes](./protocol/error-codes) |

## The model: server-authoritative state, typed intents

The server owns each agent's `AgentView`. It sends a snapshot, then patches; the SDK maintains
a `StateCache` and calls your renderer. Send an intent such as `placeCall` or `setPresence` and
render the resulting state. Don't change the cached view to predict success.

## Control and audio travel on separate planes

Control carries commands and state; WebRTC carries audio. A client can observe calls, send SMS,
or change presence without a media leg. It still needs an audio destination to take calls.
See [State & events](./concepts/state-and-events) for the model and
[TypeScript vs Go](./guides/typescript-vs-go) for SDK defaults and limits.

## How it fits together

```text
your interface → SDK → Send(Command) → server
               SDK ← Subscribe(StateUpdate) ← server
browser microphone/speaker ← WebRTC → server
```

Both SDKs use `Subscribe` plus `Send`: TypeScript over gRPC-web, Go over Connect.
The retired bidirectional `Session` RPC is not supported. The server also exposes unary
operations through [REST/OpenAPI](pathname:///reference/rest/); [AsyncAPI](pathname:///reference/events/)
describes the state stream. See [API surfaces](./protocol/overview).

## Pick your path

After the tutorial, use [Recipes](./guides/recipes) for UI tasks,
[Authentication](./guides/authentication) for login, and
[Errors & reconnects](./guides/errors-and-reconnects) for long-lived sessions.
The [concepts](./concepts/state-and-events) explain behavior; generated references enumerate the
contract. [Troubleshooting](./guides/troubleshooting) starts from symptoms, and the
[glossary](./concepts/glossary) defines the terms.
