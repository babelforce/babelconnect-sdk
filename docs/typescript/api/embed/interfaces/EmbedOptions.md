# Interface: EmbedOptions

Options for [BabelconnectEmbed.mount](../classes/BabelconnectEmbed.md#mount).

## Properties

### className?

```ts
optional className: string;
```

Optional className for the iframe.

***

### container

```ts
container: HTMLElement;
```

Element the iframe is appended to.

***

### context?

```ts
optional context: Record<string, unknown>;
```

Optional initial shared context (also settable later via [context](EmbedOptions.md#context)).

***

### eventsVersion?

```ts
optional eventsVersion: string;
```

The `agent.loaded`/`user.loaded` event-payload schema version.
Omit for the current app default (`"v3"`): `agent.loaded` carries
`{agentId}` and `user.loaded` has no payload. The legacy adapter
normalizes both to `{agentId}`. Pass `"v1"` to opt into the
legacy shape used by the previous embedded phone widget
(`agent.loaded` → `{agentId, agent:{id,name,email,number}}`,
`user.loaded` → `{agentId, user:{email}}`) for a host still matching
CRM users by email or routing by number. See the Embedding guide,
"Loaded event schema version".

***

### instanceId?

```ts
optional instanceId: string;
```

This mount's identity, echoed by the app on **every** app→host envelope
(`{type:"bcConnect", name, data, instanceId}`) and reported as
[BabelconnectEmbed.instanceId](../classes/BabelconnectEmbed.md#instanceid). Omit it and one is generated per
mount. Supply your own when you want the id to mean something in your own
system (a CRM tab id, a workspace id) — it is correlation only and grants
nothing; trust still rests on the origin allowlist and the token.

This is what lets a host with the app open in several browser tabs tell
WHICH tab holds a live call — see "Multiple tabs and multiple embeds" in
the Embedding guide, and `cti.call`'s `ownsMedia` / the
`call.media_owner` event. Max 128 characters; a longer one is ignored by
the app in favour of a generated id.

***

### legacyAuth?

```ts
optional legacyAuth: LegacyAuth;
```

Required in legacy mode; the host supplies the legacy app's credential handoff.

***

### legacyBridge?

```ts
optional legacyBridge: true | LegacyBridge;
```

Set to `true` to use the bundled legacy iframe bridge, or inject a
lifecycle-capable bridge. The v2 facade delegates host commands and
app events to this bridge instead of using the modern postMessage client.
Requires [legacyAuth](EmbedOptions.md#legacyauth); point [serverUrl](EmbedOptions.md#serverurl) and [path](EmbedOptions.md#path) at
the legacy app. Omit to use the current app protocol.

***

### path?

```ts
optional path: string;
```

Path within the app (default `/`).

***

### serverUrl

```ts
serverUrl: string;
```

App origin (the iframe `src` + the only origin the legacy bridge exchanges messages with).

***

### session?

```ts
optional session: Record<string, unknown>;
```

Optional initial session correlation (also settable later via [session](EmbedOptions.md#session)).

***

### theme?

```ts
optional theme: EmbedTheme;
```

Optional brand tokens for the embedded app — your colours, your name,
your logo (also settable later via [BabelconnectEmbed.app](../classes/BabelconnectEmbed.md#app)'s `setTheme`).
See [EmbedTheme](EmbedTheme.md). Legacy mode rejects this option with
[UnsupportedEmbedFeatureError](../classes/UnsupportedEmbedFeatureError.md).

***

### token

```ts
token: string;
```

Bearer token, handed to the app via the active bridge after readiness (never in the URL).
