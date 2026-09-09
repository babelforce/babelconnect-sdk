# Interface: PkceChallenge

A PKCE code verifier + S256 challenge (RFC 7636).

## Properties

### codeChallenge

```ts
codeChallenge: string;
```

The base64url(SHA-256(codeVerifier)) value to send with [buildAuthorizeUrl](../functions/buildAuthorizeUrl.md).

***

### codeChallengeMethod

```ts
codeChallengeMethod: "S256";
```

***

### codeVerifier

```ts
codeVerifier: string;
```

The high-entropy secret to keep client-side and send with [authorizationCodeGrant](../functions/authorizationCodeGrant.md).
