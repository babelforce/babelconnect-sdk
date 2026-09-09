# Function: pkceChallenge()

```ts
function pkceChallenge(): Promise<PkceChallenge>
```

Generate a PKCE code verifier + S256 challenge (RFC 7636). Pass `codeChallenge` to
[buildAuthorizeUrl](buildAuthorizeUrl.md) and keep `codeVerifier` to later exchange the returned code via
[authorizationCodeGrant](authorizationCodeGrant.md). Uses the Web Crypto API (Node 18+ / browsers).

## Returns

`Promise`\<[`PkceChallenge`](../interfaces/PkceChallenge.md)\>
