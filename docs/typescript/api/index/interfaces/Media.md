# Interface: Media

The pluggable media seam: one WebRTC leg per call. The SDK drives control over
gRPC-web and hands the server's SDP offer to a `Media` to answer (audio flows
between the browser and babelconnect-server). Mute/hold are server-side intents
(`mute`/`hold`), so they are not part of this seam.

## Methods

### answer()

```ts
answer(offer, iceServers?): Promise<string>
```

Consume the server's SDP offer and return the client's SDP answer, starting
audio. Called once per call.

#### Parameters

##### offer

`string`

##### iceServers?

`RTCIceServer`[]

STUN/TURN servers the server advertised on the call
  (`CallState.ice_servers`) — for off-host NAT traversal; empty in the
  in-cluster/LAN case.

#### Returns

`Promise`\<`string`\>

***

### close()

```ts
close(): Promise<void>
```

Tear down the peer (idempotent).

#### Returns

`Promise`\<`void`\>
