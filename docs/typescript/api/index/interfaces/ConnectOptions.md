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

Out-of-band server notices (command rejections) + local media failures.

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
