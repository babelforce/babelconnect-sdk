# Interface: MediaOwnerEvent

The `call.media_owner` payload: emitted by an instance when its
hold on a call's media changes — it answered (`ownsMedia: true`), or the leg
went away (`false`). `instanceId` is the emitting mount, so a host can act
on it without tracking which iframe the message came from.

## Properties

### callId

```ts
callId: string;
```

***

### instanceId

```ts
instanceId: string;
```

***

### ownsMedia

```ts
ownsMedia: boolean;
```
