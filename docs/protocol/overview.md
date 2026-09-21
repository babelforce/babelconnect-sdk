---
title: API surfaces
sidebar_label: API surfaces
sidebar_position: 1
description: The protobuf contract, its Connect and gRPC-web transports, and the REST and event projections.
---

# API surfaces

One `babelconnect.v1` protobuf contract defines commands, agent state and reference-data RPCs.
Choose the surface that matches your integration:

| Surface | Use | Reference |
|---|---|---|
| Connect / gRPC-web | Live `Subscribe` stream, unary `Send` commands and data fetches | [Protocol](./grpc) |
| REST / OpenAPI 3.1 | Annotated unary operations over HTTP/JSON | [REST reference](pathname:///reference/rest/) |
| Events / AsyncAPI | Schemas describing the server's `StateUpdate` stream | [Events reference](pathname:///reference/events/) |

## How they relate

**All current SDKs use server-streaming `Subscribe` plus unary `Send`.** TypeScript uses gRPC-web;
Go uses Connect over HTTP/1.1. The bidirectional `Session` RPC and separate native listener were
retired. The handler also understands native gRPC, but the current server listener has no TLS/h2c
and does not serve HTTP/2; a native gRPC client cannot use it directly. A unary acknowledgement confirms command delivery, not its outcome: effects arrive as
state patches and rejections as stream errors.

REST exposes the annotated unary calls, not the live stream. `GET /v1/agent/state` returns the
current authoritative view when a session exists. Without a session, it assembles agent, presence,
wrap-up and SMS state, but has no live calls. AsyncAPI describes stream messages; it is not a
separate subscription service.

Download the self-contained [OpenAPI JSON](pathname:///openapi/babelconnect.openapi.json) or
[AsyncAPI YAML](pathname:///asyncapi/babelconnect.asyncapi.yaml) for tooling. A REST-generated client
can make those unary calls; live updates require a client that implements `Subscribe` and the
[snapshot/patch model](../concepts/state-and-events).

All authenticated surfaces accept `Authorization: Bearer …`; see
[Authentication](../guides/authentication). SDKs attach the header for you. Start with
[TypeScript](../typescript/getting-started) for browser audio or check
[Go availability and transport limits](../go/getting-started) for a service or terminal client.
