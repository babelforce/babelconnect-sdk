---
id: changelog
title: Changelog
sidebar_label: Changelog
---

# Changelog

Notable changes to the babelConnect SDKs, the embedding contract and the agent app, by release.
Every release is listed; one with nothing you can observe says so. The version shown in the
navbar is the release these pages describe.

## 0.27.1 — 2026-09-16

- **Nothing you can observe.** This release changes only how babelforce's own conformance suite
  waits for a backend event while it tests the agent server. No behaviour of the app, the SDKs or
  the embedding contract is affected, and no version you embed needs to change.

## 0.27.0 — 2026-09-16

- **Where an agent's calls are delivered now follows their session, not a stored preference.** While
  an agent holds a babelconnect session, their calls come to it; when the session ends, they take the
  platform's other path. Nothing has to be enabled per agent first.

  This removes a failure you may have hit: an agent who had never opened the Account tab could place
  a call that sat on "Calling…" for a minute with no error, because the leg was being delivered
  somewhere their client was not. An agent in that state now just works.

  A page reload keeps the agent reachable for ten seconds, so a call arriving while the app restarts
  is not lost.

- **The Account tab's "Receive calls via babelconnect" switch is gone.** There is nothing left for it
  to choose. An agent who does not want calls in the app turns the browser phone off, or signs out.

- **New error code `no_agent_leg`.** The server accepted an outbound call and the agent's leg never
  arrived; sent about ten seconds after the accept, while the dial is still pending. Previously this
  was silence. See the error-code reference for what to do with it.

- `getFeatures` and `setFeature` remain on the SDKs and the endpoint behind them is unchanged; the two
  babelconnect flags they used to carry are no longer read by anything.

## 0.26.2 — 2026-09-16

- Nothing you can observe. 0.26.0 and 0.26.1 both stopped short: our conformance gate looked for its
  report in the wrong directory and failed the tag pipeline before the container image and the Helm
  chart were published. 0.26.2 is the same code with that gate fixed, and is the first of the three
  to publish completely. No SDK, embedding-contract or agent-app behaviour changed across any of them.

## 0.26.1 — 2026-09-16

- Nothing you can observe. The release pipeline for 0.26.0 failed on our own conformance gate, whose
  pass-count floor could not tolerate a scenario that is known to flap; the gate now holds the number
  of scenarios that reached a verdict instead. No SDK, embedding-contract or agent-app behaviour
  changed between 0.26.0 and 0.26.1.

## 0.26.0 — 2026-09-16

- **An accepted `placeCall` whose agent leg never arrives now tells you so.** A new error code,
  `no_agent_leg`, arrives about ten seconds after the platform accepted the call, while the dial is
  still pending — the agent's leg is being delivered somewhere this client is not. Show the agent
  that the call did not go through rather than leaving them on "Calling…", and let them retry.
- **A client that stops answering the stream's `Ping` is dropped after three intervals (45 s).** The
  registration is what calls are routed by, so a slept laptop or a dropped link no longer keeps
  receiving offers nobody can answer. Every first-party SDK already answers a ping; nothing to change.
- Nothing else in the embedding contract changed. The rest of this release is the server's own
  routing and the specification's conformance gate.

## 0.25.0 — 2026-09-15

- A cold transfer to the caller's own number is refused with `transfer_target_unreachable`; the caller stays with the agent.
- **A conference command can name the call it acts on.** `startConference`, `addConferenceMember` and
  `leaveConference` now take an optional call id, the way `mute`, `hold` and `transfer` already do. An
  agent holding two calls can start or leave a conference on the one they mean; leaving it out still
  means the current call, so nothing an existing integration sends changes behaviour. The TypeScript,
  Dart, Go and Python SDKs all carry the field, and each fills it from the active call when you do not
  pass one.

- **Two new error codes.** `ambiguous_call` answers a conference command that names *no* call while the
  agent holds more than one — the server refuses to guess which conversation you meant, and the fix is
  to resend the command with the call id. `call_on_hold` answers keypad digits sent into a held call:
  hold silences audio in both directions, so the digits would never have reached the far end, and the
  send used to be a silent no-op. Take the call off hold, or gate the keypad on the call's hold state.

- **A second window of the same agent is refused, and says so.** An embedded app in two host windows
  with the same agent used to open two sessions, and only one of them could reach the live call — so
  mute, hold, hang up and transfer did nothing in the other. The embedded app now takes part in the
  single-instance guard: the second instance shows a take-over screen, starts no session, and never
  renders controls that act on nothing. Every transition is reported to the host as a new event,
  `session.guard` `{state, instanceId}`, with state `holder`, `blocked` or `released`. The guard is
  keyed on the **browser origin**, not on the agent, so a second embed on the same page is blocked even
  when your host hands it a different token; a host that needs two agents side by side needs two
  origins. Taking over mid-call does not hang up — the call is parked briefly and reclaimed by the new
  instance, exactly as on a reload.

- **Every event names the instance it came from, and says which one holds the audio.** Each app→host
  message now carries an `instanceId` — yours from `EmbedOptions.instanceId`, otherwise generated per
  mount — and the embed exposes `bc.instanceId` plus a `{name, instanceId}` second argument on every
  `on()` handler. `cti.call` gains `ownsMedia`, true only in the instance whose own connection holds
  that call's audio, and a `call.media_owner` event fires when ownership changes. The owning instance
  arms the browser's own close prompt, so an agent is warned before closing the window carrying the
  live call (the browser only shows it once the agent has clicked inside the embed, and no browser
  allows custom wording). Two embeds on one page no longer receive each other's events.

- **The host theme rules are what the documentation says.** A colour must be `#rrggbb`, or `#aarrggbb`
  only when the alpha is `FF`; any other alpha is refused by name — including the RGBA order a design
  tool emits, where `#112233FF` is alpha `11`. A `surfaceColor` now re-derives the app's container
  tints from your surface as contrast-checked tonal steps, so card and dialog text stays at WCAG AA in
  either mode instead of, say, painting white on a dark surface sent in light mode. `cornerRadius`
  reaches cards, dialogs and popup menus, and deliberately not controls; send no token and the app
  keeps its own shapes. A refused token is reported once and no longer re-sent on every reload, so it
  cannot earn a repeated rejection.

- **The embed bundle is about six times smaller.** The bundled legacy bridge is loaded on demand,
  only when you pass `legacyBridge: true`, instead of riding in the module entry point: the ES module
  entry drops from roughly 45 KB to 7 KB. The browser bundle for a `<script src>` host is unchanged and
  still self-contained. Because the bridge can now arrive after `mount()` returns, calls you make in
  between are queued and replayed in order, and a bridge that fails to load is reported as
  `cti.error{legacy_bridge_failed}` rather than thrown.

- **Events sent before your first command reach you again.** If your embed allowlist holds only patterns
  and no exact host origin, every app→host event fired before the host's first command was posted to an
  empty list of targets — including the `cti.error{no_token}` that says the token handoff failed, which is
  the only diagnostic you have at that point. The embedding page's own origin is now matched against the
  allowlist by the same rule a command sender is checked with, and the boot events are delivered there. A
  data event still never goes to `*`, and an origin nothing matched is dropped and named in a console
  warning rather than posted blind.

- **Recording commands name the call they act on.** `startRecording`, `stopRecording`, `flagRecording` and
  `setRecordingTags` now resolve the call id you send, the way answer, mute, hold, digits and transfer
  already did. `stopRecording` for call B while A was the current call used to stop A and then tell you B
  had stopped. Leaving the id out still means the current call; an id the agent does not hold is refused
  with `no_call` instead of being applied to another call.

- **A reload or a closed window no longer strands the agent's other calls.** An agent holding two calls
  who reloaded or closed the window kept only the call that was current — the rest stayed up on the
  platform with nothing attached to them. Every call the agent holds is now parked together for the
  reconnect grace window, so one reload reclaims all of them and one expiry ends all of them.

- **The Python SDK stubs are regenerated and require `protobuf>=7.36.0`.** The committed stubs were 31
  types behind the schema — 19 messages and 2 enums missing and 10 changed, among them the three
  conference commands — so Python was the one SDK the call-id regeneration had missed. The regenerated
  code checks the protobuf runtime version at import time and raises on anything older, so the
  requirement now pins that floor instead of naming `protobuf` bare.

- **The Events page on this site renders again.** The AsyncAPI document it serves is meant to be a
  self-contained bundle, but it shipped with its external references unresolved, and a browser cannot
  follow those — the page showed an error banner where the event catalogue belongs. The document is now
  bundled when these docs are built.

## 0.24.3 — 2026-09-14

- **The cold-transfer failure codes now read every spelling of a reason.** The four codes introduced
  in 0.24.2 — `transfer_target_no_answer`, `transfer_target_unreachable`, `transfer_target_busy`,
  `transfer_target_declined` — are derived through a single normalisation, so a reason that differs
  only in case, surrounding whitespace or word separator maps to the same code. Nothing you can
  observe changes: on the live transfer path the normalisation already applied in 0.24.2, and every
  code an agent saw then is the code they see now. This closes the gap for a caller that supplies a
  reason itself.

## 0.24.2 — 2026-09-14

- **A failed cold transfer now says why.** Every way an invited target could fail produced one code,
  `transfer_rejected`, and one sentence, "transfer target did not answer" — a colleague who is not
  logged in and one who simply lets it ring were indistinguishable to the transferring agent. The
  abort now carries **`transfer_target_no_answer`**, **`transfer_target_unreachable`**,
  **`transfer_target_busy`** or **`transfer_target_declined`**. `transfer_rejected` remains as the
  fallback for a reason the vocabulary does not name, so a client that branched on it keeps working.
  `ConferenceMember.failure_reason` carries the same word on the conference patch.

- **A blocked line says why.** When an agent's line is blocked, `AgentInfo.line_blocked_reason` now
  names the cause — `unreachable`, `busy`, `declined` or `dnd`, and empty when the line is not
  blocked. An agent whose phone rang for a colleague's transfer and who did not reach it in time can
  be told that, instead of seeing an unexplained blocked line.

- **An incoming call is no longer mistaken for your own outbound call.** If a queue offer arrived in
  the window between placing a call and that call ringing back, it was labelled as the agent's own
  outbound leg — so a client set to answer its own dials automatically could connect an agent to a
  caller they never accepted. The two are now told apart by the number on the leg.

## 0.24.1 — 2026-09-14

- **An agent holding two calls could lose one of them.** Every action your integration sends —
  answer, hang up, mute, hold, keypad digits, transfer — names the call it applies to. The server
  was ignoring that name and applying the action to whichever call had rung most recently.

  With one call in progress this was invisible. With two, the action landed on the wrong call.
  Answering the second applied its answer to the first, so the second was never answered: it rang
  out, and the agent's line was then marked unreachable and blocked. Muting silenced the wrong
  call, and a transfer could move a caller to a destination chosen for a different conversation. A
  call bouncing between agents is exactly the situation that leaves an agent holding two calls.

- **A cold transfer now completes on the call it was started for**, rather than on whatever call
  became current while the transfer target was still ringing.

- **No change is required in your integration.** The SDKs already send the call id on every
  command; the server now uses it. A command that omits the id still applies to the agent's current
  call, as before. A command naming a call the agent does not hold is now refused with `no_call`
  instead of being applied to another one.

## 0.24.0 — 2026-09-13

- **Use the v2 embed API with a legacy app.** The TypeScript SDK now includes
  the legacy iframe bridge in its module and browser bundles. Set
  `legacyBridge: true` and supply your application's `legacyAuth` hook; no
  additional package or script is needed. Session, context, dialing and the
  supported tabs keep the same host API. Loaded events remain minimal unless
  you request `eventsVersion: "v1"`. See the
  [legacy-runtime guide](./typescript/embedding#5-use-the-v2-api-with-a-legacy-app).
- **The embedding reference covers the adapter and host themes.** It explains
  credential refresh, bridge disposal, supported tabs, unsupported theme
  operations, and the current app's theme tokens.
- **Layout and embedding improvements:** the app offers a right-to-left layout
  override, and wildcard origin patterns can cover multiple subdomain levels.

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
