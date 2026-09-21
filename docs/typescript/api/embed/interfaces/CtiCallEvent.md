# Interface: CtiCallEvent

The `cti.call` payload. `ownsMedia` is true only in the instance
whose own session answered and holds the call's `RTCPeerConnection` — every
other mounted instance reports the same call with `ownsMedia: false`.

## Properties

### call

```ts
call: {
  from: string;
  id: string;
  ownsMedia: boolean;
  state: string;
  to: string;
  type: "inbound" | "outbound";
};
```

#### from

```ts
from: string;
```

#### id

```ts
id: string;
```

#### ownsMedia

```ts
ownsMedia: boolean;
```

#### state

```ts
state: string;
```

#### to

```ts
to: string;
```

#### type

```ts
type: "inbound" | "outbound";
```
