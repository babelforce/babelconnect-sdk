# Class: BabelconnectClient

The TypeScript "dumb renderer" client: opens the `Subscribe`/`Send` gRPC-web
split, mirrors the server's `AgentView` in a [StateCache](StateCache.md), exposes typed
intent senders, and drives a pluggable WebRTC [Media](../interfaces/Media.md) leg. UI binds to
[subscribe](BabelconnectClient.md#subscribe) and dispatches intents — no call/agent logic lives here.

## Accessors

### view

#### Get Signature

```ts
get view(): AgentView
```

The current view (deep copy).

##### Returns

`AgentView`

## Methods

### activeCall()

```ts
activeCall(): undefined | CallState
```

The first active call, or undefined.

#### Returns

`undefined` \| `CallState`

***

### addConferenceMember()

```ts
addConferenceMember(opts): void
```

Invite a participant — pass exactly one of `agentId` or `number`. Starts a conference first if none is active.

#### Parameters

##### opts

###### agentId

`string`

###### number

`string`

#### Returns

`void`

***

### answerCall()

```ts
answerCall(callId): Promise<void>
```

Manually answer a RINGING call by id (no-op under autoAnswer once already answered).

#### Parameters

##### callId

`string`

#### Returns

`Promise`\<`void`\>

***

### close()

```ts
close(): Promise<void>
```

Tear down media legs and the connection.

#### Returns

`Promise`\<`void`\>

***

### endConference()

```ts
endConference(): void
```

End the whole conference for everyone (moderator only).

#### Returns

`void`

***

### flagRecording()

```ts
flagRecording(callId): void
```

Toggle the "flagged" mark on the call's active recording.

#### Parameters

##### callId

`string`

#### Returns

`void`

***

### getHistory()

```ts
getHistory(max, page): Promise<CallRecord[]>
```

Fetch a page of the agent's call history (the History tab).

#### Parameters

##### max

`number` = `50`

##### page

`number` = `1`

#### Returns

`Promise`\<`CallRecord`[]\>

***

### getPhonebook()

```ts
getPhonebook(
   max, 
   page, 
query): Promise<PhonebookEntry[]>
```

Re-pull the agent's merged contacts + recent numbers (the Contacts tab) — an
on-demand refresh of the register-time `AgentInfo.phonebook` snapshot.
`query` filters by label/number.

#### Parameters

##### max

`number` = `200`

##### page

`number` = `1`

##### query

`string` = `""`

#### Returns

`Promise`\<`PhonebookEntry`[]\>

***

### getSmsThread()

```ts
getSmsThread(
   conversationId, 
   max, 
page): Promise<SmsMessage[]>
```

Fetch the messages of one SMS conversation (the chat thread), oldest first.

#### Parameters

##### conversationId

`string`

##### max

`number` = `50`

##### page

`number` = `1`

#### Returns

`Promise`\<`SmsMessage`[]\>

***

### hangup()

```ts
hangup(callId): void
```

End (or reject) a call by id.

#### Parameters

##### callId

`string`

#### Returns

`void`

***

### hold()

```ts
hold(callId, on): void
```

Put a call on hold or retrieve it.

#### Parameters

##### callId

`string`

##### on

`boolean`

#### Returns

`void`

***

### holdConferenceMember()

```ts
holdConferenceMember(memberId, on): void
```

Hold or unhold an individual conference member (moderator only).

#### Parameters

##### memberId

`string`

##### on

`boolean`

#### Returns

`void`

***

### kickConferenceMember()

```ts
kickConferenceMember(memberId): void
```

Remove a member from the conference (moderator only).

#### Parameters

##### memberId

`string`

#### Returns

`void`

***

### leaveConference()

```ts
leaveConference(): void
```

Drop only the agent's own leg; the other members stay connected.

#### Returns

`void`

***

### markConversationRead()

```ts
markConversationRead(conversationId): void
```

Clear the unread count on an SMS conversation (the agent opened its thread).

#### Parameters

##### conversationId

`string`

#### Returns

`void`

***

### mute()

```ts
mute(callId, on): void
```

Mute or unmute the agent's own leg of a call.

#### Parameters

##### callId

`string`

##### on

`boolean`

#### Returns

`void`

***

### muteConferenceMember()

```ts
muteConferenceMember(memberId, on): void
```

Mute or unmute an individual conference member (moderator only).

#### Parameters

##### memberId

`string`

##### on

`boolean`

#### Returns

`void`

***

### placeCall()

```ts
placeCall(to, opts): void
```

#### Parameters

##### to

`string`

##### opts

###### displayAsFrom

`string`

###### displayAsTo

`string`

###### record

`boolean`

###### session

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### register()

```ts
register(capabilities): void
```

Announce the agent and load its deployment data (presence options, caller-ID numbers, phonebook, feature
config) — call this once after [BabelconnectClient.subscribe](BabelconnectClient.md#subscribe). It also marks the agent
**WebRTC-reachable** on the backend, so a control-only client that takes calls should follow it with
[BabelconnectClient.setWebrtc](BabelconnectClient.md#setwebrtc)(false) + [BabelconnectClient.setAgentNumber](BabelconnectClient.md#setagentnumber).

#### Parameters

##### capabilities

`string`[] = `...`

#### Returns

`void`

***

### resetLineStatus()

```ts
resetLineStatus(): void
```

Clear a blocked line (busy / unreachable / declined) so new calls reach the agent again.

#### Returns

`void`

***

### sendDigits()

```ts
sendDigits(callId, digits): void
```

Send DTMF tones into the call (e.g. an IVR menu choice). Valid characters: `0`–`9`, `*`, `#`, `A`–`D`.

#### Parameters

##### callId

`string`

##### digits

`string`

#### Returns

`void`

***

### sendSms()

```ts
sendSms(
   to, 
   text, 
   opts): void
```

Send an SMS. `from` may be empty (server picks the default); `session` carries CTI/embedding correlation.

#### Parameters

##### to

`string`

##### text

`string`

##### opts

###### from

`string`

###### session

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### setAgentNumber()

```ts
setAgentNumber(number): void
```

Set the agent's external phone number; the backend bridges calls there when WebRTC is off.

#### Parameters

##### number

`string`

#### Returns

`void`

***

### setConversationOpen()

```ts
setConversationOpen(conversationId, open): void
```

Open (reopen) or close (resolve) an SMS conversation.

#### Parameters

##### conversationId

`string`

##### open

`boolean`

#### Returns

`void`

***

### setDisplayAs()

```ts
setDisplayAs(number): void
```

Set the outbound caller ID the consumer sees (choose from `agent.availableNumbers`).

#### Parameters

##### number

`string`

#### Returns

`void`

***

### setPresence()

```ts
setPresence(name): void
```

Switch presence (the selector): "available" or a configured pause reason (see `AgentInfo.presenceOptions`).

#### Parameters

##### name

`string`

#### Returns

`void`

***

### setRecordingTags()

```ts
setRecordingTags(callId, tags): void
```

Replace the tags on the call's active recording (choose from `agent.availableTags`).

#### Parameters

##### callId

`string`

##### tags

`string`[]

#### Returns

`void`

***

### setWebrtc()

```ts
setWebrtc(on): void
```

Turn the in-browser WebRTC phone on or off. With it off, set an agent number so calls bridge there.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### startConference()

```ts
startConference(hold): void
```

Open a conference around the current call. `hold` parks that call while you add members and consult.

#### Parameters

##### hold

`boolean` = `false`

#### Returns

`void`

***

### startRecording()

```ts
startRecording(callId): void
```

Begin recording the current call. Gated on `agent.canRecord`.

#### Parameters

##### callId

`string`

#### Returns

`void`

***

### stopRecording()

```ts
stopRecording(callId): void
```

Stop the call's active recording.

#### Parameters

##### callId

`string`

#### Returns

`void`

***

### subscribe()

```ts
subscribe(fn): () => void
```

Register a render callback (fired immediately and on every state update). Returns an unsubscribe fn.

#### Parameters

##### fn

(`v`) => `void`

#### Returns

`Function`

##### Returns

`void`

***

### transfer()

```ts
transfer(
   callId, 
   to, 
   opts): void
```

Transfer to exactly one of `to` (number), `agentId`, or `applicationId`; `warm` = attended.

#### Parameters

##### callId

`string`

##### to

`string`

##### opts

###### agentId

`string`

###### applicationId

`string`

###### warm

`boolean`

#### Returns

`void`

***

### wrapUpCancel()

```ts
wrapUpCancel(): void
```

End after-call work early. Show only when `wrapUp.canCancel`.

#### Returns

`void`

***

### wrapUpExtend()

```ts
wrapUpExtend(seconds): void
```

Add seconds to the after-call-work countdown (default 30). Show only when `wrapUp.canExtend`.

#### Parameters

##### seconds

`number` = `30`

#### Returns

`void`

***

### connect()

```ts
static connect(opts): BabelconnectClient
```

Open the session and start mirroring server state. Returns synchronously and queues intents until the
stream is live, so you can subscribe and register immediately.

#### Parameters

##### opts

[`ConnectOptions`](../interfaces/ConnectOptions.md)

#### Returns

[`BabelconnectClient`](BabelconnectClient.md)

#### Example

```ts
const bc = BabelconnectClient.connect({ serverUrl, token });
bc.subscribe(render);          // render(AgentView) on every update
bc.register();                 // announce reachability + load deployment data
bc.placeCall("+15551234567");  // the result arrives as a callUpsert patch
```
