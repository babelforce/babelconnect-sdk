---
title: Embedding the agent app
sidebar_label: Embedding
sidebar_position: 4
description: Mount the agent app, pass tokens, and handle host commands and events.
---

# Embedding the agent app

Mount the ready-made agent app inside your CRM and drive it through the SDK's `/embed` entry point.
For your own interface, start with the [TypeScript tutorial](../tutorial/first-softphone).

## 1. Drop it in

Install `@babelforce/babelconnect-sdk` and use this helper in a bundled TypeScript application.
Pass a real container, the agent-app origin, and a token from your login:

```ts
import { BabelconnectEmbed } from "@babelforce/babelconnect-sdk/embed";

export function mountAgent(container: HTMLElement, serverUrl: string, token: string) {
  const bc = BabelconnectEmbed.mount({ container, serverUrl, token });
  bc.on("agent.loaded", () => {
    bc.calls.dial("+15551234567", false); // pre-fill only, after login completes
  });
  bc.on("cti.error", data => console.error("cti.error", data));
  return bc; // call bc.dispose() when this view closes
}
```

`mount` injects an iframe. Set dimensions on its container, for example `width: 380px;
max-width: 100%; height: 640px`. The iframe fills it; `className` and `bc.element` let you style it.
Optional `path` defaults to `/`; `session`/`context` seed correlation; `theme` brands the app.

The iframe permits `microphone; autoplay`. The host must also allow microphone use: if it sets
Permissions-Policy or is itself framed, delegate microphone access to the app origin. Browser
permission and autoplay rules still apply.

## 1b. Script tag (no bundler)

Load `/embed/babelconnect-embed.iife.js` from a current app deployment, or copy
`dist/web/babelconnect-embed.iife.js` from the npm package to your own assets:

```html
<script src="https://agent.example.com/embed/babelconnect-embed.iife.js"></script>
```

It defines `window.BabelconnectEmbed` with the same mount API. Use that global instead of the
import above; supply the container and token from your host's login code. A browser cannot resolve
the npm bare import by itself. The server-served bundle uses `Cache-Control: no-cache` for
revalidation; the npm `/embed` entry remains ESM. The bundle's origin may differ from the iframe's.

## 2. Token handoff (security)

The token is handed to the app **over `postMessage` after the app signals `ready`** — never in the iframe
URL (a URL token leaks into history/referrer/logs). You just pass `token` to `mount()`; the SDK performs
the handshake:

```text
app → host:  { type: "bcConnect", name: "ready" }
host → app:  { type: "connect", module: "auth", name: "auth.set", args: { token, session?, context?, eventsVersion? } }
host → app:  { type: "connect", module: "app", name: "app.setTheme", args: { …theme } }   ← only if you gave mount() a theme
app → host:  { type: "bcConnect", name: "agent.loaded", data: { agentId, … } }
```

**Refreshing the token mid-session:** send `auth.set` again with the new token once the agent is
already live — the current app applies it **in place**, without interrupting the session or any active call:
the next request (and the next automatic reconnect of the state stream, if the connection ever drops)
uses the new token, and the handshake is **not** re-run (no second `ready` / `agent.loaded` /
`user.loaded`). An `auth.set` that arrives while the session is still starting (before `agent.loaded`)
is ignored — refresh only once the agent is live. The SDK sends the initial `auth.set` for you at
mount; to refresh, use the SDK's authentication group:

```ts
bc.auth.set({ token: newToken });
```

The SDK checks the app origin, iframe source when present, and any supplied `instanceId`.
The app validates the host message origin. Configure these separately:

| Setting | Purpose |
|---|---|
| `BC_EMBED_ORIGINS` | Host origins allowed to exchange messages; falls back to `BC_CORS_ORIGINS` when unset. A framed app with no message allowlist fails closed. |
| `BC_FRAME_ANCESTORS` | CSP framing permission; the chart defaults to `'self'`, so add the host origin. An explicit empty setting permits all framing. |
| `BC_CORS_ORIGINS` | Cross-origin API access; independent of framing permission. |

See [Authentication](../guides/authentication#security-checklist) for token handling.

## 3. Drive the app (host → app)

Drive the app **after `agent.loaded`** — these calls `postMessage` straight to the iframe and aren't buffered,
so a `calls.dial` sent before the app has loaded and connected is dropped. (`app.setTheme` is the one
exception: the SDK re-sends the merged theme at every `ready`, so an early call still lands.)

| Call | Effect |
|---|---|
| `bc.calls.dial(number, dial = true)` | place a call (or `dial=false` to only pre-fill the dialer) with the agent's display-as + your `session` |
| `bc.session.set({ number?, smsBody?, … })` | replace session correlation; a `number` pre-fills a new SMS (`to` + `smsBody`/`body`) and switches to the messaging tab |
| `bc.context.set({ … })` | merge into the persisted shared context carried onto subsequent calls/SMS |
| `bc.app.setTab("phone" \| "messaging" \| "phonebook" \| "history" \| "account" \| "outbound")` | switch the active tab (`"chat"`→`"messaging"` and `"contacts"`→`"phonebook"` are accepted as aliases; an unknown name is ignored, and a tab the deployment has disabled falls back to the first visible tab) |
| `bc.app.setTheme({ … })` | brand the app with your own tokens, mid-session and without a reload — see [3b. Theme the app](#3b-theme-the-app-your-brand-inside-the-iframe) |

`context` persists across interactions; `session` describes the current interaction and overrides
context on key clashes. The merged map accompanies calls and SMS. Numeric tabs `0`–`3` mean phone,
messaging, history and outbound; out-of-range indices are ignored.

:::note Feature config is per deployment
Which surfaces the app shows is server-driven per deployment/account. Read the agent's effective config from
`GET /v1/agent/state` → `AgentView.config` (`calls`/`messaging`/`phonebook`/`history`/`account`/`outbound`/`cti`,
each with `enabled` + settings); defaults are all-on. See the [`AppConfig` message](../protocol/grpc) in the
gRPC reference.
:::

## 3b. Theme the app (your brand inside the iframe)

Pass an [EmbedTheme](./api/embed/interfaces/EmbedTheme) to `mount`, or call
`bc.app.setTheme({ mode: "dark" })` later. The SDK sends it after `auth.set` on every `ready`,
including when set before startup. Subscribe to `cti.error` for `theme_rejected`.

### Tokens

Every key the app accepts, taken from the code that parses it. Anything else in the payload is ignored,
never refused — a token added in a later SDK is always safe to send to an older app.

| Token | Type · accepted format | What it reaches | Default when you don't send it |
|---|---|---|---|
| `brandName` | string, 1–64 characters after trimming | the window/tab title and the accessible label of the logo (sign-in screen and header). It is **not painted as text** — the header shows the logo alone. | the deployment's product name, else `babelConnect` |
| `logoUrl` | string, an absolute **`https:`** URL with a host | the logo on the sign-in screen and in the app header, rendered as-is (never recoloured) | the deployment's logo, else the built-in babelconnect mark |
| `accentColor` | string, `#rrggbb` — 6 hex digits, or 8 as `#aarrggbb` **whose alpha is `FF`**; the `#` optional, case-insensitive. Any other alpha is refused, including the RGBA order a design tool may hand you (`#112233FF` is alpha `11`, not `FF`). | the accent role: primary (filled) buttons and the call actions. Its text/icon colour is **derived** for contrast, never taken from you. | the deployment's accent colour, else `#F94721` |
| `mode` | `"light"` \| `"dark"` \| `"system"` (case-insensitive) | light or dark; `system` follows the viewer's OS setting. Overrides the agent's own choice in the Account tab for as long as you keep it set. | the agent's own choice (stored by the app; light until they change it) |
| `primaryColor` | string, same format as `accentColor` | the primary colour role (focused input borders and other primary-role controls); its foreground is derived. The lighter container tints keep their defaults. | `#05445E` in light, `#5BCACE` in dark |
| `surfaceColor` | string, same format as `accentColor` | the base surface: page background and app bar; its text colour is derived. The container tints — cards, dialogs, popup menus, the navigation bar — are re-derived from your colour as small, contrast-checked tonal steps of it, so the text stays readable (WCAG AA) whichever end of the scale you send, in either mode. | `#FFFFFF` in light, `#0F1424` in dark |
| `cornerRadius` | number, `0`–`32` (a JSON number, not a string) | the corner radius of the app's containers — cards, dialogs and popup menus — in logical pixels. Controls (buttons, chips, inputs) keep their own shapes. | `12` for cards; dialogs and popup menus keep the app's own shapes until you send the token |

**Not a token:** the help link on the Account tab stays the deployment's — a host cannot redirect it.

### Precedence — one rule, applied per token

Each accepted host token overrides the deployment value, then the built-in default. Deployment
branding covers only name, logo and accent; `mode` falls back to the agent's stored preference.
No theme (or `{}`) leaves the deployment's brand. The Account help link is deployment-owned.

### Refused values: `cti.error` with `code: "theme_rejected"`

Wrong types or values outside the table produce one `theme_rejected` event naming every refused
token. Accepted siblings still apply; refused tokens fall back to deployment/default values.
Unknown keys are silently ignored. A valid logo URL that fails to load shows the built-in mark
without an error. The SDK suppresses rejected tokens on later ready re-sends until you set them again.

### `setTheme()` mid-session

`setTheme` merges: omitted tokens stay, supplied tokens replace, and `null` resets a token to its
fallback. Changes apply to open screens without reconnecting or interrupting audio. They don't
change the stored user preference, deployment help link, or iframe size/placement.

### Persistence and reloads

The app does not persist a theme. The SDK remembers the merged theme and re-sends it on iframe
reload; a host-page reload must supply it again. If you use raw `postMessage`, send the full set
after every `ready`:

```text
{ type: "connect", module: "app", name: "app.setTheme",
  args: { brandName?, logoUrl?, accentColor?, mode?, primaryColor?, surfaceColor?, cornerRadius? } }
```

## 4. React to the app (app → host)

```ts
bc.on("cti.call", data => crm.logCall(data));             // {call:{id,state,type,from,to,ownsMedia}}
bc.on("cti.error", data => crm.showError(data));          // {code,message}: e.g. missing caller ID
bc.on("cti.message", (data) => crm.screenPop(data));       // screen-pop forwarded from the platform
bc.on("cti.iframe", (data) => crm.openIframe(data));
bc.on("cti.outbound.lead", (data) => crm.showLead(data));
bc.on("agent.loaded", (data) => {/* … */});           // fired once when the agent is ready ({ agentId })
bc.on("user.loaded", () => {/* … */});                // companion lifecycle event, also once on ready
```

Any CTI push whose `kind` the app doesn't recognize is forwarded as `cti.message` too (rather than
under its own name), with the original kind carried at `data.kind` — an unknown kind is never silently
dropped; it degrades to a generic screen-pop until the app adds first-class support for it. A
recognized screen-pop carries no `data.kind`, so its presence on a `cti.message` event tells you it
was a forward-compat fallback.

Event data has TypeScript type `unknown`: narrow it before reading fields, according to the
deployed app's schema. The `crm` functions above are host-provided handlers.

`on()` returns an unsubscribe function. `bc.element` is the injected `<iframe>` (reach for it to style or
resize it), and `bc.dispose()` removes it and stops listening — tearing down the embedded app and releasing
its microphone, so call it when your component unmounts.

:::note Which events fire depends on the app
The SDK relays whatever the embedded app posts, so the **forwarded** events above
(`cti.error` / `cti.message` / `cti.iframe` / `cti.outbound.lead`) only arrive if the deployed agent-app
version emits them. After authentication, `agent.loaded` waits for a nonempty agent ID; `user.loaded` is emitted
without waiting for that snapshot. `cti.call`
is gated by `config.cti.emitCallEvents` — don't assume the rest are present without confirming against your
deployment.
:::

`cti.call` carries `{ call: { id, state, type, from, to, ownsMedia } }`. State is a lowercase
lifecycle (`ringing`, `in_progress`, `bridged`, `completed`, `failed`); type is inbound/outbound.
Emission follows state or media-ownership changes and requires `config.cti.emitCallEvents`.

### Loaded event schema version

Unset and unknown `eventsVersion` use the current app's minimal shape: `agent.loaded` carries
`{ agentId }`; `user.loaded` has no payload. The legacy adapter below normalizes both to `{ agentId }`.
Opt into `eventsVersion: "v1"` only when your host needs the older agent/user data:
`agent.loaded` adds `agent: { id, name, email, number }`; `user.loaded` adds `user: { email }`.
Set it at mount. Changing it through `auth.set` takes effect on the next ready handshake, not on
already-emitted live-session events. The agent email belongs to the agent; the user email identifies
the login, and they can differ. The opt-in does not add account details or user roles.

### Multiple tabs and multiple embeds

Each mount has an `instanceId` (generated if omitted, at most 128 characters when supplied).
It is correlation, not authorization. The listener's second argument carries envelope metadata;
older apps may omit its ID. `cti.call.ownsMedia` identifies the instance with audio, and
`call.media_owner` reports `{ callId, instanceId, ownsMedia }` when ownership changes. Shared call
visibility does not grant each mount an audio leg.

The current web app guards one live session per agent across instances on the app's origin.
A second instance shows **Use here instead** before connecting. `session.guard` reports
`{ state, instanceId }`, with `holder`, `blocked` or `released`; its guard ID is distinct from the
SDK mount ID. This coordination does not span browser profiles, different browsers or native apps.
Taking over closes the previous media leg: it is not seamless audio transfer.

While an instance owns a call, it registers a browser close guard. A prompt needs a prior user
gesture inside that iframe; a click only in your CRM does not arm it. The browser chooses the text,
and crashes/force-quits bypass it. A host can also register its own guard from `call.media_owner`.
The app's desktop ring notifications are disabled inside an iframe; the host handles attention.

### Resizing

`resized` reports app dimensions. Avoid feedback loops: update container dimensions only when they
change, bound them to your layout, and don't add the same padding on every event. You can also
keep a fixed-height container. `bc.dispose()` removes the iframe and listeners when your view closes.

## 5. Use the v2 API with a legacy app

The SDK includes a legacy iframe bridge in both its `/embed` module and its
browser bundle. Select it for one mount with `legacyBridge: true`. Set
`serverUrl` to the **legacy app's origin** and, if necessary, `path` to its
entry path. Omitting `legacyBridge` selects the current app protocol.

You must provide `legacyAuth`. Its `set` function hands credentials to the
legacy app using **your application's existing authentication integration**.
The SDK does not define a legacy token, cookie or storage mechanism.
`getAgentToken()` and `handOffLegacyCredentials()` below are functions your
application supplies; the latter must actually authenticate the selected app.

```ts
// legacy-runtime-example
import { BabelconnectEmbed } from "@babelforce/babelconnect-sdk/embed";

const bc = BabelconnectEmbed.mount({
  container: document.getElementById("bc")!,
  serverUrl: "https://legacy-agent.example.com",
  token: await getAgentToken(),
  legacyBridge: true,
  legacyAuth: {
    set: (args) => handOffLegacyCredentials(args),
  },
  session: { ticketId: "ticket-123" },
  context: { source: "crm" },
});

bc.on("agent.loaded", () => {
  bc.calls.dial("+49301234567", false); // pre-fill after the app is connected
  bc.app.setTab("phone");
});
bc.on("cti.error", (error) => console.error(error));

// Once your token has been refreshed:
bc.auth.set({ token: await getAgentToken() });

// When the containing view is closed:
// bc.dispose();
```

The hook receives the full current
[`AuthSetArgs`](./api/embed/interfaces/AuthSetArgs) payload: `token` and any
`session`, `context`, or `eventsVersion` you set. It runs on iframe load and
on `bc.auth.set()`, including after a reload. A thrown error or rejected
promise emits `cti.error` with `code: "legacy_auth_failed"`; other bridge
failures use `legacy_bridge_failed`.

Legacy `ready` is synthesized from **iframe load**. It does not wait for
authentication to finish. Wait for `agent.loaded` before dialing or switching
tabs. Calls return `void`; they do not acknowledge that the app completed an
operation.

| Operation | Legacy behavior |
|---|---|
| `bc.calls.dial(number, dial)` | Dial or pre-fill, carrying the current session. |
| `bc.session.set(values)` | Replace session correlation. |
| `bc.context.set(values)` | Merge shared context. |
| `bc.app.setTab(name)` | `phone`, `messaging` (`chat`), `history`, and `outbound` map to legacy indices `0`–`3`. Numeric indices pass through. |
| `bc.on(name, handler)` | Forward app events. Loaded events default to `{ agentId }`; `eventsVersion: "v1"` opts into the legacy agent/user fields. |
| `bc.dispose()` | Remove the iframe, subscriptions and connection's message listener. |

`phonebook`, `contacts`, `account` and unknown named tabs throw
[`UnsupportedEmbedFeatureError`](./api/embed/classes/UnsupportedEmbedFeatureError).
Legacy mode also rejects `theme` at mount and `bc.app.setTheme()` with that
error. The theme section above applies to the current app. Supplying only
one of `legacyBridge` and `legacyAuth` throws
[`LegacyEmbedConfigurationError`](./api/embed/classes/LegacyEmbedConfigurationError).

For **script-tag usage**, load `babelconnect-embed.iife.js` from a current SDK
deployment or copy `dist/web/babelconnect-embed.iife.js` from this npm package
to your host's assets. Then use `window.BabelconnectEmbed.mount()` with the
same options above. The SDK bundle and the legacy iframe may be served from
different origins; `serverUrl` always identifies the iframe's origin. No
additional legacy script or global is required. The legacy bridge accepts
messages only from that origin and that iframe window.

Here is the script-tag version in plain JavaScript. Copy the package's browser
bundle to `/assets/babelconnect-embed.iife.js` and supply the two authentication
functions described above:

```html
<!-- legacy-script-example -->
<div id="bc" style="width: 380px; height: 640px"></div>
<script src="/assets/babelconnect-embed.iife.js"></script>
<script>
(async () => {
  const bc = window.BabelconnectEmbed.mount({
    container: document.getElementById("bc"),
    serverUrl: "https://legacy-agent.example.com",
    token: await getAgentToken(),
    legacyBridge: true,
    legacyAuth: { set: (args) => handOffLegacyCredentials(args) },
    session: { ticketId: "ticket-123" },
    context: { source: "crm" },
  });
  bc.on("agent.loaded", () => {
    bc.calls.dial("+49301234567", false);
    bc.app.setTab("phone");
  });
  bc.on("cti.error", (error) => console.error(error));
  // Later: bc.auth.set({ token: refreshedToken });
  // When this view closes: bc.dispose();
})();
</script>
```

An application with its own lifecycle-capable bridge can supply a
[`LegacyBridge`](./api/embed/interfaces/LegacyBridge) object instead of `true`.

## Reference

- Host-side API: [`BabelconnectEmbed`](./api/embed/classes/BabelconnectEmbed),
  [`EmbedOptions`](./api/embed/interfaces/EmbedOptions) and the [`EmbedTheme`](./api/embed/interfaces/EmbedTheme)
  token set.
- The data shapes carried on these events are the `babelconnect.v1` types — see the
  [gRPC / proto contract](../protocol/grpc) and the [REST / OpenAPI reference](pathname:///reference/rest/).
