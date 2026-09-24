---
title: Error codes
sidebar_label: Error codes
sidebar_position: 2
description: Every code the server can send on the stream's Error message — when it is sent, whether it carries a callId, and what the client should do about it.
---

# Error codes

Error `code`s are **stable strings** and this page is the complete list the server can send today — but
treat an unknown code **generically** (show the `message`, keep the session up), because a newer server may
add one your client has never seen. How to receive them at all is in
[Errors & reconnects → command rejections](../guides/errors-and-reconnects#1-command-rejections-onerror).

An `Error` arrives **out-of-band** on the stream: a `code`, a human-readable `message`, and — for anything
tied to a specific call — a `callId`. It is **not** a state change and does not advance `seq`. Nothing in the
`AgentView` changed because of it, so the right response is almost always "surface the message and let the
agent retry", never "tear down the session".

Two conventions run through the table:

- **`<intent>_failed`** means the command was well-formed and reached the platform, which then refused it.
  The `message` carries the platform's own reason, so **show it** — it is the only detail you get.
- **`<what>_required`** means a required field was missing or empty. The command never left the
  server, nothing changed, and a blind retry fails identically — fix the arguments.
- Anything else (`no_call`, `not_recording`, …) is a **precondition** the server checked
  itself. The command never left the server, and retrying it unchanged fails identically.

In the **`callId?`** column: **✓** = always carries one · **—** = never · *sometimes* = only in the cases named.

## Session & commands

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `answer_requires_sdp` | `answerCall` carried no SDP answer. | *sometimes* — it echoes the `callId` you sent; empty when you sent none | send the SDP answer your peer connection produced for the offer on `call.webrtcOffer`. Nothing was sent onward. |
| `digits_required` | `sendDigits` carried no digits. | ✓ | send the digits. Nothing was sent onward. |
| `transfer_target_required` | a transfer named no target — no number, no agent and no application. | ✓ | pick a target and resend. Nothing was sent onward. |
| `send_sms_requires_to_and_text` | `sendSms` was missing `to`, `text`, or both. | — | fill both and resend. Nothing was sent onward. |
| `conversation_id_required` | `setConversationOpen` or `markConversationRead` carried no conversation id. | — | send the id of the conversation the agent acted on. Nothing was sent onward. |
| `target_required` | `addConferenceMember` named neither an agent nor a number. | — | pick one and resend. Nobody was invited. |
| `member_id_required` | a conference member action — hold, mute or kick — carried no member id. | — | send the member id from `conferences[].members`. Nothing was sent onward. |
| `presence_name_required` | `setPresence` carried no presence name. | — | send one of the names in `presenceOptions`. The presence did not change. |
| `agent_number_required` | `setAgentNumber` carried no number. | — | send one of the numbers in `availableNumbers`. The number did not change. |
| `campaign_id_required` | `joinCampaign` carried no campaign id. | — | send the id of the campaign to join. The agent joined nothing. |
| `dispose_code_required` | `disposeCall` carried no disposition code. | — | send one of the codes the campaign offers. The call was not disposed. |
| `no_call` | the command acts on a call this session does not hold — the `callId` you sent names no call of the agent's, or you sent none and there is no active call. Covers answer, hangup, mute, hold, digits, transfer, all four recording commands, and the conference commands that need a live call (start, add member, leave). | *sometimes* — it echoes the `callId` you sent, the conference commands included; empty when you sent none | the call ended, or you raced the stream. Re-read `activeCalls` from your cached `AgentView` and re-derive the button state instead of retrying. |
| `ambiguous_call` | a command that carries **no call id at all** arrived while the agent holds **more than one** call. `startConference`, `addConferenceMember` and `leaveConference` **do** carry a `callId` now, and one that names a call is routed to it — this code is only ever the answer to an id-less one, where with a second call up the server cannot tell which you meant and refuses rather than guess, because guessing `leaveConference` hangs up a conversation nobody ended. | ✓ — the call it *would* have acted on (the active one) | **send the id.** Resend the same command with `callId` set to the call the agent's control belongs to; that is the fix, and it needs no change to the agent's calls. Only a client that cannot name the call has to get the agent down to one — hang up or transfer the others — before repeating it. |
| `call_on_hold` | `sendDigits` was addressed to a call that is **on hold**. Hold silences audio in both directions, so the digits would never reach the far end; the server refuses instead of playing them into a closed gate. | ✓ | take the call off hold (`hold(id, false)`) and send the digits again. Gate the keypad on `call.onHold` so the agent isn't offered an action that cannot work. |
| `too_many_digits` | `sendDigits` carried more digits than may be **outstanding on one call at once** — either in this one burst, or counting the bursts already queued ahead of it on the same call. While a burst is playing, the agent's own outbound audio is not sent, so the length of a burst is the length of the agent's silence toward the caller. The limit is **64 digits**, which is about 11.5 s of that silence at the roughly 180 ms each digit takes on the wire — comfortably longer than any sequence a person keys in one action (a card number is at most 19 digits, a phone number at most 15). | ✓ | **nothing was sent — not a prefix, not a truncated burst.** Split the sequence into bursts of at most 64 digits and send the next one once the previous has played (budget roughly 180 ms per digit), or send one digit per keypress as an in-call keypad does. Retrying the same burst unchanged fails identically. |
| `unknown_command` | the server has no handler for that command — normally a client built against a **newer** contract than the deployed server | — | check the server version against your SDK version; the feature isn't deployed. Nothing to retry. |

## Outbound & answering

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `place_call_failed` | the platform refused the outbound call — an undialable or barred destination, a permission the agent doesn't have, or the request timed out | — | show the `message`; check the destination is dialable and the agent may place calls, then retry. |
| `no_agent_leg` | the platform **accepted** the outbound call and then never rang this client back. Sent 10 s after the accept, while the dial is still pending — the agent's leg is being delivered somewhere this client is not. Usual causes: the agent's calls are routed to a different gateway, or the platform's originate failed after it had already answered the request. | — | tell the agent the call did not go through rather than leaving them on "Calling…", and let them retry. If it repeats for one agent and not others, their call routing is the thing to check. |
| `display_as_forbidden` | the chosen caller ID (**display-as** number) is not a service number of the account; sent when an outbound call or a conference invite is rejected for that reason | — | pick another number from `agent.availableNumbers`, or have an admin assign a Display-As number to the agent. See [Troubleshooting → Calls & ringing](../guides/troubleshooting#calls--ringing). |
| `agent_not_available` | the platform refused to place a call because the agent's line is **blocked**, or their presence is not Available | — | check `agent.lineBlocked` and call `resetLineStatus()`, or set an Available presence, then retry. The [three availability fields](../concepts/state-and-events#consuming-it) say which one you're looking at. |
| `hangup_failed` | the agent hung up and the platform did not accept the end request (`PUT /api/v2/agent/calls/{id}/end` was refused, or never reached it). **The call is over regardless** — the media leg is torn down either way — so this reports how it ended, not that it is still up. What it costs is the **post-call survey**: that request is the platform's only route to one, so a request that did not land guarantees no survey was offered to the caller. | ✓ | do not re-send `hangup` and do not re-render the call as live; the state update that removes it is already on its way. Show the `message` (the platform's own reason) and treat a repeat as a deployment problem: while this code is quiet, a missing survey is the account's configuration, and while it is firing, it is not. |
| `answer_failed` | the SDP answer you sent could not be applied to the ringing call's media leg | ✓ | the media leg is unusable — hang up rather than leaving a half-answered call on screen, and check the client's microphone/WebRTC setup. |

## Transfer & conference

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `transfer_failed` | the transfer could not be started — the platform rejected a blind transfer to an application/queue target, or the consultation used to hand an agent/number target over could not be set up | ✓ | **the agent still has the original call**; the caller may have been parked on hold — re-render from the `conferences` state and unhold if needed. Then let them retry or choose another target. |
| `transfer_target_no_answer` | a cold transfer's target **rang and did not answer** (the platform reported `no-answer`/`timeout` on the invite leg). The caller has already been taken off hold and stays with the agent. | ✓ | not fatal, and not a lost call — tell the agent the colleague did not pick up; they can try again or choose another target. |
| `transfer_target_unreachable` | a cold transfer's target **could not be reached** — not logged in, not registered, or the number is not routable (the platform reported `unreachable`, `network-unreachable`, `unallocated-number` or `invalid-number`). The caller stays with the agent. | ✓ | tell the agent that colleague is not there — retrying the same target will fail the same way; pick another. |
| `transfer_target_busy` | a cold transfer's target is **busy**. The caller stays with the agent. | ✓ | tell the agent the colleague is on another call; try later or choose another target. |
| `transfer_target_declined` | a cold transfer's target **declined** the call. The caller stays with the agent. | ✓ | tell the agent the colleague declined; choose another target. |
| `transfer_target_unavailable` | a cold transfer's target **cannot take the call** — the platform refused the invite because that agent's line status is not Available (wrap-up included), so no leg was ever originated and the target was never rung. The caller was parked while the transfer was set up and has already been taken off hold; they stay with the agent. | ✓ | tell the agent the colleague cannot take a call right now — retrying the same target fails the same way until their status changes; pick another target or try later. |
| `transfer_rejected` | a cold transfer's target did not join and the platform named **no reason** the four `transfer_target_*` outcome codes above carry (or none at all). The caller has already been taken off hold and stays with the agent. | ✓ | not fatal, and not a lost call — tell the agent the transfer didn't go through and leave them on it. Branch on the specific `transfer_target_*` codes first; this is the fallback. |
| `no_conference` | a **warm** (attended) transfer was requested while the agent has no live conference — the target must be added and answer first | ✓ | `addConferenceMember` the target, wait for them to join, then complete the warm transfer. |
| `conference_failed` | a conference operation reached the platform and failed — starting one, inviting a member, a per-member hold/unhold/mute/unmute/kick, or ending the conference | — | show the `message` and re-render from `conferences` in the `AgentView`, which is authoritative — don't assume the operation half-applied. |
| `call_on_another_window` | the named call is the agent's, but another of their open windows answered it and holds the media backend. Sent for the call-scoped commands that need that backend — today hangup and mute. | yes — it echoes the `callId` you sent | tell the agent which window has the call, or offer to take it over there. Do not retry: this session will not hold that call unless it takes it over. |
| `no_caller_id` | an invite to an **external** number needs a caller ID and none could be resolved: the invite carried no display-as and the agent has no outbound number selected | — | select an outbound number (`setDisplayAs`, from `agent.availableNumbers`) or pass an explicit display-as on the invite, then retry. Invites to agents and internal extensions never need one. |

## Recording

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `start_recording_failed` | the platform refused to start a recording on the active call | ✓ | show the `message`; gate the control on `agent.canRecord` so the agent isn't offered an action the account doesn't allow. |
| `stop_recording_failed` | stopping the active recording failed | ✓ | the recording may still be running — re-render from `call.recording` rather than flipping the button locally. |
| `flag_recording_failed` | flagging the active recording failed | ✓ | show the `message` and let the agent retry; the flag state comes back on the call patch. |
| `set_recording_tags_failed` | applying tags to the active recording failed | ✓ | show the `message`; keep the tag editor open so the selection isn't lost. |
| `not_recording` | a flag or tag command arrived while the call has **no active recording** | ✓ | start a recording first, and gate the flag/tag controls on `call.recordingId` being set. |

## Campaigns

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `join_campaign_failed` | joining a campaign failed. The server then leaves again best-effort and resets `campaignStatus` to `OFFLINE`, so the agent is never left half-joined. | — | the agent is **out** of the campaign — show the `message` and let them retry the join. |
| `leave_campaign_failed` | leaving the current campaign failed | — | `campaignStatus` is unchanged, so the agent is still in the campaign. Retry; don't render them as left. |
| `pause_campaign_failed` | pausing or resuming the campaign failed | — | show the `message` and re-render the pause toggle from `campaignStatus.paused`, not from the click. |
| `end_campaign_call_failed` | ending the live campaign call failed | — | show the `message`; the call is still up. A generic `hangup` is not an equivalent fallback — it doesn't drive the campaign's own state. |
| `dispose_call_failed` | submitting a call disposition failed. `campaignStatus` is deliberately **not** touched. | — | keep the disposition form open and let the agent retry — pausing the campaign first is the usual pattern, so the next lead doesn't arrive mid-retry. |

## SMS & conversations

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `send_sms_failed` | the platform refused the outbound message — a bad or unreachable recipient, or no sending number available | — | show the `message` and keep the composed text; nothing was sent. |
| `set_conversation_open_failed` | opening or resolving a conversation failed | — | the conversation's `open` flag is unchanged in the view — re-render from state rather than flipping it locally. |

## Presence & agent settings

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `set_presence_failed` | the platform refused the presence change — usually a presence name that isn't in `agent.presenceOptions` | — | drive the selector from `presenceOptions` rather than hard-coded names, and re-render from `presenceName` after the failure. |
| `set_webrtc_failed` | enabling or disabling the in-browser phone failed | — | `agent.webrtcEnabled` is unchanged; re-render the device selector from it. Leaving the toggle flipped locally would lie about where calls ring. |
| `set_agent_number_failed` | setting the agent's external phone number failed — commonly a number the platform won't accept | — | show the `message` and keep the field editable; `agent.number` still holds the old value. |
| `reset_line_status_failed` | clearing an **involuntary** line block failed; `agent.lineBlocked` stays `true` | — | keep the banner up and let the agent retry — never hide it locally on a failed reset. See [A line-blocked banner](../guides/recipes#a-line-blocked-banner). |
| `wrap_up_extend_capped` | the platform **refused** to extend after-call work on policy grounds, and said which: the extension allowance for this call is used up, less time is left than was asked for, or extensions are not enabled for this call's direction | — | `message` is **not a sentence** here: it carries the seconds this call may still be extended by, in decimal, and telling the three refusals apart is what it is for — a positive number when less is left than was asked for (offer that shorter extension), `0` when the allowance is used up, and **empty** when extending is not enabled for this call at all. Write the wording in your own UI, in your user's language; there is nothing to retry unchanged. |
| `wrap_up_not_extended` | the platform **accepted** the request to extend after-call work and extended nothing: it has no wrap-up on record to add time to. A 2xx, and its `message` reads like a success — only the absent wrap-up says otherwise | — | `message` is **empty**: there is no number and no platform reason to carry. Write the whole sentence in your own UI, in your user's language. The countdown in `wrapUp` is untouched and keeps running — this is not the wrap-up ending, and nothing was spent, so the same request may be worth one retry. Distinct from `wrap_up_extend_capped`, which always names a policy the platform applied |
| `wrap_up_extend_failed` | extending after-call work did not succeed — the platform did not accept the request, or it never reached it. A refusal on policy grounds carries `wrap_up_extend_capped` instead | — | show the `message`: it is the platform's own reason where it gave one, and a plain sentence from the server where it gave nothing that is one — a 5xx, an unreadable body, no body at all. Never a response body. The countdown in `wrapUp` is authoritative and keeps running. |
| `wrap_up_cancel_failed` | ending after-call work early failed | — | the agent is still in wrap-up; re-render from `wrapUp.active` and let them retry or wait it out. |

## See also

- **[Errors & reconnects](../guides/errors-and-reconnects#1-command-rejections-onerror)** — wiring `onError`,
  plus the SDK-local codes (`disconnected`, `no_media`, `media_answer_failed`, …) that never come from the server.
- **[Troubleshooting](../guides/troubleshooting)** — the same failures indexed by what the agent sees.
- **[Intents reference](../concepts/intents)** — which command produces which of these.
