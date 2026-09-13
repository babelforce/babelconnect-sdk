# Interface: LegacyAuth

Host-owned credential handoff for the legacy app. Called on iframe load and
`auth.set`, with the current token and correlation values. The SDK supplies
no default legacy authentication mechanism. A thrown error or rejected
promise emits `cti.error` with `code: "legacy_auth_failed"`.

## Methods

### set()

```ts
set(args): void | Promise<void>
```

#### Parameters

##### args

[`AuthSetArgs`](AuthSetArgs.md)

#### Returns

`void` \| `Promise`\<`void`\>
