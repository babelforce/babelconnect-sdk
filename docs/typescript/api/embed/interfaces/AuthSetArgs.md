# Interface: AuthSetArgs

Args for [BabelconnectEmbed.auth](../classes/BabelconnectEmbed.md#auth)'s `set`.

## Properties

### context?

```ts
optional context: Record<string, unknown>;
```

Updated shared context. Omit to leave the currently-tracked value unchanged.

***

### eventsVersion?

```ts
optional eventsVersion: string;
```

Updated events-schema version (see [EmbedOptions.eventsVersion](EmbedOptions.md#eventsversion)). Only takes
effect on the NEXT `ready` handshake (an iframe reload) — a live session's already-emitted
`agent.loaded`/`user.loaded` don't refire. Omit to leave the currently-tracked value unchanged.

***

### session?

```ts
optional session: Record<string, unknown>;
```

Updated session correlation. Omit to leave the currently-tracked value unchanged.

***

### token

```ts
token: string;
```

New bearer token.
