# Class: MediaError

Thrown by a [Media](../interfaces/Media.md) implementation when it cannot start audio for a
call — e.g. the microphone is missing, permission was denied, or the device
is held by another app (CALL-M5). [code](MediaError.md#code-1) is a stable classification the
SDK surfaces on `onError` (and hosts receive as `cti.error`) so the UI can
show cause-specific help instead of a raw WebRTC string.

## Extends

- `Error`

## Constructors

### new MediaError()

```ts
new MediaError(code, message): MediaError
```

#### Parameters

##### code

`string`

##### message

`string`

#### Returns

[`MediaError`](MediaError.md)

#### Overrides

```ts
Error.constructor
```

## Properties

### code

```ts
readonly code: string;
```
