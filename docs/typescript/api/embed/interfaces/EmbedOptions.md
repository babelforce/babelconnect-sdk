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
Omit for the app's current default (`"v3"` — just the top-level
`agentId`, no legacy struct nesting). Pass `"v1"` to opt into the
legacy shape used by the previous embedded phone widget
(`agent.loaded` → `{agentId, agent:{id,name,email,number}}`,
`user.loaded` → `{agentId, user:{email}}`) for a host still matching
CRM users by email or routing by number. See the Embedding guide,
"Loaded event schema version".

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
