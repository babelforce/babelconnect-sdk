# Class: BrowserWebrtcMedia

The default browser WebRTC backend: capture the mic, answer the server's offer
(non-trickle ICE), and play the remote audio through a hidden `<audio>` element.
A-law (PCMA) passthrough is negotiated by the server's offer.

## Implements

- [`Media`](../interfaces/Media.md)

## Constructors

### new BrowserWebrtcMedia()

```ts
new BrowserWebrtcMedia(iceServers): BrowserWebrtcMedia
```

#### Parameters

##### iceServers

`RTCIceServer`[] = `[]`

fallback ICE servers; the per-call `answer(offer, iceServers)`
 argument (from `CallState.ice_servers`) takes precedence when provided.

#### Returns

[`BrowserWebrtcMedia`](BrowserWebrtcMedia.md)

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

#### Implementation of

[`Media`](../interfaces/Media.md).[`answer`](../interfaces/Media.md#answer)

***

### close()

```ts
close(): Promise<void>
```

Tear down the peer (idempotent).

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Media`](../interfaces/Media.md).[`close`](../interfaces/Media.md#close)
