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

OAuth consent origin serving `/oauth/authorize`; this can differ from the agent API origin, which does not proxy that GET endpoint.

***

### state?

```ts
optional state: string;
```

Opaque CSRF token echoed back by the backend; verify it on return.
