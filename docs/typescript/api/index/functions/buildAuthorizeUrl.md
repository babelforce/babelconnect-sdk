# Function: buildAuthorizeUrl()

```ts
function buildAuthorizeUrl(opts): string
```

Build the `GET {serverUrl}/oauth/authorize` URL that starts the Authorization Code + PKCE flow.
Redirect the user to it; the backend redirects back to `redirectUri` with a `code` (and `state`).

## Parameters

### opts

[`AuthorizeUrlOptions`](../interfaces/AuthorizeUrlOptions.md)

## Returns

`string`
