---
title: Errors & reconnects
sidebar_label: Errors & reconnects
sidebar_position: 2
description: Handle rejections, stale state, disconnects and token renewal without assuming audio recovery.
---

# Errors & reconnects

Handle command failures separately from connection failures. A rejected transfer usually leaves the
session usable; a lost stream leaves your view stale. Neither standalone SDK automatically reconnects
or refreshes tokens. The embedded app has its own connection management.

## 1. Command rejections (`onError`)

Server errors carry `code`, `message`, and optionally `callId`. They arrive through `onError` (TS)
or `OnError` (Go), without advancing the state sequence. Show a call-specific error beside that
call when possible; handle unknown codes by showing their message. A rejection does not by itself
require reconnecting. Check the [error reference](../protocol/error-codes) for recovery, including
`display_as_forbidden`, `agent_not_available` and warm-transfer prerequisites.

Most TS command methods return `void`; a failed unary send reports `send_failed`. Go command
methods generally return the send error. `answerCall` (TS) returns a promise and `Answer` (Go)
can return a missing-call error; media failures use the error callback. Unary data fetches reject
(TS) or return errors (Go). None of these return values proves the requested state change happened.

| Local error | SDK | Meaning |
|---|---|---|
| `disconnected` | TS | The subscription threw a transport/stream error. A clean end is not reported. |
| `send_failed` | TS | A unary command could not be sent. Its outcome may be uncertain. |
| `unauthenticated` | TS | The server refused the token on the subscription, a command or a data fetch. Reported once; the client is then closed and `onUnauthenticated` is called. The same happens for the server's [`unauthenticated`](../protocol/error-codes) error. |
| `not_an_agent` | TS | The token is valid but its user holds no agent role; `message` names the user. Handled like `unauthenticated`: reported once, the client closed, `onUnauthenticated` called. Signing in again as the same user does not help. |
| `no_media` | TS | Answer attempted with `mediaFactory: null`. |
| `mic_not_found`, `mic_permission_denied`, `mic_in_use` | TS | Microphone absent, denied, or occupied. |
| `media_answer_failed` | Both | Media negotiation failed; carries the call ID. |
| `media_create_failed`, `answer_send_failed` | Go | Media creation or sending its answer failed; carries the call ID. |

## 2. Sequence gaps (`onGap`)

The cache detects a patch sequence that is not the previous sequence plus one. It **still applies**
the patch, then reports `onGap` / `OnGap`; the callback does not repair the view. Mark the UI stale
and obtain a fresh snapshot by opening a replacement subscription. Avoid sending actions based on
stale state. See [sequence semantics and the notification caveat](../concepts/state-and-events#seq-ordering-and-gap-recovery).

## 3. Disconnects & token expiry → reconnect with backoff

Use one recovery owner per client:

1. Coalesce disconnect/gap signals into one recovery attempt. Cancel it when the user signs out.
2. Mark the view stale, detach rendering, and close the old client before replacing it.
3. Wait with capped exponential backoff and jitter, for example 0.5s, 1s, 2s up to 30s.
4. Obtain a valid token through your login layer; stop retrying if a new interactive login is required.
5. Create a client, attach callbacks, and register. Restore external-phone routing if applicable.
6. Reset backoff only after observing usable state from the new connection, not when TS `connect()` returns.

Do not blindly replay a failed dial, SMS, transfer or recording command: the server may have accepted
it before the connection failed. Inspect the recovered state and reconcile the action first.

**Audio recovery is limited.** Closing either client closes media. Go also closes media when its
receive loop ends; TS does not close it merely because `Subscribe` throws. The server may preserve
call control across a short disconnect, but that is not a promise of uninterrupted audio. Neither
standalone SDK automatically negotiates a new leg for an already in-progress call. Reconnect when
idle where possible, and show the audio interruption if a mid-call recovery is unavoidable.

## Showing a connection indicator

`subscribe` / `Subscribe` immediately calls your renderer with the **current cache**, which can be
empty before any network reply. That first callback is not proof of connection. Both SDKs return
cloned state; snapshots expose no separate public "connected" flag.

TS reports a stream refused as unauthenticated as `unauthenticated` and ends the session (see the
table above); any other thrown stream failure is `disconnected`; a clean stream end is silent. Go's receive
loop ends without a disconnect callback. A failed send indicates a problem, but a successful send
doesn't prove the subscription is alive. An idle agent may produce no state patches, and transport
heartbeats do not call renderers: silence alone is not a reliable disconnect detector.

Use application-level health checks appropriate to the deployment and label uncertainty honestly.
Don't display an unconditional "Connected" just because construction or subscription returned.

## Checklist

Wire command and media errors, treat gaps as stale state, allow only one recovery attempt, renew
credentials when needed, and release the old client. Verify call control and audible media separately.

## See also

[Authentication](./authentication) owns token policy; [Troubleshooting](./troubleshooting) starts
from symptoms; [TypeScript vs Go](./typescript-vs-go) compares lifecycle defaults.
