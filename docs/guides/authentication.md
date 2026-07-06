---
title: Authentication
sidebar_label: Authentication
sidebar_position: 1
description: Obtain an OAuth2 bearer token and connect the SDK to babelconnect-server — password grant, Authorization Code + PKCE, or SSO.
---

# Authentication

Every SDK connects to babelconnect-server with an **OAuth2 bearer token**. The token is obtained once and then
attached to every call — as gRPC metadata for the streaming/native clients, or as the `Authorization` header
on the REST endpoints. The two halves are the same on all SDKs:

1. **Get a token** from `POST /oauth/token` (or the SSO flow).
2. **Connect** with that token; the SDK sends `authorization: Bearer <token>` on your behalf.

## Choosing a flow

| Flow | Use it for | Client secret | Where |
|------|-----------|---------------|-------|
| [Password grant](#get-a-token) | First-party scripts / quick dev | No | [TS](#get-a-token) · [Go](#get-a-token) · [curl](#connect-with-the-token) |
| [Authorization Code + PKCE](#authorization-code--pkce) | Interactive apps acting **as a user** — SPAs, the Flutter/web app, mobile/desktop | No | [TS](#authorization-code--pkce) · [Go](#authorization-code--pkce) · [curl](#authorization-code--pkce) |
| [SSO](#sso) | Tenants with a configured identity provider | No | [REST](#sso) |
| [Bearer token](#connect-with-the-token) | A token you already hold (from any flow above) | — | all |

If your software acts on behalf of a human who logs in, prefer **Authorization Code + PKCE** — it's the modern,
secure flow for public clients (RFC 7636) and never ships a password or a secret to the browser. The
**password grant** is kept for first-party/dev convenience. **SSO** replaces either flow where a tenant has
configured single sign-on.

## Get a token

The default flow is the OAuth2 **resource-owner password grant**, served on the same origin as the API:

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=AGENT&password=SECRET&client_id=manager
```

The response is JSON with an `access_token`. Each SDK ships a one-line helper so you don't hand-roll this:

```ts
// TypeScript
import { passwordGrant } from "@babelforce/babelconnect-sdk";

const token = await passwordGrant({ serverUrl, user, pass }); // client_id defaults to "manager"
```

```go
// Go
token, err := bcclient.PasswordGrant(ctx, serverURL, user, pass) // client_id is fixed at "manager"
```

On a failed grant (bad credentials, network error), the TypeScript helper **throws** and the Go helper
**returns an error** — handle it at the call site.

## Connect with the token

Pass the token to the client; the SDK attaches it to the control stream and every request:

```ts
// TypeScript
const bc = BabelconnectClient.connect({ serverUrl, token });
```

```go
// Go
client, err := bcclient.Dial(ctx, bcclient.Options{Addr: addr, Token: token})
```

For the REST endpoints (curl / other languages), send it yourself:

```http
GET /v1/agent/state
Authorization: Bearer <token>
```

The whole flow from a shell — grant a token, then call an endpoint with it:

```bash
TOKEN=$(curl -s https://agent.example.com/oauth/token \
  -d grant_type=password -d username=AGENT -d password=SECRET -d client_id=manager \
  | jq -r .access_token)

curl -s https://agent.example.com/v1/agent/state -H "Authorization: Bearer $TOKEN"
```

The [REST / OpenAPI reference](pathname:///reference/rest/) lists every endpoint; remember it covers only the
**unary** operations — the live state stream is gRPC(-web) only.

## Authorization Code + PKCE

The modern, secure flow for public clients (RFC 7636) — no client secret is ever stored. The agent
authenticates with babelforce and approves your app; you then exchange the returned `code` (bound to a
one-time PKCE verifier) for an access token (and a rotating refresh token). The babelconnect public client is
`client_id="babelconnect"` (no secret).

The three steps:

1. Generate a PKCE verifier/challenge and send the agent to the consent page.
2. The backend redirects back to your `redirect_uri` with `?code=…&state=…`.
3. Exchange the code (with the **same** verifier) for tokens.

```ts
// TypeScript
import {
  pkceChallenge,
  buildAuthorizeUrl,
  authorizationCodeGrant,
  BabelconnectClient,
} from "@babelforce/babelconnect-sdk";

// 1. Generate a PKCE verifier/challenge and send the user to the consent page.
const { codeVerifier, codeChallenge } = await pkceChallenge();
const consentUrl = buildAuthorizeUrl({
  serverUrl: "https://agent.example.com",
  redirectUri: "https://app.example.com/oauth/callback",
  scope: "*",
  codeChallenge,
  state: "csrf-token", // verify it on return
});
// Redirect the user to `consentUrl`; they return to redirectUri?code=…&state=…

// 2. (Your /oauth/callback handler receives the code+state.)

// 3. Exchange the code (with the same codeVerifier) for tokens.
const tokens = await authorizationCodeGrant({
  serverUrl: "https://agent.example.com",
  code: "code-from-the-redirect",
  redirectUri: "https://app.example.com/oauth/callback",
  codeVerifier,
  // clientId defaults to "babelconnect"; omit it for the agent app.
});

// 4. Connect.
const bc = BabelconnectClient.connect({ serverUrl, token: tokens.access_token });
```

```go
// Go
import (
	"context"
	"github.com/babelforce/babelconnect-sdk-go"
)

// 1. Generate a PKCE verifier/challenge and send the user to the consent page.
pkce, _ := bcclient.GeneratePKCE()
consentURL := bcclient.PkceAuthorizeURL(bcclient.AuthorizeURLParams{
	OAuthBase:     "https://agent.example.com",
	RedirectURI:   "https://app.example.com/oauth/callback",
	Scope:         "*",
	CodeChallenge: pkce.CodeChallenge,
	State:         "csrf-token",
})
_ = consentURL // redirect the user here; they return to RedirectURI?code=…&state=…

// 2. (Your /oauth/callback handler receives the code+state.)

// 3. Exchange the code (public client → empty secret) for tokens.
token, _ := bcclient.AuthorizationCodeGrant(ctx,
	"https://agent.example.com",
	"code-from-the-redirect",
	"https://app.example.com/oauth/callback",
	pkce.CodeVerifier,
)

// 4. Connect.
client, _ := bcclient.Dial(ctx, bcclient.Options{Addr: addr, Token: token})
```

From a shell (language-agnostic — the raw HTTP any client must do):

```bash
# 1. Generate a verifier + S256 challenge (any base64url(SHA-256) helper), then:
CONSENT_URL="https://agent.example.com/oauth/authorize?response_type=code&client_id=babelconnect&redirect_uri=https://app.example.com/oauth/callback&scope=*&code_challenge=$CHALLENGE&code_challenge_method=S256&state=csrf"
# → send the agent to $CONSENT_URL; on return, capture ?code=…&state=…

# 2. Exchange the code (with the same $VERIFIER) for tokens.
TOKEN=$(curl -s https://agent.example.com/oauth/token \
  -d grant_type=authorization_code \
  -d code=CODE-FROM-THE-REDIRECT \
  -d redirect_uri=https://app.example.com/oauth/callback \
  -d client_id=babelconnect \
  -d code_verifier=$VERIFIER \
  | jq -r .access_token)
```

:::note Register the redirect URI
PKCE requires the `redirect_uri` you pass to be **registered** on the backend's `babelconnect` OAuth client
(the callback URL your app serves, e.g. `https://app.example.com/oauth/callback`). A `redirect_uri_mismatch`
error means it isn't registered yet — ask for it to be allowlisted. Keep the `code_verifier` and the `state`
for the duration of the round-trip (in memory / a short-lived cookie), and verify `state` on return to guard
against CSRF.
:::

## Don't ship credentials to the browser

In production, a browser app should **never** hold an agent's username and password. Instead, exchange
credentials for a token **in your own backend** (where the secret stays), and hand only the short-lived token
to the front end:

```text
agent login (your app)  →  your backend exchanges creds for a token (POST /oauth/token)
                        →  backend returns the token to the browser
                        →  BabelconnectClient.connect({ serverUrl, token })
```

When **embedding** the prebuilt agent app, the host page passes the token over the `postMessage` bridge rather
than a URL — see **[Embedding](../typescript/embedding)**.

## SSO

Where single sign-on is configured, the password grant is replaced by an SSO exchange:
`POST /auth/sso/init/{tenant}/babelconnect` begins the login and returns the IdP redirect URL, then
`POST /auth/sso/{tenant}` exchanges the returned IdP code for the same kind of bearer token. See the
**[REST / OpenAPI reference](pathname:///reference/rest/)** for the request/response shapes; once you hold a
token, connecting is identical.

## Token lifetime

The token is opaque to the SDK and validated by babelconnect-server on every connection. When it expires,
fetch a new one and reconnect — the **[Errors & reconnects](./errors-and-reconnects)** guide shows the
production reconnect-with-backoff pattern, including re-auth on expiry.

- **Password grant:** the `passwordGrant` helper returns **only the `access_token` string** — it doesn't
  surface `expires_in` or a refresh token. That's fine for the reactive pattern above (re-auth when a
  connection is rejected). If you'd rather refresh **proactively** — before the token lapses — call
  `POST /oauth/token` yourself and read the full JSON response for the lifetime fields.
- **Authorization Code + PKCE:** `authorizationCodeGrant` returns the **full** token response, including
  `expires_in` and (when the backend grants offline access) a rotating `refresh_token`. For a long-lived
  session, persist the refresh token and exchange it for a fresh access token before the old one lapses
  (refresh tokens are single-use and rotate on every exchange — always store the newest one).

Keep the token out of logs and URLs, and treat it like a password.

## Logout

To **revoke** a token before it expires — when the agent signs out — `POST /oauth/revoke` with the bearer
token (RFC 7009); the server invalidates the session. The endpoint is proxied same-origin like `/oauth/token`,
so the browser app can call it without a cross-origin hop. Closing the SDK client (`bc.close()` / `cli.Close()`)
tears down the stream and media leg but does **not** revoke the token, so call revoke as well if you want the
token to stop working immediately.

The TypeScript and Dart SDKs ship a `revokeToken` helper so you don't hand-roll the request:

```ts
// TypeScript
import { revokeToken } from "@babelforce/babelconnect-sdk";

await revokeToken({ serverUrl, token }); // tokenTypeHint defaults to "access_token"
bc.close();
```

The raw request, language-agnostic — `POST /oauth/revoke`, form-urlencoded:

```bash
curl -s https://agent.example.com/oauth/revoke \
  -H "Authorization: Bearer $TOKEN" \
  -d token=$TOKEN -d token_type_hint=access_token
```

The bearer is sent **both** in the form body (`token`, plus the RFC 7009 `token_type_hint`) **and** as the
`Authorization: Bearer` header — the latter for backends that authenticate the revoke request itself. Revocation
is **best-effort**: RFC 7009 returns `200` even for an unknown token, so the helpers swallow a non-2xx response
(only a transport error rejects). Logout must **not** hard-fail on revoke — the session is ending regardless.

:::note No Go `RevokeToken` helper
The revoke helper ships for **TypeScript and Dart only** — there is no Go `bcclient.RevokeToken`. Go callers
`POST {oauthBase}/oauth/revoke` directly:

```go
// Go — no helper; post the revoke request yourself.
form := url.Values{"token": {token}, "token_type_hint": {"access_token"}}
req, _ := http.NewRequestWithContext(ctx, http.MethodPost,
	oauthBase+"/oauth/revoke", strings.NewReader(form.Encode()))
req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
req.Header.Set("Authorization", "Bearer "+token)
resp, err := http.DefaultClient.Do(req)
if err != nil {
	// transport error — log it, but don't block sign-out
} else {
	resp.Body.Close() // best-effort: any status (even for an unknown token) is fine
}
cli.Close()
```
:::

## Security checklist

The security-relevant points, gathered from across these docs:

- **Never ship credentials to the browser** — exchange them for a token in your backend; hand the page only the short-lived token (above).
- **Treat the token like a password** — keep it out of logs and URLs; revoke it with logout on sign-out.
- **Encrypt the transport** — the bearer token rides every connection, so terminate **TLS** in front of the server (HTTPS for gRPC-web and REST; TLS for native gRPC). Never carry the token over a plaintext endpoint in production.
- **Serve over HTTPS** — a [secure context](../typescript/getting-started) is required for the microphone (`getUserMedia`).
- **Set the server's [CORS allowlist](../typescript/getting-started)** to your app's origin(s) (an empty allowlist allows all — dev only).
- **When [embedding](../typescript/embedding)**, pass the token over `postMessage` (never the iframe URL), and lock down CSP `frame-ancestors` + the CORS allowlist to your host origin(s).
