---
title: Embedding the agent app
sidebar_label: Embedding
sidebar_position: 4
description: Embed the prebuilt babelconnect agent app in your page and drive it over a postMessage bridge.
---

# Embedding the agent app

Embed the prebuilt **babelconnect agent app** into your host page (e.g. a CRM) with one snippet, then
drive it and react to it over a `postMessage` bridge. This is the host-developer guide; it's implemented by
the SDK's `/embed` entry point on the host side.

:::tip Embed or build your own?
Embedding gives you the **whole agent UI** for the cost of one snippet — fastest if the prebuilt app fits.
If you need a **custom UI** (your own call card, layout, or styling), use the
[programmatic client](./quickstart-client) instead: same server, you render `AgentView` and send intents
yourself. Both connect to the same babelconnect-server origin with the same token.
:::

## 1. Drop it in

```html
<div id="bc" style="width: 380px; height: 640px"></div>
<script type="module">
  import { BabelconnectEmbed } from "@babelforce/babelconnect-sdk/embed";

  const bc = BabelconnectEmbed.mount({
    container: document.getElementById("bc"),
    serverUrl: "https://agent.example.com", // your babelconnect-server origin
    token: await getAgentToken(),            // your login → a bearer token
  });

  bc.on("agent.loaded", () => console.log("agent ready"));
  bc.on("cti.call", ({ call }) => console.log("call", call.state, call.from, call.to));
</script>
```

`mount()` injects an `<iframe>` pointing at the babelconnect agent app served by babelconnect-server, and
starts the bridge. The app talks only to babelconnect-server (gRPC-web + the `/oauth/token` proxy on that
one origin). `mount()` also takes optional `session` / `context` (initial correlation, sent with the token),
`theme` (your brand inside the iframe — see [3b](#3b-theme-the-app-your-brand-inside-the-iframe)),
`path` (the app route, default `/`), and `className` (a CSS class for the iframe).

**Sizing:** the iframe fills its container at `100%` × `100%`, so set the dimensions on the **container**
element (as in the snippet above) — or style the iframe directly via `className` or `bc.element`. The agent app
is a fixed-width panel, so a container around `380×640` suits it.

:::note Microphone & autoplay
The injected iframe carries `allow="microphone; autoplay"` so the embedded softphone can capture the agent's
mic and play call audio. That only takes effect if the **host page** is itself permitted to use the
microphone — if your page sets a `Permissions-Policy` (or is itself framed), delegate `microphone` to the
babelconnect-server origin, or the agent will have a call with no audio.
:::

## 2. Token handoff (security)

The token is handed to the app **over `postMessage` after the app signals `ready`** — never in the iframe
URL (a URL token leaks into history/referrer/logs). You just pass `token` to `mount()`; the SDK performs
the handshake:

```text
app → host:  { type: "bcConnect", name: "ready" }
host → app:  { type: "connect", module: "auth", name: "auth.set", args: { token, session?, context? } }
host → app:  { type: "connect", module: "app", name: "app.setTheme", args: { …theme } }   ← only if you gave mount() a theme
app → host:  { type: "bcConnect", name: "agent.loaded", data: { agentId, … } }
```

**Refreshing the token mid-session:** send `auth.set` again with the new token once the agent is
already live — the app applies it **in place**, without interrupting the session or any active call:
the next request (and the next automatic reconnect of the state stream, if the connection ever drops)
uses the new token, and the handshake is **not** re-run (no second `ready` / `agent.loaded` /
`user.loaded`). An `auth.set` that arrives while the session is still starting (before `agent.loaded`)
is ignored — refresh only once the agent is live. The SDK sends the initial `auth.set` for you at
mount; to refresh, post the same message to the iframe yourself:

```ts
bc.element.contentWindow?.postMessage(
  { type: "connect", module: "auth", name: "auth.set", args: { token: newToken } },
  "https://agent.example.com", // your babelconnect-server origin
);
```

Both ends validate `event.origin`. In production, configure your babelconnect-server so that its **CSP
`frame-ancestors`** and **CORS allowlist** name only your host origin(s) — this is what restricts who may
frame the app and which origins the bridge will accept messages from (and target). If left open, the bridge
stays permissive. (See the [security checklist](../guides/authentication#security-checklist) for the full list.)

## 3. Drive the app (host → app)

Drive the app **after `agent.loaded`** — these calls `postMessage` straight to the iframe and aren't buffered,
so a `calls.dial` sent before the app has loaded and connected is dropped. (`app.setTheme` is the one
exception: the SDK re-sends the merged theme at every `ready`, so an early call still lands.)

| Call | Effect |
|---|---|
| `bc.calls.dial(number, dial = true)` | place a call (or `dial=false` to only pre-fill the dialer) with the agent's display-as + your `session` |
| `bc.session.set({ number?, smsBody?, … })` | attach session correlation; a `number` pre-fills a new SMS (`to` + `smsBody`/`body`) and switches to the messaging tab |
| `bc.context.set({ … })` | merge into the persisted shared context carried onto subsequent calls/SMS |
| `bc.app.setTab("phone" \| "messaging" \| "phonebook" \| "history" \| "account" \| "outbound")` | switch the active tab (`"chat"`→`"messaging"` and `"contacts"`→`"phonebook"` are accepted as aliases; an unknown name is ignored, and a tab the deployment has disabled falls back to the first visible tab) |
| `bc.app.setTheme({ … })` | brand the app with your own tokens, mid-session and without a reload — see [3b. Theme the app](#3b-theme-the-app-your-brand-inside-the-iframe) |

**`session` vs `context`:** both are correlation maps merged onto the calls and SMS the agent sends from the
embed. `context` is the **persistent** layer (it sticks across interactions); `session` is the
**per-interaction** layer and **overrides `context`** on key clashes. Choose by how long the data should ride
along.

:::note Feature config is per deployment
Which surfaces the app shows is server-driven per deployment/account. Read the agent's effective config from
`GET /v1/agent/state` → `AgentView.config` (`calls`/`messaging`/`phonebook`/`history`/`account`/`outbound`/`cti`,
each with `enabled` + settings); defaults are all-on. See the [`AppConfig` message](../protocol/grpc) in the
gRPC reference.
:::

## 3b. Theme the app (your brand inside the iframe)

The embedded app can wear **your** brand instead of the deployment's. Pass `theme` to `mount()`, or change
it later with `bc.app.setTheme()` — both take the same [`EmbedTheme`](./api/embed/interfaces/EmbedTheme)
token set:

```ts
const bc = BabelconnectEmbed.mount({
  container: document.getElementById("bc"),
  serverUrl: "https://agent.example.com",
  token: await getAgentToken(),
  theme: {
    brandName: "Acme CRM",                         // tab title + the logo's accessible label
    logoUrl: "https://crm.example/acme-logo.svg",  // https: only, rendered as-is
    accentColor: "#112233",                        // primary buttons and call actions
    mode: "system",                                // "light" | "dark" | "system"
  },
});

bc.on("cti.error", ({ code, message }) => {
  if (code === "theme_rejected") console.warn(message); // a token the app refused — see below
});

// later, mid-session — no reload, no interruption to a live call:
bc.app.setTheme({ mode: "dark" });
```

The theme rides the same `ready` handshake as the token (the SDK posts `app.setTheme` right after
`auth.set`), so the sign-in screen is already branded — there is nothing to wait for, and unlike
`calls.dial`, a `setTheme()` issued before the app is ready is not lost.

### Tokens

Every key the app accepts, taken from the code that parses it. Anything else in the payload is ignored,
never refused — a token added in a later SDK is always safe to send to an older app.

| Token | Type · accepted format | What it reaches | Default when you don't send it |
|---|---|---|---|
| `brandName` | string, 1–64 characters after trimming | the window/tab title and the accessible label of the logo (sign-in screen and header). It is **not painted as text** — the header shows the logo alone. | the deployment's product name, else `babelConnect` |
| `logoUrl` | string, an absolute **`https:`** URL with a host | the logo on the sign-in screen and in the app header, rendered as-is (never recoloured) | the deployment's logo, else the built-in babelconnect mark |
| `accentColor` | string, `#rrggbb` or `#aarrggbb` — 6 or 8 hex digits, the `#` optional, case-insensitive | the accent role: primary (filled) buttons and the call actions. Its text/icon colour is **derived** for contrast, never taken from you. | the deployment's accent colour, else `#F94721` |
| `mode` | `"light"` \| `"dark"` \| `"system"` (case-insensitive) | light or dark; `system` follows the viewer's OS setting. Overrides the agent's own choice in the Account tab for as long as you keep it set. | the agent's own choice (stored by the app; light until they change it) |
| `primaryColor` | string, same format as `accentColor` | the primary colour role (focused input borders and other primary-role controls); its foreground is derived. The lighter container tints keep their defaults. | `#05445E` in light, `#5BCACE` in dark |
| `surfaceColor` | string, same format as `accentColor` | the base surface: page background and app bar; its text colour is derived. Cards, dialogs and the navigation bar keep their own tints. | `#FFFFFF` in light, `#0F1424` in dark |
| `cornerRadius` | number, `0`–`32` (a JSON number, not a string) | the corner radius of cards and containers, in logical pixels | `12` |

**Not a token:** the help link on the Account tab stays the deployment's — a host cannot redirect it.

### Precedence — one rule, applied per token

For **each token independently**, the app shows:

1. the value **you** sent, if it accepted it; otherwise
2. the value the **deployment** configured — its server-side brand: product name, logo and accent colour
   (`BC_BRAND_NAME` / `BC_BRAND_LOGO_URL` / `BC_BRAND_COLOR` on babelconnect-server); otherwise
3. the **built-in default** from the table.

A token the app refused counts as not sent. `mode`, `primaryColor`, `surfaceColor` and `cornerRadius` have
no deployment layer, so step 2 is skipped for them (for `mode`, the agent's own choice is what step 3
means). No `theme` at all — or `theme: {}` — renders exactly the deployment's brand.

### Refused values: `cti.error` with `code: "theme_rejected"`

The app validates each token and refuses, **by name**, anything outside the formats in the table: a colour
that is not 6 or 8 hex digits, a `logoUrl` that is not `https:` (or has no host), a `mode` outside the three
names, a `cornerRadius` below `0`, above `32` or not a number, a `brandName` that is blank or longer than
64 characters, or any token of the wrong JSON type. You get **one** event per payload, naming every refused
token:

```json
{
  "code": "theme_rejected",
  "message": "app.setTheme: ignored malformed token(s) accentColor, logoUrl — the deployment brand stays in force for them"
}
```

The refused token(s) fall back per the precedence rule — the deployment's value, else the default — and
every accepted sibling in the same payload still applies. Nothing is thrown and the session is untouched.
A well-formed `logoUrl` that then **fails to load** is a different case: the app quietly shows the built-in
mark instead, with no `cti.error`.

### `setTheme()` mid-session

`bc.app.setTheme({ … })` **merges**: the SDK overlays the tokens you pass onto the theme currently in effect
and posts the whole merged set, so `setTheme({ mode: "dark" })` changes the mode and leaves your logo and
colours in place. Pass `null` for a token to drop it back to the deployment's value
(`setTheme({ logoUrl: null })`); leave a token out to keep it as it is.

**What changes, in place and without a reload:** the tab title, the logo on the sign-in screen and in the
header, every colour role, the corner radius and the light/dark mode — including a screen that is already
open under an active call.

**What does not change:** the agent's session and state stream (no reconnect), an active call and its
audio, the token handoff (no second `ready` / `agent.loaded`), the agent's own stored light/dark preference
(your `mode` overrides it while set and it comes back when you clear it), the deployment's help link, and
the iframe element itself — its size, border and placement stay yours (see `bc.element` and the `resized`
event).

### Persistence and reloads

The app **persists nothing** about the theme. The SDK keeps the merged current theme — whatever `mount()`
was given, updated by every `setTheme()` — and re-sends it on every `ready`, the same way it re-sends the
bearer token. So:

- an **iframe reload** (the app boots again inside the same `BabelconnectEmbed` instance) keeps your
  branding, with nothing to do on your side;
- a **host page reload** starts over: pass `theme` to `mount()` again, or call `setTheme()` after mounting;
- a host that **stops sending** a theme gets the deployment's brand back on the next load — nothing lingers.

If you drive the bridge with raw `postMessage` instead of the SDK, re-post the full token set after
**every** `ready` yourself:

```text
host → app:  { type: "connect", module: "app", name: "app.setTheme",
               args: { brandName?, logoUrl?, accentColor?, mode?, primaryColor?, surfaceColor?, cornerRadius? } }
```

## 4. React to the app (app → host)

```ts
bc.on("cti.call", ({ call }) => crm.logCall(call));        // {id,state,type,from,to} on every transition
bc.on("cti.error", ({ code, message }) => toast(message)); // recoverable problems (e.g. missing display-as, a refused theme token)
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

`on()` returns an unsubscribe function. `bc.element` is the injected `<iframe>` (reach for it to style or
resize it), and `bc.dispose()` removes it and stops listening — tearing down the embedded app and releasing
its microphone, so call it when your component unmounts.

:::note Which events fire depends on the app
The SDK relays whatever the embedded app posts, so the **forwarded** events above
(`cti.error` / `cti.message` / `cti.iframe` / `cti.outbound.lead`) only arrive if the deployed agent-app
version emits them. The lifecycle events `agent.loaded` / `user.loaded` always fire on ready, and `cti.call`
is gated by `config.cti.emitCallEvents` — don't assume the rest are present without confirming against your
deployment.
:::

The `cti.call` payload is `{ call: { id, state, type, from, to } }`, emitted once per state **transition** —
`state` is the lifecycle lowercased (`ringing`, `in_progress`, `bridged`, `completed`, `failed`) and `type` is
`inbound` / `outbound`. It's gated by the deployment's **`config.cti.emitCallEvents`** — a deployment can turn
host call-event emission off, so don't assume it always fires. (`agent.loaded` / `user.loaded` always fire on
ready.)

## Reference

- Host-side API: [`BabelconnectEmbed`](./api/embed/classes/BabelconnectEmbed),
  [`EmbedOptions`](./api/embed/interfaces/EmbedOptions) and the [`EmbedTheme`](./api/embed/interfaces/EmbedTheme)
  token set.
- The data shapes carried on these events are the `babelconnect.v1` types — see the
  [gRPC / proto contract](../protocol/grpc) and the [REST / OpenAPI reference](pathname:///reference/rest/).
