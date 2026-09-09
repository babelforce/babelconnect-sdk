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

babelconnect-server origin (the iframe `src` + the only origin messages are exchanged with).

***

### session?

```ts
optional session: Record<string, unknown>;
```

Optional initial session correlation (also settable later via [session](EmbedOptions.md#session)).

***

### token

```ts
token: string;
```

Bearer token, handed to the app via `postMessage` after its `ready` event (never in the URL).
