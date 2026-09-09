---
id: changelog
title: Changelog
sidebar_label: Changelog
---

# Changelog

Notable changes to the babelConnect SDKs and the embedding contract. This is the
customer-facing view; full engineering detail (server, proto, app, per-SDK) lives in the
repository `CHANGELOG.md`.

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
