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
so a `calls.dial` sent before the app has loaded and connected is dropped.

| Call | Effect |
|---|---|
| `bc.calls.dial(number, dial = true)` | place a call (or `dial=false` to only pre-fill the dialer) with the agent's display-as + your `session` |
| `bc.session.set({ number?, smsBody?, … })` | attach session correlation; a `number` pre-fills a new SMS (`to` + `smsBody`/`body`) and switches to the messaging tab |
| `bc.context.set({ … })` | merge into the persisted shared context carried onto subsequent calls/SMS |
| `bc.app.setTab("phone" \| "messaging" \| "phonebook" \| "history" \| "account" \| "outbound")` | switch the active tab (`"chat"`→`"messaging"` and `"contacts"`→`"phonebook"` are accepted as aliases; an unknown name is ignored, and a tab the deployment has disabled falls back to the first visible tab) |

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

## 4. React to the app (app → host)

```ts
bc.on("cti.call", ({ call }) => crm.logCall(call));        // {id,state,type,from,to} on every transition
bc.on("cti.error", ({ code, message }) => toast(message)); // recoverable problems (e.g. missing display-as)
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

- Host-side API: [`BabelconnectEmbed`](./api/embed/classes/BabelconnectEmbed) and
  [`EmbedOptions`](./api/embed/interfaces/EmbedOptions).
- The data shapes carried on these events are the `babelconnect.v1` types — see the
  [gRPC / proto contract](../protocol/grpc) and the [REST / OpenAPI reference](pathname:///reference/rest/).
