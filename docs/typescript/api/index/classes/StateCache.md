# Class: StateCache

The client-side mirror of the server-authoritative `AgentView`.

It applies `StateUpdate` snapshots and entity-level patches **mechanically** —
there is no domain logic here, by design: the server reduces, the client
renders. This is the TypeScript twin of the Go (`bcclient.StateCache`) and Dart
(`StateCache`) reducers and is meant to be identical (and trivial) across the
SDKs so they cannot drift.

## Constructors

### new StateCache()

```ts
new StateCache(): StateCache
```

#### Returns

[`StateCache`](StateCache.md)

## Accessors

### current

#### Get Signature

```ts
get current(): AgentView
```

The current view (a deep copy, safe to hold/read).

##### Returns

`AgentView`

## Methods

### apply()

```ts
apply(u): boolean
```

Fold one snapshot or patch into the view and notify listeners. Returns `true`
if a seq gap was detected (a patch whose seq is not exactly the previous
seq + 1) — the caller should resubscribe for a fresh snapshot. Error updates
are handled by the client, not here.

#### Parameters

##### u

`StateUpdate`

#### Returns

`boolean`

***

### subscribe()

```ts
subscribe(fn): () => void
```

Register a render callback, invoked immediately and on every update. Returns an unsubscribe fn.

#### Parameters

##### fn

(`v`) => `void`

#### Returns

`Function`

##### Returns

`void`
