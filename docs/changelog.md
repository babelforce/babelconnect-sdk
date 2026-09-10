---
id: changelog
title: Changelog
sidebar_label: Changelog
---

# Changelog

Notable changes to the babelConnect SDKs, the embedding contract and the agent app, by release.
Every release is listed; one with nothing you can observe says so. The version shown in the
navbar is the release these pages describe.

## 0.23.1 — 2026-09-10

- **This changelog is complete again, and the site knows its version.** Every release since
  0.17.0 is listed below (the page had stopped at 0.16.0), the navbar shows the release these
  pages describe, and the REST and Events references carry the release version instead of a
  fixed `1.0.0`.
- **The Go SDK page says where the public module stands.** The published module is v0.1.0 and
  predates the Connect transport; the page now says so and points to the TypeScript SDK until a
  current release of the Go module is published.

## 0.23.0 — 2026-09-09

- **Fixed: the agent's own phone number is no longer offered as a caller ID.** The caller-ID
  list mixed the account's service numbers with the agent's own number; choosing the latter made
  every outbound call fail with a "number forbidden as Display-As" rejection, and an agent with no
  service number could not place a call at all. The list now holds service numbers only, and with
  none available the call goes out on the account's default outbound number. Fixes the app and
  every SDK at once.
- **A refused outbound call now names its reason.** Instead of one `place_call_failed` carrying
  raw backend JSON, the server sends **`agent_not_available`** (the line is blocked or the presence
  is not Available — reset the line status or pick an Available presence) or
  **`display_as_forbidden`** (the chosen caller ID is not a service number of the account). Other
  rejections keep `place_call_failed` and now carry the backend's message plus per-field detail.
  A conference invite with a rejected caller ID reports `display_as_forbidden` too.
- **Fixed: a cold transfer to a busy target completed on the agent's own leg.** The transfer now
  resolves only when the invited target answers; a busy, rejected or unanswered target takes the
  abort path — the caller is taken off hold, the agent keeps the call, and `transfer_rejected`
  is sent.
- **Docs: an [Error codes](./protocol/error-codes.md) reference** — all 30 codes the server can
  send, each with when it is sent, whether it carries a `callId`, and how to recover — plus two
  Troubleshooting entries indexed by what the agent sees.

## 0.22.2 — 2026-09-08

- **Fixed: muting or holding for more than a minute ended the call.** While muted or on hold the
  server sent no audio at all toward the telephony side, whose inactivity timer then hung the
  channel up after about 60 seconds. The server now sends silence in both states and keeps the
  stream alive whenever the client goes quiet, so mute and hold last as long as you need.
- **Fixed: a cold transfer left the caller on an orphaned leg for about a minute.** A transfer, a
  completed warm transfer and leaving a conference now end the telephony leg immediately.
- **Docs: a line-blocked banner recipe.** A ringing offer that goes unanswered puts the agent in
  `unreachable`, an involuntary line block. The Recipes page shows how to render the banner and
  the reset action so an agent can recover; the state model links to it.

## 0.22.1 — 2026-08-24

- **Fixed: one agent refreshing their browser tab could take the server down for every agent on
  the deployment.** A client that disconnected while its registration was still loading tripped a
  server fault; browsers saw the restart window as a CORS failure on `Subscribe`, which is what it
  looked like from the outside. Late updates for a closed stream are now dropped, and any future
  fault on that path degrades to one lost state patch instead of an outage.
- **Loopback port wildcards in origin allowlists.** `http://localhost:*`, `http://127.0.0.1:*` and
  `http://[::1]:*` are accepted in the CORS and embed origin allowlists, so a developer is allowed
  without anyone guessing which port their dev server picks. A port wildcard on any other host
  matches nothing; a pattern is still never used as a `postMessage` target origin.

## 0.22.0 — 2026-07-28

- **Fixed: conference invites and blind transfers to external numbers work again.** Inviting an
  external (PSTN) number requires a caller ID; the server sent none, so every "add to call" and
  blind transfer to an external number failed. Add-to-call now sends one, and a blind transfer
  shows the transferred-to party the **original customer's** number. With no selectable number at
  all, an external invite fails fast with `no_caller_id` instead of a raw 400.
- **Optional per-invite caller ID.** `AddConferenceMember` gains `display_as`; leave it out and the
  server uses the agent's currently selected outbound number. TypeScript and Dart:
  `addConferenceMember(..., displayAs)`. **Go (breaking):** `Client.AddConferenceMember` takes a
  trailing `displayAs string` — pass `""` for the previous behaviour.
- **Wildcard origin patterns.** The CORS and embed origin allowlists accept a pattern matching one
  leading host label: `https://*.zendesk.com` matches `https://acme.zendesk.com` and never a deeper
  subdomain, the bare apex, another scheme or port, or a lookalike such as
  `https://acme.zendesk.com.evil.test`. A match answers with the full requested origin.

## 0.21.3 — 2026-07-06

- **Allow-all embed origins for a shared deployment.** With the embed allowlist set to `*`, a
  framed widget accepts host commands from any origin — the bearer token is the security gate, so a
  framer without a valid `auth.set` token drives an inert widget. An *empty* allowlist still fails
  closed, data-bearing app→host events never broadcast to `*`, and the host origin locks on the
  first command. `*` in the CORS allowlist is now allow-all as well (it previously matched nothing).

## 0.21.2 — 2026-07-06

- **Fixed: signing out of the deployed web app flashed a 502 "gateway unavailable".** Sign-out no
  longer forces a full-page reload unless a newer bundle is actually deployed, and closes the
  connection first when a reload is warranted.

## 0.21.1 — 2026-07-06

- No customer-facing changes. Test infrastructure only: the three SDKs' state caches are now
  checked against one shared golden script on every change, and the TypeScript package's `exports`
  map and type resolution are verified before every publish.

## 0.21.0 — 2026-07-06

- **Dart SDK: a detected sequence gap in the state stream now re-syncs from a fresh snapshot** and
  replays `Register` — the same recovery as a real drop, without the reconnecting banner or backoff
  since the transport is still healthy. Previously a gap only fired the optional `onGap` callback
  and left the client on a possibly diverged view.

## 0.20.0 — 2026-07-06

- No customer-facing changes. Integration-test coverage of the call lifecycle in the agent app.

## 0.19.0 — 2026-07-06

- **App shell:** the Account tab moves to the end of the bottom navigation, and the header shows the
  brand glyph alone, centered. The brand name stays as the logo's accessibility label.

## 0.18.0 — 2026-07-05

- **Sign-out revokes the token actually in use.** After a host rotated the bearer mid-session via
  `auth.set`, sign-out still revoked the token the session *started* with; it now revokes the
  current one.
- **Security: standalone web token storage hardened.** The bearer moves from `localStorage` to
  `sessionStorage` (per tab: a reload restores the session, closing the tab drops it), with a
  one-time migration that keeps live sessions signed in, and the app now ships a `script-src`
  Content Security Policy. Embedded sessions were never persisted and are unaffected.

## 0.17.0 — 2026-07-05

- The programmatic TypeScript client — the surface you build your own softphone UI on — is now
  covered by a browser end-to-end suite on every change: password grant, `Subscribe`, the
  `StateCache`-reduced snapshot, `placeCall`, a real WebRTC auto-answer, hangup, wrap-up and media
  teardown, plus both auth-failure paths. No API change.

## 0.16.0 — 2026-07-05

- **Fixed: mount-time session correlation.** `EmbedOptions.session`/`context` passed to
  `mount()` now reach the call correlation (`PlaceCall.session`) as documented — previously
  only a separate `session.set()` after boot did; the values handed over with the initial
  token handshake were silently ignored. A mid-session `auth.set` still leaves session and
  context untouched, as specified.
- The embedding protocol is now covered by a browser end-to-end scenario suite (real host
  SDK + real app in a real cross-origin iframe): the token handshake and its timeout,
  origin allowlisting (including fail-closed defaults), mid-session token refresh,
  click-to-dial, call events, tab routing (named, alias, and legacy numeric forms),
  resize reporting, and session-end signaling are all exercised on every change.

## 0.15.1 — 2026-07-04

- **Status-picker lock:** accounts that lock the agent-status picker via the admin widget
  setting (`agentStatus.selectionEnabled: false`) now get the same behavior in this app —
  the presence selector stays visible showing the agent's current status, but agents cannot
  change it themselves. Carried as a new `account.allow_status_change` field in the app
  feature config (default: allowed), available to all SDK consumers via the agent state's
  `config` message.

## 0.14.0 — 2026-07-04

- **The call surface reads like a phone:** a caller who matches one of the agent's phonebook
  contacts now rings in by **name** (the number stays visible as a secondary line, and the
  desktop notification greets by name too); the call status is a human phrase in all four
  app languages ("Incoming call…", "Connected", …) instead of technical state codes; and
  live calls show a running **HH:MM:SS duration timer**.
- The generated API reference pages (gRPC, REST, events, TypeScript) were refreshed and now
  track the current SDK surface again.

## 0.13.0 — 2026-07-03

- **One endpoint, plain HTTP/1.1:** all SDK clients now speak the
  [Connect protocol](https://connectrpc.com/) over standard HTTP/1.1 — browsers keep
  gRPC-web, and the Go and Dart SDKs reach the server through the same public web endpoint
  as everything else. No HTTP/2 requirement, no special port, and Connect endpoints are
  plain curl-able JSON (`POST /babelconnect.v1.Agent/<Method>`).
- **Breaking — the native gRPC endpoint is removed**, including the bidirectional `Session`
  RPC and the dedicated gRPC service port. Nothing published ever depended on it; if you
  dialed the server with a stock gRPC client, switch to a Connect client (or gRPC-web)
  against the standard endpoint.
- **Breaking — Dart SDK:** `connect()` now takes a single `backendUrl` instead of separate
  host/port/web-URL parameters. The Go SDK's public API is unchanged.

## 0.12.0 — 2026-07-03

- **Legacy embed-host compatibility:** integrations built against the previous embedded phone
  widget can migrate with minimal changes — opt into legacy-shaped `user.loaded`/`agent.loaded`
  payloads via `eventsVersion: 'v1'` (defaults stay minimal/PII-lean), `app.setTab` accepts
  legacy numeric tab indices, and a script-tag (IIFE) bundle is served for hosts without a
  bundler. A step-by-step migration guide ships with the SDK docs.
- **Outbound dialer:** agents can log into a campaign, receive and work leads, and submit
  dispositions — surfaced in the app's Outbound tab and as SDK campaign state/commands.
- **Localization:** the app ships German, French, and Spanish alongside English, with a
  persisted language setting and locale-aware date/number formats.
- **Resilience:** reloading the page (or a brief network blip) mid-call no longer hangs up the
  customer — the server parks the live call briefly and hands it back on reconnect. Opening the
  app in a second tab now warns and hands the session over cleanly instead of running two
  sessions.
- **Refreshed UI:** the app now follows the current babelforce brand — classic light theme by
  default (persisted per agent), an accessible dark mode, and per-deployment brand color/logo
  overrides unchanged for white-label hosts.

## 0.11.0 — 2026-07-02

- Every SDK now advertises its kind and version on the wire, and the app detects when a newer
  build has been deployed and offers a one-click reload.
- Connection liveness and round-trip latency are now measured via a ping/pong heartbeat.

## 0.10.0 — 2026-07-02

- **Multi-account:** an agent who holds the `agent` role in more than one account can switch
  between them without logging out, and the current account is shown by name. (For embedded
  deployments, account selection stays the host's responsibility.)
- Microphone problems now report a specific reason — `mic_not_found`, `mic_permission_denied`,
  or `mic_in_use` — instead of one opaque error.

## 0.9.0 — 2026-07-02

- **Sessions now survive a full shift.** The access token is refreshed automatically before it
  expires, so long-lived agent sessions no longer drop calls or get logged out mid-shift.
- **Mid-session token refresh for embeds.** A host may call `auth.set` with a fresh token while
  the agent is live; it is applied to subsequent calls and reconnects without tearing down the
  session or interrupting an active call.
- **Clean auth failures.** A rejected or expired token now signs the agent out immediately
  instead of silently retrying for minutes.
- Friendlier, specific login errors (wrong password vs. server error).

## 0.8.0 — 2026-07-02

- **Embedding.** The postMessage host contract is documented and hardened: `auth.set`
  handoff, CTI screen-pop dispatched by `kind`, auto-resize, `user.logoff`, and click-to-dial
  carrying the host `session`.
- **Security — action required.** The app now **fails closed** when framed with no origin
  allowlist. Set **`BC_EMBED_ORIGINS`** to your host page origin(s) and add it to the CSP
  `frameAncestors`. See the [embedding guide](./typescript/embedding).
- The Go SDK gains `RevokeToken` (RFC 7009), matching the TypeScript and Dart SDKs.

## 0.7.1 — 2026-06-30

- Documented the agent availability model — `presence` / `presenceName` / `line_blocked` —
  including "line blocked after sign-in" recovery (Reset / `resetLineStatus`) and the
  `revokeToken` / `POST /oauth/revoke` sign-out flow. Quickstarts now point at the PKCE flow.

_Versions 0.7.2–0.7.4 were Helm-chart-only and have no SDK-facing changes._
