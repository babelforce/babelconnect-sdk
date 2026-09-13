# Interface: LegacyConnection

A legacy iframe connection with explicit subscription and connection teardown.

## Methods

### dial()

```ts
dial(args): void | Promise<void>
```

Place a call or pre-fill the dialer.

#### Parameters

##### args

[`LegacyDialArgs`](LegacyDialArgs.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### disconnect()

```ts
disconnect(): void
```

Remove all listeners owned by the connection.

#### Returns

`void`

***

### on()

```ts
on(name, handler): () => void
```

Observe an event; the returned function removes the subscription.

#### Parameters

##### name

`string`

##### handler

[`EmbedEventHandler`](../type-aliases/EmbedEventHandler.md)

#### Returns

`Function`

##### Returns

`void`

***

### setContext()

```ts
setContext(args): void | Promise<void>
```

Merge shared context for subsequent calls and messages.

#### Parameters

##### args

`Record`\<`string`, `unknown`\>

#### Returns

`void` \| `Promise`\<`void`\>

***

### setSession()

```ts
setSession(args): void | Promise<void>
```

Replace the current session correlation.

#### Parameters

##### args

`Record`\<`string`, `unknown`\>

#### Returns

`void` \| `Promise`\<`void`\>

***

### setTab()

```ts
setTab(tab): void | Promise<void>
```

Select a tab by its legacy numeric index.

#### Parameters

##### tab

`number`

#### Returns

`void` \| `Promise`\<`void`\>
