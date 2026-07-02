---
title: Recipes
sidebar_label: Recipes
sidebar_position: 3
description: Short, copy-paste UI patterns built from AgentView and the intents — a presence selector, an incoming-call card, a conversation list, and the wrap-up timer.
---

# Recipes

Small, framework-agnostic patterns that turn the [state model](../concepts/state-and-events) and the
[intents](../concepts/intents) into UI. Each renders from `AgentView` and sends an intent on interaction —
render the server's state rather than mirroring it locally (the wrap-up ticker below is the one bit of local,
display-only state).

Throughout, **`bc`** is a connected [`BabelconnectClient`](../typescript/quickstart-client) and **`view`** is
the current `AgentView` from its `subscribe` callback. These are browser-UI patterns in TypeScript; the same
fields and intents drive [Go back-end automation](../go/quickstart-control-only), just without the rendering.

Gate each surface on the matching [`AgentView.config`](../concepts/state-and-events#the-patch-types) flag —
`calls.enabled` for the call recipes, `messaging.enabled` for SMS, `history.enabled` for history,
`phonebook.enabled` for contacts — so you never render a disabled capability. Finer call actions have their
own flags: `calls.allowTransfer` for transfer and `calls.allowConference` for conferencing; recording is gated
on `agent.canRecord` (an agent capability, not a `config` flag).

## A presence selector

`AgentView.agent.presenceOptions` is the deployment's list of presences the agent may switch to — each has a
`name` (pass it to `setPresence`), a display `label`, and an `available` flag. The current one is
`agent.presenceName`. So the selector is a straight map:

```ts
const items = view.agent.presenceOptions.map((o) => ({
  label: o.label,                              // e.g. "Available", "Break"
  available: o.available,                      // tint available vs pause reasons
  current: o.name === view.agent.presenceName, // highlight the active one
  onSelect: () => bc.setPresence(o.name),      // send the intent; the agent patch reflects it
}));
```

Don't track the selected presence locally — render `current` from `presenceName` and let the `agent` patch
that follows `setPresence` move it. (See [Set presence](../concepts/intents#session--identity) for the coarse
`agent.presence` bucket vs this chosen presence.)

## An incoming-call card

Inbound calls show up in `activeCalls` in the `RINGING` lifecycle and **don't** auto-answer. Filter for them,
render a card, and wire Answer / Reject to `answerCall` / `hangup`:

```ts
import { CallLifecycle, CallDirection } from "@babelforce/babelconnect-sdk";

// Resolve a contact name; skip "recent"-labelled entries (recently-dialed numbers carry the literal
// label "recent", not a real name) so a recent caller doesn't render as the word "recent".
const nameFor = (num) =>
  view.agent.phonebook.find((e) => e.number === num && e.label !== "recent")?.label;

const incoming = view.activeCalls
  .filter((c) => c.state === CallLifecycle.RINGING && c.direction === CallDirection.INBOUND)
  .map((c) => ({
    who: c.anonymous ? "Anonymous" : (nameFor(c.from) ?? c.from), // name if known, else the number
    viaQueue: c.queueName || null,           // set when the call arrived through a queue
    source: c.source,                        // CallSource — a numeric enum (map for display, e.g. CallSource[c.source]): queue / transfer / callback / dialer / …
    onAnswer: () => bc.answerCall(c.id),
    onReject: () => bc.hangup(c.id),
  }));
```

A live `CallState` carries no contact label (unlike `CallRecord` / `SmsConversation`), so to show a **name**
instead of the raw `from` number, look it up in `view.agent.phonebook`.

`call.state` / `call.direction` / `call.source` are numeric enums — compare against the named members
(`CallLifecycle.RINGING`, `CallSource.QUEUE`, …), not strings or raw numbers.

## An SMS conversation list

`AgentView.sms` is a list of conversation **summaries**. Sort newest-first, show the contact name (or the raw
number), preview the last message, and badge the unread count; filter by `open` for an active-threads inbox.
Opening a thread fetches its messages and marks it read:

```ts
const threads = [...view.sms]
  .sort((a, b) => b.lastTs - a.lastTs)        // newest first
  .map((c) => ({
    title: c.contactLabel || c.peer,          // phonebook name if known, else the number
    preview: c.lastText,
    unread: c.unread,
    open: c.open,                             // unresolved vs closed
    onOpen: async () => {
      if (c.id) bc.markConversationRead(c.id); // needs the id (no peer fallback); unread → 0 via smsUpsert
      const messages = await bc.getSmsThread(c.id || c.peer); // id, or the peer if it's not assigned yet
      render(messages);
    },
    onResolve: c.id ? () => bc.setConversationOpen(c.id, false) : undefined, // needs id; close it ((…, true) reopens)
  }));

const totalUnread = view.sms.reduce((n, c) => n + c.unread, 0); // a messaging-tab badge
```

To start a **new** thread, just `bc.sendSms(toNumber, text)` — a fresh `SmsConversation` arrives via
`smsUpsert` and folds into `view.sms`. It may not have a backend `id` yet — that's why `onOpen` above falls
back to the `peer` for `getSmsThread` and guards the id-only `markConversationRead` / `setConversationOpen`.

Render the fetched `messages` oldest-to-newest as bubbles: align by `direction`, show `text`, the time from
`ts` (×1000 for a `Date`), and the display `state` (`sent` / `delivered` / `failed` / …) as a delivery hint.

## The wrap-up timer

When a call ends the server may open after-call work — `view.wrapUp.active` flips true with a
`remainingSeconds`. The server doesn't tick per second, so run a **local** 1-second ticker and reconcile it to
each `wrapUp` patch; gate the controls on the flags:

```ts
// Call this from your subscribe handler with view.wrapUp on each update:
function onWrapUp(wu) {
  if (!wu.active) return stopTicker();   // active:false (cancelled or hit 0) → clear the panel
  setRemaining(wu.remainingSeconds);     // reconcile — e.g. wrapUpExtend bumps this back up
  setLabel(wu.lastCallType);             // which call this wrap-up belongs to
  startTickerIfStopped();                // a setInterval that decrements local state each second
}

const canExtend = view.wrapUp.canExtend ? () => bc.wrapUpExtend(30) : undefined; // add 30s
const canCancel = view.wrapUp.canCancel ? () => bc.wrapUpCancel() : undefined;   // finish early
```

See the [wrap-up walkthrough](../concepts/state-and-events#wrap-up-end-to-end) for the full patch sequence.

## In-call controls

For a connected call, the toggle buttons read their lit/unlit state straight from the `CallState` and send the
**opposite** as an intent — you never flip them locally; the `callUpsert` that follows reflects the change:

```ts
const call = bc.activeCall(); // the first active call; or pick from view.activeCalls by id
if (call) {
  const controls = {
    mute:   { on: call.muted,  toggle: () => bc.mute(call.id, !call.muted) },
    hold:   { on: call.onHold, toggle: () => bc.hold(call.id, !call.onHold) },
    record: view.agent.canRecord ? {           // only offer it when the agent may record
      on: call.recording,
      toggle: () => (call.recording ? bc.stopRecording(call.id) : bc.startRecording(call.id)),
    } : undefined,
    hangup:   () => bc.hangup(call.id),
    transfer: view.config?.calls?.allowTransfer ? (to) => bc.transfer(call.id, to) : undefined, // E.164; blind — see the warm-transfer recipe for attended
    digits:   (d) => bc.sendDigits(call.id, d),        // DTMF, e.g. an IVR menu choice
    conference: view.config?.calls?.allowConference ? () => bc.startConference() : undefined, // around this call (pass true to park it first)
  };
}
```

## Outbound dial with a caller-ID picker

`agent.availableNumbers` are the outbound numbers the agent may present; `agent.displayAs` is the current one.
Render a picker that calls `setDisplayAs`, then dial:

```ts
const callerIds = view.agent.availableNumbers.map((n) => ({
  number: n,
  current: n === view.agent.displayAs,
  onSelect: () => bc.setDisplayAs(n),    // sets the agent's outbound caller ID
}));

bc.placeCall(toNumber);                  // E.164; or override per call:
// bc.placeCall(toNumber, { displayAsTo: "+49301234567" }); // displayAsTo = what the consumer sees;
//                                                           // displayAsFrom = what the agent sees
```

The agent's own leg auto-answers, so the call goes straight to `IN_PROGRESS` — see
[the outbound note](../concepts/state-and-events#a-call-end-to-end).

## A conference panel

`view.conferences` is usually empty or one `Conference`. Render its `members`, and gate the moderator-only
controls on `conf.iAmModerator`. A member exposes `onHold` (readable) but not a muted flag, so the mute button
is fire-and-act:

```ts
const conf = view.conferences[0];
if (conf) {
  const members = conf.members.map((m) => ({
    label: m.display,
    me: m.isMe,                                  // highlight your own row
    state: m.state,                              // pending|added|removing|… — show "joining"/"leaving"
    onHold: m.onHold,
    hold: conf.iAmModerator && !m.isMe ? () => bc.holdConferenceMember(m.id, !m.onHold) : undefined,
    mute: conf.iAmModerator && !m.isMe ? (on) => bc.muteConferenceMember(m.id, on) : undefined,
    kick: conf.iAmModerator && !m.isMe ? () => bc.kickConferenceMember(m.id) : undefined,
  }));

  const addMember = (agentId, number) => bc.addConferenceMember({ agentId, number }); // pass exactly one
  const end   = conf.iAmModerator ? () => bc.endConference() : undefined; // ends it for everyone
  const leave = () => bc.leaveConference();                               // drop only your own leg
}
```

`conf.state` (`created` → `finishing` → `finished`) lets you show an "ending…" state before the
`conferenceRemove` patch clears the panel.

Calls and conferences are separate state, so during a conference the agent's **own** call leg stays in
`activeCalls`: use the [in-call controls](#in-call-controls) for your own mute/hold, and this panel for the
other members.

## A call-history list

History isn't part of the live `AgentView` — fetch it. The TS helpers unwrap the response, so `getHistory`
returns a `CallRecord[]` directly (`getSmsThread` → `SmsMessage[]`, `getPhonebook` → entries):

```ts
const calls = (await bc.getHistory()) // CallRecord[]; pass (max, page) to page
  .sort((a, b) => b.time - a.time);   // newest first (the server order isn't guaranteed)
const rows = calls.map((c) => ({
  who: c.contact || (c.direction === CallDirection.INBOUND ? c.from : c.to), // phonebook name, else the number
  inbound: c.direction === CallDirection.INBOUND,
  when: new Date(c.time * 1000),                      // c.time is unix SECONDS — ×1000 for a JS Date
  durationMs: c.durationMs,                           // already milliseconds — ÷1000 for seconds
  playback: c.hasRecording ? c.recordingUrl : undefined, // a play button when a recording exists
}));
```

## A warm (attended) transfer

A warm transfer is a two-step consult, not one intent: pull the target in (which parks the customer on hold),
talk privately, then complete — see the [Transfer note](../concepts/intents#calls) for the full story.

```ts
bc.addConferenceMember({ number: target });    // (or { agentId }) — parks the customer, opens the consult
// …the agent and the target talk privately…
bc.transfer(call.id, target, { warm: true });  // complete: unholds the customer, drops the agent's leg
```

A blind transfer is just the single call: `bc.transfer(call.id, target)`.

Gate these on different flags: a **warm** transfer runs through a conference, so gate that control on
`config.calls.allowConference`; a **blind** transfer gates on `config.calls.allowTransfer`.

## A contacts list (dial from the phonebook)

`view.agent.phonebook` is a register-time snapshot; `getPhonebook` re-pulls it with an optional server-side
search. Each `PhonebookEntry` is a `label` + `number`, where `label` is the contact name or the literal
`"recent"` for a recently-dialed number:

```ts
const contacts = await bc.getPhonebook(50, 1, query); // PhonebookEntry[]; query filters by label/number
const rows = contacts.map((c) => ({
  label: c.label === "recent" ? c.number : c.label,   // group/relabel recents as you like
  number: c.number,
  onDial: () => bc.placeCall(c.number),               // E.164
}));
```

## A device selector (where calls ring)

Let the agent route calls to the in-browser phone or to an external number ([where calls
ring](../concepts/intents#session--identity)) — gate it on `account.allowDeviceSwitch`:

```ts
if (view.config?.account?.allowDeviceSwitch) {
  const browser = {
    on: view.agent.webrtcEnabled,
    toggle: () => bc.setWebrtc(!view.agent.webrtcEnabled), // WebRTC on → calls ring in the browser
  };
  const currentExternal = view.agent.number;              // the external number in effect now
  const useExternal = (num) => bc.setAgentNumber(num);     // off → the backend bridges to this number
}
```

Keep one path live: leaving WebRTC off with no agent number set makes the agent unreachable.

## See also

- **[State & events](../concepts/state-and-events)** — the `AgentView` these recipes render from.
- **[Intents reference](../concepts/intents)** — every intent they send.
- **[Programmatic client](../typescript/quickstart-client)** — how to get the `bc` client and `view`.
- **[Embedding](../typescript/embedding)** — drop in the prebuilt agent app instead of building this UI.








