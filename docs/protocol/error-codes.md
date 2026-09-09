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
- Anything else (`bad_request`, `no_call`, `not_recording`, …) is a **precondition** the server checked
  itself. The command never left the server, and retrying it unchanged fails identically.

In the **`callId?`** column: **✓** = always carries one · **—** = never · *sometimes* = only in the cases named.

## Session & commands

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `bad_request` | a required field was missing or empty — `answerCall` without an SDP, `sendDigits` without digits, a transfer with no target, `sendSms` without `to`/`text`, a conversation command without a conversation id, `addConferenceMember` without an agent or number, a member action without a member id, `setPresence` without a name, `setAgentNumber` without a number, `joinCampaign` without a campaign id, `disposeCall` without a code | *sometimes* — when the command targets the active call (answer, digits, transfer) | fix the arguments. Nothing was sent onward and nothing changed; a blind retry fails the same way. |
| `no_call` | the command acts on the agent's active call and there is none — or the `callId` you sent doesn't match the one that is live. Covers answer, hangup, mute, hold, digits, transfer, all four recording commands, and the conference commands that need a live call (start, add member, leave). | *sometimes* — it echoes the `callId` you sent; the conference commands send it empty | the call ended, or you raced the stream. Re-read `activeCalls` from your cached `AgentView` and re-derive the button state instead of retrying. |
| `unknown_command` | the server has no handler for that command — normally a client built against a **newer** contract than the deployed server | — | check the server version against your SDK version; the feature isn't deployed. Nothing to retry. |

## Outbound & answering

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `place_call_failed` | the platform refused the outbound call — an undialable or barred destination, a permission the agent doesn't have, or the request timed out | — | show the `message`; check the destination is dialable and the agent may place calls, then retry. |
| `display_as_forbidden` | the chosen caller ID (**display-as** number) is not a service number of the account; sent when an outbound call or a conference invite is rejected for that reason | — | pick another number from `agent.availableNumbers`, or have an admin assign a Display-As number to the agent. See [Troubleshooting → Calls & ringing](../guides/troubleshooting#calls--ringing). |
| `agent_not_available` | the platform refused to place a call because the agent's line is **blocked**, or their presence is not Available | — | check `agent.lineBlocked` and call `resetLineStatus()`, or set an Available presence, then retry. The [three availability fields](../concepts/state-and-events#consuming-it) say which one you're looking at. |
| `answer_failed` | the SDP answer you sent could not be applied to the ringing call's media leg | ✓ | the media leg is unusable — hang up rather than leaving a half-answered call on screen, and check the client's microphone/WebRTC setup. |

## Transfer & conference

| `code` | When it is sent | `callId`? | What to do |
|---|---|---|---|
| `transfer_failed` | the transfer could not be started — the platform rejected a blind transfer to an application/queue target, or the consultation used to hand an agent/number target over could not be set up | ✓ | **the agent still has the original call**; the caller may have been parked on hold — re-render from the `conferences` state and unhold if needed. Then let them retry or choose another target. |
| `transfer_rejected` | a cold transfer's target did not answer or declined. The caller has already been taken off hold and stays with the agent. | ✓ | not fatal, and not a lost call — tell the agent the transfer didn't go through and leave them on it. |
| `no_conference` | a **warm** (attended) transfer was requested while the agent has no live conference — the target must be added and answer first | ✓ | `addConferenceMember` the target, wait for them to join, then complete the warm transfer. |
| `conference_failed` | a conference operation reached the platform and failed — starting one, inviting a member, a per-member hold/unhold/mute/unmute/kick, or ending the conference | — | show the `message` and re-render from `conferences` in the `AgentView`, which is authoritative — don't assume the operation half-applied. |
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
| `wrap_up_extend_failed` | extending after-call work failed, for example when the account's extension cap is reached | — | show the `message`; the countdown in `wrapUp` is authoritative and keeps running. |
| `wrap_up_cancel_failed` | ending after-call work early failed | — | the agent is still in wrap-up; re-render from `wrapUp.active` and let them retry or wait it out. |

## See also

- **[Errors & reconnects](../guides/errors-and-reconnects#1-command-rejections-onerror)** — wiring `onError`,
  plus the SDK-local codes (`disconnected`, `no_media`, `media_answer_failed`, …) that never come from the server.
- **[Troubleshooting](../guides/troubleshooting)** — the same failures indexed by what the agent sees.
- **[Intents reference](../concepts/intents)** — which command produces which of these.
