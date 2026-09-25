# Interface: ConnectOptions

Options for [BabelconnectClient.connect](../classes/BabelconnectClient.md#connect).

## Properties

### autoAnswer?

```ts
optional autoAnswer: boolean;
```

Auto-answer the agent's own OUTBOUND ringing leg (default `true`). INBOUND waits for [BabelconnectClient.answerCall](../classes/BabelconnectClient.md#answercall).

***

### mediaFactory?

```ts
optional mediaFactory: null | MediaFactory;
```

Per-call WebRTC leg. Defaults to [browserMediaFactory](../functions/browserMediaFactory.md); pass `null` for a control-only client.

***

### onError()?

```ts
optional onError: (err) => void;
```

Out-of-band server notices (command rejections) + local media failures. A rejected bearer is
reported here too, as code `unauthenticated`, once — immediately before
[ConnectOptions.onUnauthenticated](ConnectOptions.md#onunauthenticated).

#### Parameters

##### err

`Error`

#### Returns

`void`

***

### onGap()?

```ts
optional onGap: () => void;
```

A state-update seq gap was detected (reconnect recommended).

#### Returns

`void`

***

### onNotification()?

```ts
optional onNotification: (n) => void;
```

A transient CTI notification (screen-pop) — surfaced, not stored in the view.

#### Parameters

##### n

`Notification`

#### Returns

`void`

***

### onUnauthenticated()?

```ts
optional onUnauthenticated: (err) => void;
```

The session's bearer token was rejected, so nothing this client sends will be accepted again.
Raised for an `Error` with code `unauthenticated` (sent in place of a command's own
`<intent>_failed` code) and for a call the server refuses as unauthenticated — whichever comes first.

Fires **at most once**, and never after you [BabelconnectClient.close](../classes/BabelconnectClient.md#close) the client yourself. By the time it runs the client has already been [BabelconnectClient.close](../classes/BabelconnectClient.md#close)d:
its stream is stopped, its media legs are being torn down and later intents are dropped. Sign the
agent in again, then create a new client with the new token. `err` is the error that ended the session:
its `code` is `unauthenticated`, or `not_an_agent` when the token is valid but its user holds no agent
role — signing in again as the same user will not help, and `message` names the user.

#### Parameters

##### err

`Error`

#### Returns

`void`

***

### serverUrl

```ts
serverUrl: string;
```

babelconnect-server origin (gRPC-web), e.g. `https://agent.example.com` or `http://localhost:7091`.

***

### token

```ts
token: string;
```

Bearer token (see [passwordGrant](../functions/passwordGrant.md) or your host login).
