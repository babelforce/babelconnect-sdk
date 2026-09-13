# Class: UnsupportedEmbedFeatureError

The selected legacy runtime cannot perform the requested embed operation.

## Extends

- `Error`

## Constructors

### new UnsupportedEmbedFeatureError()

```ts
new UnsupportedEmbedFeatureError(feature): UnsupportedEmbedFeatureError
```

#### Parameters

##### feature

`string`

#### Returns

[`UnsupportedEmbedFeatureError`](UnsupportedEmbedFeatureError.md)

#### Overrides

```ts
Error.constructor
```

## Properties

### feature

```ts
readonly feature: string;
```

The unavailable operation.
