# Function: revokeToken()

```ts
function revokeToken(opts): Promise<void>
```

Revoke an OAuth token on sign-out (RFC 7009) via babelconnect-server's
`POST {serverUrl}/oauth/revoke` (proxied same-origin like `/oauth/token`).

Form-urlencoded `token` (+ `token_type_hint` and optional `clientId`); the
bearer is also carried for backends that authenticate the revoke. Best-effort:
revocation returns 200 even for an unknown token, so a non-2xx is ignored (the
session is ending regardless) — only a transport error rejects.

## Parameters

### opts

#### clientId

`string`

optional OAuth client id

#### serverUrl

`string`

babelconnect-server origin, e.g. `https://agent.example.com`

#### token

`string`

the token to revoke (also sent as the bearer)

#### tokenTypeHint

`string`

RFC 7009 hint (defaults to `"access_token"`)

## Returns

`Promise`\<`void`\>
