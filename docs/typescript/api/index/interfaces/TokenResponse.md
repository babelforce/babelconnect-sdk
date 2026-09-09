# Interface: TokenResponse

A parsed OAuth token response: the bearer plus, when the grant returns them, the rotating refresh token and the access-token lifetime (seconds).

## Properties

### access\_token

```ts
access_token: string;
```

***

### expires\_in?

```ts
optional expires_in: number;
```

***

### refresh\_token?

```ts
optional refresh_token: string;
```

***

### token\_type?

```ts
optional token_type: string;
```
