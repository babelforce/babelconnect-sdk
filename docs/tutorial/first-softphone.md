---
title: Your first softphone
sidebar_label: Your first softphone
sidebar_position: 1
description: From an empty project to placing and answering a real call in the browser — in about ten minutes.
---

# Your first softphone

This tutorial takes you from nothing to a working browser softphone that can **place a call, answer an
inbound call, and hang up** — with real WebRTC audio. It threads together the ideas covered in depth
elsewhere (authentication, the state model, the intents); follow the links if you want the full story on any
step. You'll write TypeScript, but the shape is identical in [Go](#the-same-in-go).

**What you need:** a babelconnect-server origin and an agent login (username + password), Node 20+, and a
browser. Total time: ~10 minutes.

## 1. Install

```sh
npm install @babelforce/babelconnect-sdk
```

The SDK is ESM-only and talks to a **single** babelconnect-server origin — both the gRPC-web API and the
`/oauth/token` endpoint live there.

## 2. Get a token

The server authenticates with an OAuth2 password grant. The `passwordGrant` helper does the round-trip; in
production you'd get the token from your own login instead (see [Authentication](../guides/authentication)).

```ts
import { passwordGrant } from "@babelforce/babelconnect-sdk";

const serverUrl = "https://agent.example.com";          // your babelconnect-server origin
const token = await passwordGrant({ serverUrl, user: "agent@acme.com", pass: "…" });
```

:::warning Don't ship credentials to the browser
`passwordGrant` is perfect for this tutorial and for back-end use. In a real browser app, authenticate the
agent server-side and hand the **token** to the page — never the password. [More on this →](../guides/authentication)
:::

## 3. Connect and mirror state

Open the client. It immediately starts mirroring the agent's **`AgentView`** — the single source of truth
for everything on screen. You render from it; you never assemble state yourself.

```ts
import { BabelconnectClient } from "@babelforce/babelconnect-sdk";

const bc = BabelconnectClient.connect({ serverUrl, token });

bc.subscribe((view) => render(view)); // called on every state change — your UI is f(AgentView)
bc.register();                         // announce reachability + arm the WebRTC audio path
```

`render` runs on the **initial snapshot** and again on **every patch** thereafter. If that snapshot→patches
model is new to you, read [State & events](../concepts/state-and-events) — it's the heart of how babelconnect
works.

## 4. Place a call

Sending an intent is one method call. You don't update any state — you ask, and the new state arrives on the
stream:

```ts
bc.placeCall("+49301234567"); // dial out — your own leg auto-answers, audio over WebRTC
```

Watch your `render` fire: a new `CallState` shows up in `view.activeCalls`, moving through `RINGING` →
`IN_PROGRESS` as the call connects. The browser negotiates the audio automatically from the offer on the
ringing call.

## 5. Answer an inbound call

Inbound calls appear in `view.activeCalls` too, and they **don't** auto-answer — you accept or reject them
explicitly. This is the **same subscriber from step 3**, now also acting on ringing inbound calls (keep one
subscriber, not two):

```ts
import { CallLifecycle, CallDirection } from "@babelforce/babelconnect-sdk";

bc.subscribe((view) => {
  for (const call of view.activeCalls) {
    if (call.state === CallLifecycle.RINGING && call.direction === CallDirection.INBOUND) {
      bc.answerCall(call.id); // accept …
      // bc.hangup(call.id);  // … or reject
    }
  }
  render(view);
});
```

(In a real UI you'd render an incoming-call card and let the agent click **Answer** — but the call is the
same either way.)

## 6. During the call, and hanging up

While a call is up, the same pattern drives everything — mute, hold, send DTMF, transfer:

```ts
bc.mute(call.id, true);          // mute your mic
bc.sendDigits(call.id, "1");     // press 1 in an IVR
bc.hangup(call.id);              // end the call
```

Each one is an intent; each result comes back as a patch that updates `view`. You've now built the whole
loop: **render `AgentView`, send intents, render the new `AgentView`.** Everything else is more intents —
the full list is the [Intents reference](../concepts/intents).

## The same in Go

The Go SDK is the same model with Go naming — `bcclient.Dial(...)`, `cli.Subscribe(...)`, `cli.PlaceCall(...)`,
`cli.Answer(...)`. Start at the **[Go getting started](../go/getting-started)** guide, and see
**[TypeScript vs Go](../guides/typescript-vs-go)** for the handful of behavioural differences (auto-answer
default, disconnect signalling, media leg).

## Troubleshooting your first call

| Symptom | Likely cause |
|---|---|
| **No audio on a connected call** | No media leg (control-only / no `mediaFactory`), the microphone was denied, or the browser blocked audio **autoplay** — pass the browser `mediaFactory`, grant mic access, and trigger answer/dial from a user gesture (a click) so playback is allowed. |
| **An inbound call never rings in the browser** | You didn't `register()` (it arms the WebRTC path), or WebRTC is off (`agent.webrtcEnabled` is false) so the backend bridges the call to the agent's external number instead. |
| **Nothing shows up in `view.activeCalls`** | `subscribe` wasn't attached before the call, or `calls` is disabled in `AgentView.config` for this deployment. |
| **A command seems to do nothing** | Watch the `onError` callback — the server rejects invalid commands out-of-band (see [Errors & reconnects](../guides/errors-and-reconnects)). |

More symptoms — control-only audio, callbacks, reconnects, integration — are in the
**[Troubleshooting guide](../guides/troubleshooting)**.

## Where to go next

- **[State & events](../concepts/state-and-events)** — the snapshot/patch model, in depth.
- **[Intents reference](../concepts/intents)** — every intent you can send, in both languages.
- **[Recipes](../guides/recipes)** — copy-paste UI patterns (presence selector, call card, conversation list, …).
- **[Glossary](../concepts/glossary)** — the core terms (AgentView, patch, wrap-up, …) in one place.
- **[Control only (no audio)](../typescript/quickstart-control-only)** — dashboards, SMS, and back-end use without a media leg.
- **[Embedding](../typescript/embedding)** — drop the prebuilt agent app into a CRM instead of building your own UI.
- **[Errors & reconnects](../guides/errors-and-reconnects)** — make the session production-ready.
