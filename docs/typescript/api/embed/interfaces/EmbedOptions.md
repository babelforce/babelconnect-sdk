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
