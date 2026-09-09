---
title: API surfaces
sidebar_label: Overview
sidebar_position: 1
description: One contract, three reference surfaces — gRPC, REST/OpenAPI, and the event stream.
---

# API surfaces

Everything babelconnect exposes is generated from **one source of truth**: the `babelconnect.v1` protobuf
contract. The SDKs, the REST projection, and the event-stream spec all come from that single proto, so they
can't drift. There are three reference surfaces — pick the one that matches how you're integrating.

| Surface | What it is | Use it when | Reference |
|---|---|---|---|
| **gRPC contract** | The canonical `Agent` service — the streaming `Session` (control + state) plus the unary operations. Native gRPC for back-end/terminal apps, gRPC-web in the browser. | You're using an SDK (TypeScript / Go), or speaking gRPC directly. | **[gRPC / proto](./grpc)** |
| **REST / OpenAPI** | The *unary* operations projected to REST/JSON (get state, send SMS, fetch history/contacts) plus the auth endpoints. It does **not** carry the live stream. | You want plain HTTP from curl or a language without an SDK. | **[REST / OpenAPI](pathname:///reference/rest/)** |
| **Events / AsyncAPI** | The server→client `StateUpdate` push stream — the snapshot-then-patches model, documented as an event API with payload schemas. | You want to understand or model the event plane. See **[State & events](../concepts/state-and-events)** for the prose guide. | **[Events API](pathname:///reference/events/)** |

## How they relate

The **gRPC contract** is the whole API: the bidirectional `Session` stream carries your **intents** up and the
**`StateUpdate`** stream down, and the unary RPCs cover reference data (history, contacts, SMS threads). The
other two surfaces are projections of that same contract:

- **REST/OpenAPI** exposes the unary RPCs over HTTP/JSON for clients that can't (or don't want to) speak gRPC.
  The streaming half has no REST equivalent — live *changes* always ride the gRPC(-web) stream. `GET
  /v1/agent/state` returns a full `AgentView` snapshot: if the agent has a **live session open**, you get that
  authoritative view (live calls and conferences included); with **no** session open, the view is assembled
  from the backend — agent, presence, wrap-up, and SMS — but `activeCalls` is **empty**, since live call state
  only exists while a stream is open.
- **Events/AsyncAPI** documents that streaming half as a message contract: one channel, the `StateUpdate`
  message, and the schemas of everything it carries.

**Generate a client from the spec.** Both projections are published as machine-readable documents you can feed
to OpenAPI / AsyncAPI codegen — the [OpenAPI JSON](pathname:///openapi/babelconnect.openapi.json)
and the [AsyncAPI YAML](pathname:///asyncapi/babelconnect.asyncapi.yaml) — which is the quickest
path to a typed REST or event client in a language without a babelconnect SDK. Each is a **single,
self-contained file** (no external `$ref`s to resolve), so codegen tools consume it directly.

**Native vs browser streaming.** Native clients (Go) use the **bidirectional `Session`** — intents up, state
down on one stream. Browsers can't client-stream over gRPC-web, so they use **`Subscribe`** (the server→client
state stream) paired with unary **`Send`** calls (one intent each); together they're equivalent to `Session`.
Either way, command rejections arrive as an `Error` on the state stream. The SDKs pick the right one for you.

**One auth scheme for all three.** Every surface authenticates the same way — an **OAuth bearer token** from
the server's `/oauth/token` endpoint, sent as `Authorization: Bearer …` (gRPC metadata for the stream, an HTTP
header for REST). Mint it once and use it everywhere; see **[Authentication](../guides/authentication)**.

If you're building an agent experience, use an **SDK** — the **[TypeScript](../typescript/getting-started)** or
**[Go](../go/getting-started)** client speaks the gRPC contract for you, applies the state stream, and gives
you typed intents. Reach for REST only for one-off unary calls from outside an SDK.
