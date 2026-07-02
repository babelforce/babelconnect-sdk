---
title: Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 5
description: Common symptoms and their fixes — no audio, calls that don't ring, reconnects, and integration gotchas — each linking to the detail.
---

# Troubleshooting

Common symptoms, their usual cause, and where to read more. If something here is wrong or missing, the
detailed guides ([State & events](../concepts/state-and-events), [Errors & reconnects](./errors-and-reconnects),
[Authentication](./authentication)) are the source of truth.

## Audio & media

**A connected call has no audio.** Usually one of: you're running **control-only** (`mediaFactory: null`, so
there's no media leg), the **microphone was denied**, or the browser blocked audio **autoplay**. Pass the
browser `mediaFactory`, grant mic access, and trigger answer/dial from a **user gesture** (a click) so playback
is allowed. See [Your first softphone → Troubleshooting](../tutorial/first-softphone#troubleshooting-your-first-call).

**Answering raises `no_media`.** Answering takes the ringing call's WebRTC offer and runs it through a media
leg — a control-only client (no `mediaFactory`) has none. Supply a `mediaFactory`, or don't answer with audio
on that client. See [Errors & reconnects](./errors-and-reconnects#1-command-rejections-onerror).

## Calls & ringing

**An inbound call never rings in the browser.** You didn't call `register()` (it arms the WebRTC path), or
WebRTC is off (`agent.webrtcEnabled` is false), so the backend bridges the call to the agent's external number
instead. See [Where calls ring](../concepts/intents#session--identity).

**An outbound *callback* doesn't auto-answer.** A [callback](../concepts/glossary#callback) (a scheduled
outbound call the agent accepts) arrives `RINGING` and waits for `answerCall`, like an inbound call — **even
with `autoAnswer` on**. Distinguish it by `CallState.source` = `callback`.

**The agent is unreachable.** A reachable agent needs **one of**: WebRTC on (`register()` enables it) **or** an
agent number set (`setAgentNumber`). With neither, calls can't reach them. See
[A device selector](./recipes#a-device-selector-where-calls-ring).

**Nothing shows up in `activeCalls`.** Either `subscribe` wasn't attached before the call arrived, or `calls`
is disabled in `AgentView.config` for this deployment. Attach the subscriber first, and gate call UI on
`config.calls.enabled`. See [State & events](../concepts/state-and-events).

**A command seems to do nothing.** The server rejects invalid commands **out-of-band**, on the `onError`
callback — not as a thrown error or a state change. Wire up `onError` and surface it. See
[Command rejections](./errors-and-reconnects#1-command-rejections-onerror).

**I see a "line blocked" / can't take calls right after signing back in.** This is almost always the
**chosen** busy from your *previous* sign-out, not a platform fault: sign-out flips presence to `busy`
**by design** (so routing stops while the token is revoked), and that presence outlives the session.
Just **pick an available presence** again and calls will route. Reach for **Reset** (`resetLineStatus`)
**only** for a genuine *involuntary* `line_blocked` — the server-imposed block you didn't choose. See
[State & events](../concepts/state-and-events) for how chosen presence differs from an involuntary block.

## Connection & lifecycle

**Reconnecting drops a live call's audio.** `close()` tears down the media legs, and a reopened session won't
re-answer an in-progress call, so reconnect when the agent is **idle** where you can. See
[Disconnects & reconnects](./errors-and-reconnects#3-disconnects--token-expiry--reconnect-with-backoff).

**A dropped connection isn't detected (Go).** The Go client's receive loop exits silently on a stream error —
there's no disconnect callback. Detect a drop from a **failing intent send** (Go intents return an error) or
stalled updates, then reconnect. (The TypeScript client fires `onError` with `disconnected`.) See
[Showing a connection indicator](./errors-and-reconnects#showing-a-connection-indicator).

**The view has drifted out of sync.** Every update carries a monotonic `seq`; if it **skips**, a patch was
missed and the cached `AgentView` is stale. The SDK detects this and calls `onGap` — handle it by
**resubscribing** for a fresh snapshot. See [Sequence gaps](./errors-and-reconnects#2-sequence-gaps-ongap).

**A long-running session stops connecting.** The bearer token has likely **expired**. Mint a fresh one (re-run
your login / `passwordGrant`) and reconnect — don't cache a token past its lifetime. See
[Token lifetime](./authentication#token-lifetime).

## Setup & integration

**The browser blocks requests with a CORS error.** If your app is served from a **different origin** than the
babelconnect-server, that origin must be in the server's **CORS allowlist**. (An empty allowlist permits all
origins — for development only.) See [One origin, and CORS](../typescript/getting-started).

**You can't `require()` the SDK in Node.** `@babelforce/babelconnect-sdk` is **ESM-only**, so a CommonJS
project must load it with a dynamic import: `const { BabelconnectClient } = await import("@babelforce/babelconnect-sdk")`.
See [Getting started](../typescript/getting-started).

**`config`, `presenceOptions`, or `phonebook` are empty.** These load on **`register()`** — before you
register, `AgentView.config` and `agent` aren't populated. Call `register()` after `subscribe`. See
[Register](../concepts/glossary#register).

**A control-only client still receives WebRTC calls.** `register()` marks the agent WebRTC-reachable
regardless of `mediaFactory`. If that client takes live calls, pair it with `setWebrtc(false)` +
`setAgentNumber(...)` so calls bridge to an external phone. See
[Control only → reachability](../typescript/quickstart-control-only).

**The phonebook shows "recent" as a contact name.** Recently-dialed numbers carry the literal label
`"recent"`. Skip those entries (`label !== "recent"`) when resolving a name. See
[A contacts list](./recipes#a-contacts-list-dial-from-the-phonebook).

**The embedded app is blank or has no audio.** Check that the host page delegates `microphone` to the
babelconnect-server origin and that the server's CSP `frame-ancestors` / CORS allowlist name your host origin.
See [Embedding](../typescript/embedding).

**An embed event (e.g. `cti.message`) never fires.** The SDK relays only what the embedded app posts, so
**forwarded** events depend on the deployed app version. `agent.loaded` / `user.loaded` / `cti.call` are the
reliable ones; confirm the rest against your deployment. See [Embedding → events](../typescript/embedding#4-react-to-the-app-app--host).

## See also

- **[Errors & reconnects](./errors-and-reconnects)** — the full error model, codes, and the reconnect pattern.
- **[Authentication](./authentication#security-checklist)** — tokens, CORS/TLS, and the security checklist.
- **[State & events](../concepts/state-and-events)** — how state arrives, so you can reason about what you see.

**Still stuck?** The SDK sources live on **[GitHub](https://github.com/babelforce)** — check the repo for your
SDK (TypeScript, Go, or the proto contract) for open issues and the latest releases.
