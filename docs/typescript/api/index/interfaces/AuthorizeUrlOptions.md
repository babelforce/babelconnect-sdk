# Interface: AuthorizeUrlOptions

## Properties

### clientId?

```ts
optional clientId: string;
```

OAuth client id (defaults to [DEFAULT\_CLIENT\_ID](../variables/DEFAULT_CLIENT_ID.md) = `"babelconnect"`).

***

### codeChallenge

```ts
codeChallenge: string;
```

***

### codeChallengeMethod?

```ts
optional codeChallengeMethod: "S256" | "plain";
```

***

### redirectUri

```ts
redirectUri: string;
```

The registered callback URL the backend redirects to with the code.

***

### scope

```ts
scope: string;
```

OAuth scope (e.g. `"*"`).

***

### serverUrl

```ts
serverUrl: string;
```

babelconnect-server origin (the same one used for gRPC-web); the authorize endpoint lives on the backend behind the same origin.

***

### state?

```ts
optional state: string;
```

Opaque CSRF token echoed back by the backend; verify it on return.
