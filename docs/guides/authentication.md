---
title: Authentication
sidebar_label: Authentication
sidebar_position: 1
description: Choose a login flow, supply a bearer token, refresh it, and sign out.
---

# Authentication

Supply an OAuth bearer token to the SDK; it attaches `Authorization: Bearer …` to every request.
The token identifies one agent. Login and token renewal belong to your application.

## Choosing a flow

| Flow | Use | Default client ID |
|---|---|---|
| [Authorization Code + PKCE](#authorization-code--pkce) | Interactive apps | `babelconnect`, no client secret |
| [Password grant](#get-a-token) | First-party scripts and local development | `manager` |
| [SSO](#sso) | Tenants with a configured identity provider | Deployment-specific |
| Existing bearer | Host application already authenticated the agent | No further exchange |

## Get a token

The password grant posts form data to the server's `/oauth/token` endpoint:

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=AGENT&password=SECRET&client_id=manager
```

Use `passwordGrant({ serverUrl, user, pass })` in TypeScript or
`bcclient.PasswordGrant(ctx, serverURL, user, pass)` in Go. Both return only the access-token string;
TypeScript allows a `clientId` override, while Go fixes it to `manager`. Handle a thrown exception
(TS) or returned error (Go) for a failed grant or network request.

## Connect with the token

Use `BabelconnectClient.connect({ serverUrl, token })` or
`bcclient.Dial(ctx, bcclient.Options{Addr: addr, Token: token})`.
Go's current `Addr` uses [plain HTTP](../go/getting-started); it is not an HTTPS URL.
For REST, attach the header yourself:

```http
GET /v1/agent/state
Authorization: Bearer <token>
```

REST covers unary operations; live state uses `Subscribe`. See [API surfaces](../protocol/overview).

## Authorization Code + PKCE

Ask the operator for the **OAuth consent origin**, an allowed callback URL, and the required scope.
The agent server proxies `POST /oauth/token`, but does **not** serve `GET /oauth/authorize`.
`buildAuthorizeUrl` only constructs a URL: its `serverUrl` must point to the consent origin, even
though that parameter shares its name with the API origin. In Go the parameter is `OAuthBase`.

1. Generate a fresh verifier/challenge with `pkceChallenge()` (TS) or `GeneratePKCE()` (Go).
2. Generate an unpredictable `state`, keep it and the verifier across the redirect, and navigate to
   `buildAuthorizeUrl` / `PkceAuthorizeURL`. Use the registered `redirectUri`, challenge and scope.
3. At the callback, reject a missing/mismatched `state` or a login error. Exchange `code` with the
   **same verifier and redirect URI**; remove the one-time stored values.
4. Connect with the returned access token.

This TypeScript fragment shows the SDK calls; your login routes own navigation, one-time storage,
and validation of `returnedCode` and `returnedState`:

```ts
import { pkceChallenge, buildAuthorizeUrl, authorizationCodeGrant } from "@babelforce/babelconnect-sdk";

const { codeVerifier, codeChallenge } = await pkceChallenge();
const state = crypto.randomUUID();
const redirectUri = "https://app.example.com/oauth/callback";
const consentUrl = buildAuthorizeUrl({
  serverUrl: "https://login.example.com", redirectUri, scope: "*", codeChallenge, state,
});
// Save { codeVerifier, state } for this login, then navigate to consentUrl.
// In the callback, load them and validate before exchanging:
if (returnedState !== state) throw new Error("Login state mismatch");
const tokens = await authorizationCodeGrant({
  serverUrl: "https://agent.example.com", code: returnedCode, redirectUri, codeVerifier,
});
// Connect with tokens.access_token; retain lifetime fields for renewal.
```

Go uses `PkceAuthorizeURL(bcclient.AuthorizeURLParams{OAuthBase, RedirectURI, Scope,
CodeChallenge, State})`, then `AuthorizationCodeGrant(ctx, tokenOrigin, code, redirectURI, verifier)`.
Handle errors from both verifier generation and token exchange. Unlike TypeScript, Go returns
**only the access token**, not refresh/lifetime fields. Both default the public client ID to
`babelconnect`; Go's `AuthorizationCodeGrantClient` also accepts an explicit client and HTTP client.

A `redirect_uri_mismatch` means the callback is not registered for that OAuth client.
Keep verifiers short-lived. Send the verifier only in the token-exchange body, never in redirect URLs.

## Don't ship credentials to the browser

Interactive apps should redirect to the configured login with PKCE or obtain a short-lived token
from their own backend. Keep account passwords and client secrets out of application bundles.
Keep tokens out of logs and URLs. An [embedding host](../typescript/embedding) hands the token to
the app through `postMessage`.

## SSO

The server accepts `POST /auth/sso/init/{tenant}/babelconnect` to begin configured tenant login and
`POST /auth/sso/{tenant}` to exchange the returned IdP code. These are auth proxy routes, not part
of the generated Agent OpenAPI reference. Obtain the tenant's request/response contract from the
operator; once you have a token, SDK connection is the same.

## Token lifetime

Neither standalone TypeScript nor Go refreshes tokens automatically. Track expiry in your login
layer and replace the client with a fresh token when necessary; see
[Errors & reconnects](./errors-and-reconnects) for the audio consequences.

| Helper | Returned lifetime information |
|---|---|
| TS `passwordGrant`, Go `PasswordGrant` | Access token only |
| TS `authorizationCodeGrant` | Full response: access token, optional `expires_in`, optional `refresh_token` |
| Go `AuthorizationCodeGrant` | Access token only |

Read the full `/oauth/token` response yourself if the helper omits fields you need. When the
issuer grants rotating refresh tokens, retain the newest token after each exchange; a used token
cannot be reused. An authentication failure on reconnect may mean expiry or revocation, not a
network outage. Request a new login rather than retrying rejected credentials indefinitely.

The embedded app has a separate [in-place token handoff](../typescript/embedding#2-token-handoff-security).

## Logout

Closing a client releases its stream and media; it does **not** revoke its token.
TypeScript provides `revokeToken({ serverUrl, token })`; Go provides
`bcclient.RevokeToken(ctx, oauthBase, token)` and the configurable `RevokeTokenClient`.
Both post to `/oauth/revoke`, with the token in the form body and bearer header. The token-type
hint defaults to `access_token` (Go also sends a client ID, default `babelconnect`).

Revocation is best-effort: helpers accept non-2xx responses and only report transport/request
errors. An unknown token may also return 200; success is not proof it was active.
Close the client first, then revoke: a command still in flight when the revoke lands is refused as
`unauthenticated`, and a client you have already closed does not report that as a session end.
Revocation failing must not stop the sign-out:

```ts
await bc.close();
try { await revokeToken({ serverUrl, token }); } catch { /* best-effort */ }
```

## Security checklist

- Serve browser apps and APIs over HTTPS; allow microphone access only where needed.
- Allow only the intended CORS origins. The empty allowlist is permissive.
- Register exact OAuth callback URLs and validate one-time `state` values.
- Keep tokens and refresh credentials out of logs, URLs, and source; revoke on logout.
- For embeds, configure framing, message origins and microphone delegation separately; see
  [Embedding](../typescript/embedding#2-token-handoff-security).
- The current Go client constructs a plain HTTP URL. Use it only behind a trusted local tunnel
  or in an explicitly trusted network; it cannot directly target a production HTTPS origin.
