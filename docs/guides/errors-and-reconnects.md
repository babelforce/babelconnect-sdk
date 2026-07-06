---
title: Errors & reconnects
sidebar_label: Errors & reconnects
sidebar_position: 2
description: Handle command rejections, sequence gaps, token expiry, and disconnects — the production-readiness checklist for a long-lived session.
---

# Errors & reconnects

A softphone session is **long-lived** — it stays open for an agent's whole shift. Three things can go wrong
over that lifetime, and the SDK surfaces each one through a callback so you can react. This guide covers all
three: **command rejections**, **sequence gaps**, and **disconnects / token expiry**.

The mental model from [State & events](../concepts/state-and-events) still holds: state only ever changes via
the stream. Errors don't change state — they tell you something the stream couldn't.

## 1. Command rejections (`onError`)

When the server rejects an intent (or wants to warn you), it sends an out-of-band **`Error`** on the stream.
It carries a `code`, a `message`, and optionally the `callId` it relates to — and it **does not advance
`seq`** (it isn't a state change). The SDK hands it to your `onError` callback:

```ts
const bc = BabelconnectClient.connect({
  serverUrl, token,
  onError: (err) => {
    // err: { code, message, callId? }
    console.warn(`[bc] ${err.code}: ${err.message}`);
    toast(err.message);                  // surface recoverable problems to the agent
  },
});
```

```go
cli, _ := bcclient.Dial(ctx, bcclient.Options{
    Addr: addr, Token: token,
    OnError: func(e *bcv1.Error) {
        log.Printf("[bc] %s: %s (call %s)", e.Code, e.Message, e.CallId)
    },
})
```

These are **recoverable** — a transfer to an unreachable target, an action on a call that already ended, a
missing display-as. The session stays up; the agent's state is still correct. Show the message and let them
retry.

When an `Error` carries a `callId`, **attribute it to that call** — highlight the matching card or toast beside
it, rather than a generic banner. Since `activeCalls` is a list, the agent may have more than one call up, and
the `callId` tells you which one the rejection (or a `no_media` / `media_answer_failed`) belongs to.

Server rejection `code`s are defined by babelconnect-server. The common ones:

| `code` | Meaning |
|---|---|
| `bad_request` | the command was missing a required field (e.g. a transfer with no target) |
| `no_call` | no active call (or a `callId` that doesn't match) for the action |
| `no_conference` · `not_recording` | the prerequisite isn't active — `no_conference` for a conference command with no live conference (a **warm transfer** counts: it needs the target added to a conference first); `not_recording` for a flag/tag when nothing is recording |
| `<operation>_failed` | the operation reached the backend but failed — **one code per intent**, named after it: `place_call_failed`, `transfer_failed`, `answer_failed`, `send_sms_failed`, `start_recording_failed`, `set_presence_failed`, … |
| `unknown_command` | the server doesn't support that command |

The **TypeScript client** also surfaces its own local failures on the same `onError`, with these SDK-defined
codes:

| `code` | When | `callId` |
|---|---|---|
| `disconnected` | the gRPC-web stream dropped (network or stream error) | — |
| `send_failed` | an intent couldn't be sent over the stream | — |
| `no_media` | a call needs answering but no `mediaFactory` is configured | ✓ |
| `media_answer_failed` | the WebRTC media leg failed to answer the call | ✓ |

A `disconnected` is your cue to reconnect (see [§3](#3-disconnects--token-expiry--reconnect-with-backoff));
the rest are recoverable and don't require tearing down the session.

The **Go client** likewise reports its own local media-leg failures on `OnError` — `media_create_failed`,
`media_answer_failed`, and `answer_send_failed` (each carries the `CallId`) — alongside the server's
`*bcv1.Error` command rejections.

One more difference: **Go intent methods return a send error** (`err := cli.PlaceCall(...)`) you can check for a
transport failure, whereas **TypeScript intent methods return `void`** and report send failures on `onError`
(`send_failed` / `disconnected`). Either way the *outcome* of an accepted command arrives as a patch, never as
the method's return value.

## 2. Sequence gaps (`onGap`)

Every `StateUpdate` carries a monotonic `seq`. If the client sees `seq` **skip**, it missed a patch and its
`AgentView` is no longer trustworthy. The SDK detects this and calls `onGap`. The rule is simple:
**on a gap, resubscribe for a fresh snapshot.**

```ts
const bc = BabelconnectClient.connect({
  serverUrl, token,
  onGap: () => reconnect(),   // tear down and open a new session — see below
});
```

```go
cli, _ := bcclient.Dial(ctx, bcclient.Options{
    Addr: addr, Token: token,
    OnGap: func() { reconnect() },
})
```

A gap is rare (it means a dropped message), but handling it is what keeps a long-lived UI from silently
drifting out of sync. Reconnecting replays a full snapshot, so the view self-heals.

## 3. Disconnects & token expiry → reconnect with backoff

Networks drop and bearer tokens expire. Neither SDK auto-reconnects — they surface the condition and let
**you** own the policy, because the right policy depends on your app (a browser tab vs. a back-end worker).
The production pattern is the same everywhere: **close, re-auth if needed, reopen — with capped backoff.**

:::caution Reconnecting drops a live call's audio
Control and media are separate planes, so a dropped control stream doesn't *by itself* kill an active call's
audio (the WebRTC leg is its own connection). But the reconnect below calls `close()`, which tears down the
media legs — and a reopened session won't re-answer an already in-progress call. So reconnect when the agent
is **idle** where you can.
:::

```ts
let attempt = 0;

async function reconnect() {
  await bc?.close();                                       // async — finish tearing down before reopening
  const delay = Math.min(30_000, 500 * 2 ** attempt++);   // 0.5s → 1s → 2s … capped at 30s
  await sleep(delay);

  // If the token may have expired, mint a fresh one first (your login, or passwordGrant in dev).
  token = await getFreshToken();

  bc = BabelconnectClient.connect({ serverUrl, token, onError, onGap, /* … */ });
  bc.subscribe(render);
  bc.register();
  attempt = 0;                                            // reset once we're connected again
}
```

```go
func reconnect(ctx context.Context) *bcclient.Client {
    for attempt := 0; ; attempt++ {
        time.Sleep(backoff(attempt))                       // capped exponential backoff
        token, err := freshToken(ctx)                      // re-auth if the old token expired
        if err != nil { continue }
        cli, err := bcclient.Dial(ctx, bcclient.Options{Addr: addr, Token: token, OnError: onErr, OnGap: onGap})
        if err != nil { continue }
        cli.Subscribe(render)
        cli.Register("webrtc")
        return cli
    }
}
```

**Token expiry** shows up as a failure to connect (the bearer is rejected). Treat it like any other
reconnect, but **re-run your login / `passwordGrant`** to obtain a new token before reopening — see
[Authentication](./authentication). Don't cache a token past its lifetime; mint a fresh one on each
reconnect and you'll never wedge on an expired one.

## Showing a connection indicator

There's no `onConnect` callback — derive the status: the **first `subscribe` callback** (the snapshot) means
you're connected, and a successful reconnect (the next snapshot) restores it. A **drop** surfaces differently
per SDK: the TypeScript client fires `onError` with `disconnected`; the **Go** client doesn't signal it (its
receive loop exits silently), so detect a drop from a failing intent send — Go intents return an error — or
from stalled updates, then reconnect.

## Checklist

- [x] Set **`onError`** — surface command rejections to the agent; they're recoverable, don't reconnect on them.
- [x] Set **`onGap`** — on a gap, reconnect to replay a fresh snapshot.
- [x] On disconnect, **reconnect with capped backoff**; reset the counter once connected.
- [x] **Re-auth on reconnect** — assume the token may have expired and fetch a fresh one.
- [x] After reconnect, **re-`register()`** and re-attach your `subscribe` renderer.
- [x] **Reconnect when idle** where you can — a mid-call reconnect drops the live call's audio ([§3](#3-disconnects--token-expiry--reconnect-with-backoff)).
- [x] **Derive a connection indicator** — first snapshot = connected; detect a drop per SDK (no `onConnect`).

## See also

- **[State & events](../concepts/state-and-events)** — `seq`, snapshots, and the patch model.
- **[Authentication](./authentication)** — obtaining and refreshing the bearer token, and the [security checklist](./authentication#security-checklist) for the rest of production-readiness.
- **[Intents reference](../concepts/intents)** — which intents can be rejected, and why.
- **[Troubleshooting](./troubleshooting)** — a symptom-indexed quick reference (no audio, won't ring, reconnects, …).
