# Function: authorizationCodeGrant()

```ts
function authorizationCodeGrant(opts): Promise<TokenResponse>
```

Exchange an authorization `code` (from the PKCE consent redirect) for tokens via the
authorization_code grant against `POST {serverUrl}/oauth/token`. Public clients pass only
`codeVerifier` (no secret). Returns the access token (and a rotating refresh token when the
backend grants offline access) — pass `access_token` to [BabelconnectClient.connect](../classes/BabelconnectClient.md#connect).

## Parameters

### opts

#### clientId

`string`

#### clientSecret

`string`

#### code

`string`

#### codeVerifier

`string`

#### redirectUri

`string`

#### serverUrl

`string`

## Returns

`Promise`\<[`TokenResponse`](../interfaces/TokenResponse.md)\>
