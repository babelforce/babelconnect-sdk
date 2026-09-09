# Class: BabelconnectEmbed

A mounted embed. Use the verb groups ([auth](BabelconnectEmbed.md#auth), [calls](BabelconnectEmbed.md#calls),
[session](BabelconnectEmbed.md#session), [context](BabelconnectEmbed.md#context), [app](BabelconnectEmbed.md#app)) to drive the app, and
[on](BabelconnectEmbed.md#on) to receive app→host events (`agent.loaded`, `cti.call`,
`cti.error`, …).

## Properties

### app

```ts
readonly app: {
  setTab: (tab) => void;
};
```

Route the agent to a tab: `phone` | `chat` | `history` | `outbound`.

#### setTab()

```ts
setTab: (tab) => void;
```

##### Parameters

###### tab

`string`

##### Returns

`void`

***

### auth

```ts
readonly auth: {
  set: (args) => void;
};
```

Refresh the bearer token (and optionally session/context) mid-session —
e.g. ahead of expiry on a long shift. Posts `auth.set` immediately; the
live app applies it in place without interrupting the session or any
active call. Also remembers the values as *current*, so if the
iframe later reloads and re-emits `ready`, the handshake hands off this
refreshed token rather than the one passed to [BabelconnectEmbed.mount](BabelconnectEmbed.md#mount).

#### set()

```ts
set: (args) => void;
```

##### Parameters

###### args

[`AuthSetArgs`](../interfaces/AuthSetArgs.md)

##### Returns

`void`

***

### calls

```ts
readonly calls: {
  dial: (number, dial) => void;
};
```

Click-to-dial: place a call (or `dial=false` to only pre-fill the dialer).

#### dial()

```ts
dial: (number, dial) => void;
```

##### Parameters

###### number

`string`

###### dial

`boolean` = `true`

##### Returns

`void`

***

### context

```ts
readonly context: {
  set: (args) => void;
};
```

Merge into the persisted shared context carried onto subsequent calls/SMS.

#### set()

```ts
set: (args) => void;
```

##### Parameters

###### args

`Record`\<`string`, `unknown`\>

##### Returns

`void`

***

### session

```ts
readonly session: {
  set: (args) => void;
};
```

Attach session correlation; a `number` pre-fills a new SMS.

#### set()

```ts
set: (args) => void;
```

##### Parameters

###### args

`Record`\<`string`, `unknown`\>

##### Returns

`void`

## Accessors

### element

#### Get Signature

```ts
get element(): HTMLIFrameElement
```

The underlying iframe (e.g. to adjust sizing).

##### Returns

`HTMLIFrameElement`

## Methods

### dispose()

```ts
dispose(): void
```

Remove the iframe and stop listening.

#### Returns

`void`

***

### on()

```ts
on(name, fn): () => void
```

Subscribe to an app→host event. Returns an unsubscribe fn.

#### Parameters

##### name

`string`

##### fn

[`EmbedEventHandler`](../type-aliases/EmbedEventHandler.md)

#### Returns

`Function`

##### Returns

`void`

***

### mount()

```ts
static mount(opts): BabelconnectEmbed
```

Mount the embed: inject the iframe and start the bridge.

#### Parameters

##### opts

[`EmbedOptions`](../interfaces/EmbedOptions.md)

#### Returns

[`BabelconnectEmbed`](BabelconnectEmbed.md)
