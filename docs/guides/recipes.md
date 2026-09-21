---
title: Recipes
sidebar_label: Recipes
sidebar_position: 3
description: Focused TypeScript patterns for presence, calls, messaging, transfers, contacts and device choice.
---

# Recipes

These fragments extend the [complete softphone](../tutorial/first-softphone). `bc` is a connected
`BabelconnectClient`, `view` is its current `AgentView`, and callbacks such as `renderMessages` are
your UI functions. They are independent patterns, not one application to concatenate.

Gate surfaces on [feature config](../concepts/state-and-events#the-patch-types): calls, messaging,
history and phonebook each have `enabled`; recording uses `agent.canRecord`. Render server state
and send commands from user actions.

## A presence selector

```ts
const agent = view.agent;
const items = (agent?.presenceOptions ?? []).map(o => ({
  label: o.label,
  available: o.available,
  current: o.name === agent?.presenceName,
  onSelect: () => bc.setPresence(o.name),
}));
```

Keep every configured option. A pause reason's `available: false` is its meaning, not a reason to
hide it. The next agent patch confirms the selection.

## An incoming-call card

Use the tutorial's Answer/Reject buttons. For a contact label, skip the literal `"recent"`:

```ts
const nameFor = (number: string) => view.agent?.phonebook
  .find(e => e.number === number && e.label !== "recent")?.label;
```

Show Anonymous for `call.anonymous`, otherwise `nameFor(call.from) ?? call.from`; include
`queueName` when present. Lifecycle, direction and source are numeric enums: compare named
members, and use `CallSource[call.source]` for a display label. Scheduled callbacks also need
explicit answering.

## An SMS conversation list

```ts
const threads = [...view.sms]
  .sort((a, b) => Number(b.lastTs) - Number(a.lastTs))
  .map(c => ({
    title: c.contactLabel || c.peer, preview: c.lastText, unread: c.unread, open: c.open,
    onOpen: async () => {
      if (c.id) bc.markConversationRead(c.id);
      renderMessages(await bc.getSmsThread(c.id || c.peer));
    },
    onResolve: c.id ? () => bc.setConversationOpen(c.id, false) : undefined,
  }));
const totalUnread = view.sms.reduce((n, c) => n + c.unread, 0);
```

Filter `open` for unresolved threads. `sendSms(to, text)` starts a new thread; its initial summary
may lack an ID. Only fetching supports the peer fallback; mark-read and resolve require an ID.
Render messages oldest first, aligned by direction, with text, timestamp and a display-only delivery
state. Use `Number(message.ts) * 1000` for `Date`: protobuf int64 values are bigint in TypeScript.
Catch fetch errors in your UI. `setConversationOpen(id, true)` reopens a thread.

## The wrap-up timer

Store a local deadline from each **new wrap-up value**, then display
`Math.max(0, Math.ceil((deadline - Date.now()) / 1000))`. Rebase after an extension; don't reset the
deadline on unrelated call or presence updates. Keep one timer and clear it on unmount or
`active: false`. A local zero does not confirm the server ended wrap-up.

Show `lastCallType`; offer `bc.wrapUpExtend(30)` only with `canExtend`, and `bc.wrapUpCancel()` only
with `canCancel`. See [wrap-up state](../concepts/state-and-events#wrap-up-end-to-end).

## A line-blocked banner

```ts
const why: Record<string, string> = {
  unreachable: "A call offer was missed or could not reach you; the line frees itself shortly",
  busy: "Your line reported busy",
  declined: "A call offer was declined",
  dnd: "Your line is on do-not-disturb",
};
const banner = view.agent?.lineBlocked ? {
  text: why[view.agent.lineBlockedReason] ?? "Your line is blocked",
  reset: () => bc.resetLineStatus(),
} : undefined;
```

Show it while `lineBlocked` is true, including during reset. Hide it only when the server clears
the flag. Chosen BUSY is different; [availability](../concepts/state-and-events#consuming-it)
explains why it needs a presence selector instead.

## In-call controls

```ts
const call = bc.activeCall(); // or select a specific ID from view.activeCalls
if (call) {
  const controls = {
    mute: () => bc.mute(call.id, !call.muted),
    hold: () => bc.hold(call.id, !call.onHold),
    record: view.agent?.canRecord ? () => call.recording
      ? bc.stopRecording(call.id) : bc.startRecording(call.id) : undefined,
    hangup: () => bc.hangup(call.id),
    transfer: view.config?.calls?.allowTransfer
      ? (to: string) => bc.transfer(call.id, to) : undefined,
    digits: (digits: string) => bc.sendDigits(call.id, digits),
    conference: view.config?.calls?.allowConference
      ? () => bc.startConference(false, call.id) : undefined,
  };
}
```

Read toggle labels from the call flags. `startConference(true, call.id)` parks that call first.
DTMF accepts `0`–`9`, `*`, `#`, `A`–`D`; command errors still arrive asynchronously.

## Outbound dial with a caller-ID picker

Map `view.agent?.availableNumbers ?? []` to choices, select the current `displayAs`, and call
`bc.setDisplayAs(number)` on selection. After the state confirms it, call `bc.placeCall(toNumber)`.
For a per-call override, use `bc.placeCall(toNumber, { displayAsTo })`; `displayAsTo` is what the
consumer sees, while `displayAsFrom` is what the agent sees. Use E.164 numbers and handle an empty
caller-ID list. See [dial rejections](../protocol/error-codes#outbound--answering).

## A conference panel

Render each conference's members and gate moderator controls on `conf.iAmModerator`.
Use `member.id` for `kickConferenceMember`, `holdConferenceMember` and `muteConferenceMember`;
avoid offering those controls on your own `isMe` row. Member `onHold` is readable, but there is
no member muted flag to use for a toggle. Provide explicit Mute/Unmute actions.

`addConferenceMember({ agentId })` or `addConferenceMember({ number })` adds exactly one target.
Show member display/state/failure labels and a badge for `isMe`; `conf.state` can indicate ending
until removal. `endConference()` ends it for everyone; `leaveConference()` drops your own leg.
Use [in-call controls](#in-call-controls) for your own mute/hold during a conference.

## A call-history list

```ts
import { CallDirection } from "@babelforce/babelconnect-sdk";

const rows = (await bc.getHistory()).sort((a, b) => Number(b.time) - Number(a.time)).map(c => ({
  who: c.contact || (c.direction === CallDirection.INBOUND ? c.from : c.to),
  inbound: c.direction === CallDirection.INBOUND,
  when: new Date(Number(c.time) * 1000),
  durationMs: c.durationMs,
  playback: c.hasRecording ? c.recordingUrl : undefined,
}));
```

History is fetched, not stored in `AgentView`. TS helpers unwrap response lists. Order isn't
assumed here; [paging](../concepts/intents#reference-data-unary--not-intents) explains page sizes
and how to detect the last page. Catch request failures at the UI boundary.

## A warm (attended) transfer

```ts
bc.addConferenceMember({ number: target, callId: call.id });
// After the target joins and the agent completes the private consultation:
bc.transfer(call.id, target, { warm: true });
```

The first step parks the customer; completion unholds them and drops the agent's leg.
Gate warm transfer on `allowConference`, blind transfer on `allowTransfer`.
`bc.transfer(call.id, target)` is a blind transfer without a consult.

## A contacts list (dial from the phonebook)

`agent.phonebook` is a registration snapshot. Refresh/search with
`await bc.getPhonebook(50, 1, query)`. Each entry has `label` and `number`; show the number for a
literal `"recent"` label. Wire dialing to `bc.placeCall(entry.number)`, and catch fetch errors.

## A device selector (where calls ring)

Gate the selector on `view.config?.account?.allowDeviceSwitch`.
Read `agent.webrtcEnabled`; send `bc.setWebrtc(on)` for a change. With WebRTC off, calls use
`agent.number`, set by `bc.setAgentNumber(number)`. Keep an audio path configured and confirm
changes in state. [Control-only setup](../typescript/quickstart-control-only) explains why a new
registration requires restoring external-phone routing.

## See also

[State & events](../concepts/state-and-events) explains the fields; [Intents](../concepts/intents)
lists commands; [Embedding](../typescript/embedding) supplies the ready-made UI.
