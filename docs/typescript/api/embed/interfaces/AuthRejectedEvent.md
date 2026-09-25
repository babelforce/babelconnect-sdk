# Interface: AuthRejectedEvent

The `auth.rejected` payload: the embedded session's bearer token was not
accepted and the app has signed the agent out. `code` is `unauthenticated`
(the token was refused) or `not_an_agent` (the token is valid but its user
holds no agent role — signing in again as the same user does not help);
`message` is the app's own sentence. Raised at most once per session, after
the `cti.error` that carries the same code. Obtain a fresh token for the
agent, then remount the widget with it ([BabelconnectEmbed.dispose](../classes/BabelconnectEmbed.md#dispose),
then a new [BabelconnectEmbed.mount](../classes/BabelconnectEmbed.md#mount)): the app is still finishing its
sign-out, and a token handed to it meanwhile is lost.

## Properties

### code

```ts
code: "unauthenticated" | "not_an_agent";
```

***

### message

```ts
message: string;
```
