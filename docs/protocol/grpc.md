---
title: gRPC / proto contract
sidebar_label: gRPC / proto
description: The babelconnect.v1 gRPC contract — every message, enum, and the Agent service.
---

The generated reference for the **`babelconnect.v1`** gRPC contract: every message, enum, and the
`Agent` service. Both the TypeScript and Go SDKs re-export these exact types, so this doubles as the
canonical data-model reference (`AgentView`, `CallState`, `Command`, …).

> **Where to start.** You'll normally use an [SDK](../intro) rather than read this end-to-end. The three
> types to anchor on are [`AgentView`](#babelconnect-v1-AgentView) (the state you render),
> [`Command`](#babelconnect-v1-Command) (the intents you send), and the
> [`Agent`](#babelconnect-v1-Agent) service (the RPCs). For the model in prose, read
> [State & events](../concepts/state-and-events) and the [Intents reference](../concepts/intents); this page
> is the exhaustive field-level reference behind them.

## Table of Contents

- [babelconnect/v1/babelconnect.proto](#babelconnect_v1_babelconnect-proto)
    - [Account](#babelconnect-v1-Account)
    - [Ack](#babelconnect-v1-Ack)
    - [AddConferenceMember](#babelconnect-v1-AddConferenceMember)
    - [AgentInfo](#babelconnect-v1-AgentInfo)
    - [AgentView](#babelconnect-v1-AgentView)
    - [AnswerCall](#babelconnect-v1-AnswerCall)
    - [AppConfig](#babelconnect-v1-AppConfig)
    - [AuthenticateRequest](#babelconnect-v1-AuthenticateRequest)
    - [CallRecord](#babelconnect-v1-CallRecord)
    - [CallState](#babelconnect-v1-CallState)
    - [Campaign](#babelconnect-v1-Campaign)
    - [CampaignMetrics](#babelconnect-v1-CampaignMetrics)
    - [CampaignStatus](#babelconnect-v1-CampaignStatus)
    - [Command](#babelconnect-v1-Command)
    - [Conference](#babelconnect-v1-Conference)
    - [ConferenceMember](#babelconnect-v1-ConferenceMember)
    - [DisposeCall](#babelconnect-v1-DisposeCall)
    - [EndCampaignCall](#babelconnect-v1-EndCampaignCall)
    - [EndConference](#babelconnect-v1-EndConference)
    - [Error](#babelconnect-v1-Error)
    - [FeatureAccount](#babelconnect-v1-FeatureAccount)
    - [FeatureCalls](#babelconnect-v1-FeatureCalls)
    - [FeatureCti](#babelconnect-v1-FeatureCti)
    - [FeatureHistory](#babelconnect-v1-FeatureHistory)
    - [FeatureMessaging](#babelconnect-v1-FeatureMessaging)
    - [FeatureOutbound](#babelconnect-v1-FeatureOutbound)
    - [FeaturePhonebook](#babelconnect-v1-FeaturePhonebook)
    - [FlagRecording](#babelconnect-v1-FlagRecording)
    - [GetStateRequest](#babelconnect-v1-GetStateRequest)
    - [Hangup](#babelconnect-v1-Hangup)
    - [HistoryRequest](#babelconnect-v1-HistoryRequest)
    - [HistoryResponse](#babelconnect-v1-HistoryResponse)
    - [Hold](#babelconnect-v1-Hold)
    - [HoldConferenceMember](#babelconnect-v1-HoldConferenceMember)
    - [IceServer](#babelconnect-v1-IceServer)
    - [Identity](#babelconnect-v1-Identity)
    - [JoinCampaign](#babelconnect-v1-JoinCampaign)
    - [Keepalive](#babelconnect-v1-Keepalive)
    - [KickConferenceMember](#babelconnect-v1-KickConferenceMember)
    - [Lead](#babelconnect-v1-Lead)
    - [Lead.DataEntry](#babelconnect-v1-Lead-DataEntry)
    - [LeaveCampaign](#babelconnect-v1-LeaveCampaign)
    - [LeaveConference](#babelconnect-v1-LeaveConference)
    - [ListCampaignsRequest](#babelconnect-v1-ListCampaignsRequest)
    - [ListCampaignsResponse](#babelconnect-v1-ListCampaignsResponse)
    - [ListDispositionsRequest](#babelconnect-v1-ListDispositionsRequest)
    - [ListDispositionsResponse](#babelconnect-v1-ListDispositionsResponse)
    - [MarkConversationRead](#babelconnect-v1-MarkConversationRead)
    - [Mute](#babelconnect-v1-Mute)
    - [MuteConferenceMember](#babelconnect-v1-MuteConferenceMember)
    - [Notification](#babelconnect-v1-Notification)
    - [Patch](#babelconnect-v1-Patch)
    - [PauseCampaign](#babelconnect-v1-PauseCampaign)
    - [PhonebookEntry](#babelconnect-v1-PhonebookEntry)
    - [PhonebookRequest](#babelconnect-v1-PhonebookRequest)
    - [PhonebookResponse](#babelconnect-v1-PhonebookResponse)
    - [Ping](#babelconnect-v1-Ping)
    - [PlaceCall](#babelconnect-v1-PlaceCall)
    - [PlaceCall.SessionEntry](#babelconnect-v1-PlaceCall-SessionEntry)
    - [Pong](#babelconnect-v1-Pong)
    - [PresenceOption](#babelconnect-v1-PresenceOption)
    - [Register](#babelconnect-v1-Register)
    - [ResetLineStatus](#babelconnect-v1-ResetLineStatus)
    - [SendDigits](#babelconnect-v1-SendDigits)
    - [SendSmsRequest](#babelconnect-v1-SendSmsRequest)
    - [SendSmsRequest.SessionEntry](#babelconnect-v1-SendSmsRequest-SessionEntry)
    - [SetAgentNumber](#babelconnect-v1-SetAgentNumber)
    - [SetConversationOpen](#babelconnect-v1-SetConversationOpen)
    - [SetDisplayAs](#babelconnect-v1-SetDisplayAs)
    - [SetPresence](#babelconnect-v1-SetPresence)
    - [SetRecordingTags](#babelconnect-v1-SetRecordingTags)
    - [SetWebrtc](#babelconnect-v1-SetWebrtc)
    - [SmsConversation](#babelconnect-v1-SmsConversation)
    - [SmsMessage](#babelconnect-v1-SmsMessage)
    - [SmsThreadRequest](#babelconnect-v1-SmsThreadRequest)
    - [SmsThreadResponse](#babelconnect-v1-SmsThreadResponse)
    - [StartConference](#babelconnect-v1-StartConference)
    - [StartRecording](#babelconnect-v1-StartRecording)
    - [StateUpdate](#babelconnect-v1-StateUpdate)
    - [StopRecording](#babelconnect-v1-StopRecording)
    - [SubscribeRequest](#babelconnect-v1-SubscribeRequest)
    - [Transfer](#babelconnect-v1-Transfer)
    - [TransferTarget](#babelconnect-v1-TransferTarget)
    - [TransferTargetsRequest](#babelconnect-v1-TransferTargetsRequest)
    - [TransferTargetsResponse](#babelconnect-v1-TransferTargetsResponse)
    - [WrapUpCancel](#babelconnect-v1-WrapUpCancel)
    - [WrapUpExtend](#babelconnect-v1-WrapUpExtend)
    - [WrapUpStatus](#babelconnect-v1-WrapUpStatus)
  
    - [AgentState](#babelconnect-v1-AgentState)
    - [CallDirection](#babelconnect-v1-CallDirection)
    - [CallLifecycle](#babelconnect-v1-CallLifecycle)
    - [CallSource](#babelconnect-v1-CallSource)
    - [CampaignMemberState](#babelconnect-v1-CampaignMemberState)
    - [TransferTargetKind](#babelconnect-v1-TransferTargetKind)
  
    - [Agent](#babelconnect-v1-Agent)
  
- [Scalar Value Types](#scalar-value-types)




## babelconnect/v1/babelconnect.proto {#babelconnect_v1_babelconnect-proto}




### Account {#babelconnect-v1-Account}
Account is one tenant the signed-in agent can operate in — the switchable set
(agent-role only) surfaced for the account picker.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | customer / account id |
| name | [string](#scalar-value-types) |  | company / display name |
| current | [bool](#scalar-value-types) |  | the account this session is currently scoped to |







### Ack {#babelconnect-v1-Ack}
Ack is the empty reply to Send. It only confirms the server accepted the
command for processing — the resulting state (or an Error) is delivered on the
Subscribe stream, never in this reply.







### AddConferenceMember {#babelconnect-v1-AddConferenceMember}
AddConferenceMember invites a participant — exactly one of agent_id / number.
Starts a conference first if none is active. `hold_others` parks every other
live, non-held member of the CURRENT conference before the invite goes out
(default off) so they don&#39;t overhear the new invitee ringing; the server
unholds them again once the invitee reaches a terminal state (added =
joined, or failed/removed = rejected/timed out). No effect when starting a
brand-new conference: StartConference(hold=true) already parks the original
party unconditionally in that case.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| agent_id | [string](#scalar-value-types) |  |  |
| number | [string](#scalar-value-types) |  |  |
| hold_others | [bool](#scalar-value-types) |  |  |







### AgentInfo {#babelconnect-v1-AgentInfo}
AgentInfo is the agent block of the view (identity &#43; live presence &#43; caps).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | Agent UUID (hyphen-normalized) |
| name | [string](#scalar-value-types) |  |  |
| number | [string](#scalar-value-types) |  |  |
| presence | [AgentState](#babelconnect-v1-AgentState) |  |  |
| webrtc_enabled | [bool](#scalar-value-types) |  |  |
| display_as | [string](#scalar-value-types) |  | currently selected outbound number |
| available_numbers | [string](#scalar-value-types) | repeated |  |
| can_record | [bool](#scalar-value-types) |  |  |
| presence_options | [PresenceOption](#babelconnect-v1-PresenceOption) | repeated | Presence selector: the options the agent may switch to (AVAILABLE plus any configured pause reasons), and the current presence&#39;s exact name&#43;label. The `presence` enum above stays the coarse bucket for icons/colors; these carry the precise presence name&#43;label the client renders &#43; selects. |
| presence_name | [string](#scalar-value-types) |  | current presence name, e.g. &#34;available&#34;, &#34;break&#34; |
| presence_label | [string](#scalar-value-types) |  | current presence label, e.g. &#34;Available&#34;, &#34;Break&#34; |
| available_tags | [string](#scalar-value-types) | repeated | recording tags the agent may apply |
| phonebook | [PhonebookEntry](#babelconnect-v1-PhonebookEntry) | repeated | dial-from contacts &#43; recent numbers |
| always_record_outbound | [bool](#scalar-value-types) |  | account records every outbound automatically |
| username | [string](#scalar-value-types) |  | Identity for the shell/Status surface (resolved at auth, no extra fetch).

login / email |
| account_id | [string](#scalar-value-types) |  | customer / account id |
| account_name | [string](#scalar-value-types) |  | account / company display name, when known |
| line_blocked | [bool](#scalar-value-types) |  | Involuntary line block: the ACD/platform marked the agent busy / unreachable / declined (a recoverable state cleared via ResetLineStatus) — distinct from a chosen &#34;busy&#34; presence the agent (or sign-out-as-busy) selected. Drives the line-blocked banner &#43; Reset; a voluntary busy presence leaves this false. |
| accounts | [Account](#babelconnect-v1-Account) | repeated | Accounts this agent may switch to without re-logging-in (agent-role only, resolved at auth). One is marked `current`. Drives the Account tab&#39;s switcher; empty/single ⇒ no picker. |
| email | [string](#scalar-value-types) |  | The agent&#39;s own email — distinct from `username`, which is the *login* identity and may differ. Populated for the embedding bridge&#39;s legacy-shaped `agent.loaded` payload so host pages can match/route on it. |
| sms_capable_numbers | [string](#scalar-value-types) | repeated | Subset of `available_numbers` the platform marks SMS-capable. Drives the SMS composer&#39;s From picker; empty/unknown ⇒ client falls back to `available_numbers`. |
| campaign_status | [CampaignStatus](#babelconnect-v1-CampaignStatus) |  | Outbound-dialer (predictive campaign) membership state, kept live by the server. Unset/UNSPECIFIED means the agent has never touched a campaign this session; explicit OFFLINE means they left/aren&#39;t in one. |







### AgentView {#babelconnect-v1-AgentView}
AgentView is the complete per-agent state the server owns and renders to. A
snapshot carries the whole view; patches carry entity-level deltas.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| agent | [AgentInfo](#babelconnect-v1-AgentInfo) |  |  |
| active_calls | [CallState](#babelconnect-v1-CallState) | repeated | calls currently in flight for this agent |
| wrap_up | [WrapUpStatus](#babelconnect-v1-WrapUpStatus) |  |  |
| sms | [SmsConversation](#babelconnect-v1-SmsConversation) | repeated | SMS thread summaries (full history on demand) |
| conferences | [Conference](#babelconnect-v1-Conference) | repeated | active multi-party conferences (usually 0 or 1) |
| config | [AppConfig](#babelconnect-v1-AppConfig) |  | which surfaces this deployment/account shows |







### AnswerCall {#babelconnect-v1-AnswerCall}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  | the RINGING call&#39;s id |
| sdp | [string](#scalar-value-types) |  | WebRTC SDP answer |







### AppConfig {#babelconnect-v1-AppConfig}
AppConfig is the server-resolved, per-agent feature configuration the client
renders against (UI = f(view)): which surfaces are shown and their per-feature
settings. Resolved server-side per deployment &#43; account, so the client is a
pure renderer. Carried on the snapshot (no patch) — config applies on next connect.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| calls | [FeatureCalls](#babelconnect-v1-FeatureCalls) |  |  |
| messaging | [FeatureMessaging](#babelconnect-v1-FeatureMessaging) |  |  |
| history | [FeatureHistory](#babelconnect-v1-FeatureHistory) |  |  |
| account | [FeatureAccount](#babelconnect-v1-FeatureAccount) |  |  |
| outbound | [FeatureOutbound](#babelconnect-v1-FeatureOutbound) |  |  |
| cti | [FeatureCti](#babelconnect-v1-FeatureCti) |  |  |
| phonebook | [FeaturePhonebook](#babelconnect-v1-FeaturePhonebook) |  | Contacts (phonebook) tab |
| server_version | [string](#scalar-value-types) |  | build version for the Status/About surface; reserve 8–14 |







### AuthenticateRequest {#babelconnect-v1-AuthenticateRequest}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| token | [string](#scalar-value-types) |  | Optional: token may instead be supplied via &#34;authorization&#34; metadata. |







### CallRecord {#babelconnect-v1-CallRecord}
CallRecord is one past call for the history list (a flattened conversation).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  |  |
| direction | [CallDirection](#babelconnect-v1-CallDirection) |  |  |
| from | [string](#scalar-value-types) |  |  |
| to | [string](#scalar-value-types) |  |  |
| contact | [string](#scalar-value-types) |  | phonebook label for the other party, if known |
| time | [int64](#scalar-value-types) |  | unix seconds of the call |
| duration_ms | [int32](#scalar-value-types) |  |  |
| has_recording | [bool](#scalar-value-types) |  |  |
| recording_url | [string](#scalar-value-types) |  | playback URL when a recording exists |







### CallState {#babelconnect-v1-CallState}
CallState is one call as the server sees it. Replace-by-id on upsert.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | server call id |
| direction | [CallDirection](#babelconnect-v1-CallDirection) |  |  |
| state | [CallLifecycle](#babelconnect-v1-CallLifecycle) |  |  |
| source | [CallSource](#babelconnect-v1-CallSource) |  |  |
| from | [string](#scalar-value-types) |  |  |
| to | [string](#scalar-value-types) |  |  |
| queue_name | [string](#scalar-value-types) |  |  |
| established_at | [int64](#scalar-value-types) |  | unix seconds when the call bridged (0 until then) |
| muted | [bool](#scalar-value-types) |  |  |
| on_hold | [bool](#scalar-value-types) |  |  |
| recording | [bool](#scalar-value-types) |  |  |
| anonymous | [bool](#scalar-value-types) |  |  |
| webrtc_offer | [string](#scalar-value-types) |  | SDP offer the client answers; set while RINGING |
| recording_id | [string](#scalar-value-types) |  | active recording id (for stop/flag/tags) |
| recording_tags | [string](#scalar-value-types) | repeated |  |
| recording_flagged | [bool](#scalar-value-types) |  |  |
| ice_servers | [IceServer](#babelconnect-v1-IceServer) | repeated | STUN/TURN servers the client applies; for off-host NAT traversal |
| can_transfer_to_application | [bool](#scalar-value-types) |  | can_transfer_to_application is server-computed: true for inbound calls and taken callbacks (source == CALL_SOURCE_CALLBACK), false otherwise. Plain outbound calls must not be offered application (IVR module) transfer targets — forwarding them into a queue module strands the agent (DEV-549/B2-526). Clients gate the &#34;App&#34; transfer-target segment on this flag instead of re-deriving the rule from direction/source themselves. |







### Campaign {#babelconnect-v1-Campaign}
Campaign is one outbound-dialer campaign the agent may join (the picker&#39;s
entries). `test_mode` drives the &#34;name (live)&#34; / &#34;name (test)&#34; label.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  |  |
| name | [string](#scalar-value-types) |  |  |
| test_mode | [bool](#scalar-value-types) |  |  |
| active | [bool](#scalar-value-types) |  |  |







### CampaignMetrics {#babelconnect-v1-CampaignMetrics}
CampaignMetrics is the campaign&#39;s live pacing snapshot — always this exact
6-key subset, never more.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| agents_in_calls | [int32](#scalar-value-types) |  | agents.in_calls |
| agents_in_disp | [int32](#scalar-value-types) |  | agents.in_disp |
| agents_paused | [int32](#scalar-value-types) |  | agents.paused |
| agents_waiting | [int32](#scalar-value-types) |  | agents.waiting |
| calls_being_placed | [int32](#scalar-value-types) |  | calls.being_placed |
| calls_ringing | [int32](#scalar-value-types) |  | calls.ringing |







### CampaignStatus {#babelconnect-v1-CampaignStatus}
CampaignStatus is the agent&#39;s outbound-dialer campaign membership envelope,
kept live by the server. `last_reason` is the platform&#39;s last dial-outcome
as a lowercase string (e.g. &#34;unreachable&#34;, &#34;no_answer&#34;, &#34;busy&#34;, &#34;answer&#34;,
&#34;hungup&#34;, &#34;none&#34;) — a string rather than a wire enum on purpose. `paused`
is a convenience mirror of `state == CAMPAIGN_MEMBER_STATE_IDLE`. The lead
the agent is currently dialing, disposition reasons, and live campaign
metrics are additive fields below, layered on top of this envelope.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| campaign_id | [string](#scalar-value-types) |  |  |
| campaign_name | [string](#scalar-value-types) |  |  |
| state | [CampaignMemberState](#babelconnect-v1-CampaignMemberState) |  |  |
| paused | [bool](#scalar-value-types) |  |  |
| last_reason | [string](#scalar-value-types) |  |  |
| since | [int64](#scalar-value-types) |  | unix seconds this state was entered/last confirmed |
| lead | [Lead](#babelconnect-v1-Lead) |  | lead is the customer the dialer connected the agent to — set while a lead is being worked (IN_PROGRESS/DISPOSITION), unset otherwise. Updated the moment the dialer connects a lead. |
| metrics | [CampaignMetrics](#babelconnect-v1-CampaignMetrics) |  | metrics is the campaign&#39;s live pacing snapshot (OBDD1), refreshed alongside the enrichment read while `state == IDLE` (paused) — the only state the Outbound tab shows it in; unset otherwise (and left unset if the GET /agent/outbound/metrics read 404s, e.g. between polls). |







### Command {#babelconnect-v1-Command}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| register | [Register](#babelconnect-v1-Register) |  | announce reachability for this session |
| place_call | [PlaceCall](#babelconnect-v1-PlaceCall) |  | place an outbound call |
| answer | [AnswerCall](#babelconnect-v1-AnswerCall) |  | SDP answer to a RINGING CallState |
| hangup | [Hangup](#babelconnect-v1-Hangup) |  |  |
| mute | [Mute](#babelconnect-v1-Mute) |  |  |
| hold | [Hold](#babelconnect-v1-Hold) |  |  |
| dtmf | [SendDigits](#babelconnect-v1-SendDigits) |  |  |
| set_display_as | [SetDisplayAs](#babelconnect-v1-SetDisplayAs) |  |  |
| transfer | [Transfer](#babelconnect-v1-Transfer) |  |  |
| set_presence | [SetPresence](#babelconnect-v1-SetPresence) |  | switch the agent&#39;s presence (selector) |
| wrap_up_extend | [WrapUpExtend](#babelconnect-v1-WrapUpExtend) |  | add time to the after-call-work countdown |
| wrap_up_cancel | [WrapUpCancel](#babelconnect-v1-WrapUpCancel) |  | end after-call-work early |
| reset_line_status | [ResetLineStatus](#babelconnect-v1-ResetLineStatus) |  | clear a blocked line (busy/unreachable) |
| start_recording | [StartRecording](#babelconnect-v1-StartRecording) |  |  |
| stop_recording | [StopRecording](#babelconnect-v1-StopRecording) |  |  |
| flag_recording | [FlagRecording](#babelconnect-v1-FlagRecording) |  | toggle the &#34;flagged&#34; tag on the recording |
| set_recording_tags | [SetRecordingTags](#babelconnect-v1-SetRecordingTags) |  |  |
| set_webrtc | [SetWebrtc](#babelconnect-v1-SetWebrtc) |  | browser phone (webrtc) on/off |
| set_agent_number | [SetAgentNumber](#babelconnect-v1-SetAgentNumber) |  | the external-telephone number to bridge to |
| send_sms | [SendSmsRequest](#babelconnect-v1-SendSmsRequest) |  | send an SMS (same as the SendSms RPC) |
| start_conference | [StartConference](#babelconnect-v1-StartConference) |  | open a conference around the current call |
| add_conference_member | [AddConferenceMember](#babelconnect-v1-AddConferenceMember) |  | invite an agent or number |
| kick_conference_member | [KickConferenceMember](#babelconnect-v1-KickConferenceMember) |  | moderator removes a member |
| end_conference | [EndConference](#babelconnect-v1-EndConference) |  | moderator ends the whole conference |
| leave_conference | [LeaveConference](#babelconnect-v1-LeaveConference) |  | hang up only my own leg |
| hold_conference_member | [HoldConferenceMember](#babelconnect-v1-HoldConferenceMember) |  | moderator holds/unholds a member |
| mute_conference_member | [MuteConferenceMember](#babelconnect-v1-MuteConferenceMember) |  | moderator mutes/unmutes a member |
| set_conversation_open | [SetConversationOpen](#babelconnect-v1-SetConversationOpen) |  | open/close (resolve) an SMS conversation |
| mark_conversation_read | [MarkConversationRead](#babelconnect-v1-MarkConversationRead) |  | clear unread on an SMS conversation |
| pong | [Pong](#babelconnect-v1-Pong) |  | reply to a server Ping (liveness &#43; RTT); echoes Ping.seq |
| join_campaign | [JoinCampaign](#babelconnect-v1-JoinCampaign) |  | Outbound-dialer campaign controls (OBDA1–3 CORE).

enter a campaign (the picker&#39;s &#34;Enter&#34;) |
| leave_campaign | [LeaveCampaign](#babelconnect-v1-LeaveCampaign) |  | leave the campaign (selector row or in-call) |
| pause_campaign | [PauseCampaign](#babelconnect-v1-PauseCampaign) |  | pause (on=true) / resume (on=false) the campaign |
| end_campaign_call | [EndCampaignCall](#babelconnect-v1-EndCampaignCall) |  | Outbound-dialer call/disposition controls (OBDB2/OBDC1/OBDC2 follow-up).

end the live campaign call (OBDB2) |
| dispose_call | [DisposeCall](#babelconnect-v1-DisposeCall) |  | record the call outcome, optionally with a callback (OBDC1/OBDC2) |







### Conference {#babelconnect-v1-Conference}
Conference is one multi-party call the agent is in. The server folds multi-party
call updates into this entity and emits conference_upsert/remove patches. The
client is a dumb renderer that shows the participant panel and sends conference
intents. Usually 0 or 1 per agent. Upsert-by-id; removed when the conference
finishes or the agent&#39;s own member leaves.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | conference id |
| state | [string](#scalar-value-types) |  | created|finishing|finished |
| members | [ConferenceMember](#babelconnect-v1-ConferenceMember) | repeated | all members incl. the moderator and me |
| i_am_moderator | [bool](#scalar-value-types) |  | resolved server-side: is this agent the moderator? |
| my_member_id | [string](#scalar-value-types) |  | the agent&#39;s own member id (used for Leave) |







### ConferenceMember {#babelconnect-v1-ConferenceMember}
ConferenceMember is one participant. `display` is the resolved label (agent
name, else the caller/dialed number, else &#34;Anonymous&#34;). `state` drives the UI:
pending = ringing, added = live, removing/removed/failed = gone (clients filter
removed/failed out of the participant list).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | member id |
| state | [string](#scalar-value-types) |  | pending|added|removing|removed|failed |
| display | [string](#scalar-value-types) |  | resolved participant label |
| moderator | [bool](#scalar-value-types) |  | this member is the conference moderator |
| is_me | [bool](#scalar-value-types) |  | this member is the current agent |
| call_id | [string](#scalar-value-types) |  | the member&#39;s call leg id |
| on_hold | [bool](#scalar-value-types) |  | member is on hold |
| agent_id | [string](#scalar-value-types) |  | agent UUID when the member is an agent |
| number | [string](#scalar-value-types) |  | phone number when the member is an external party |







### DisposeCall {#babelconnect-v1-DisposeCall}
DisposeCall records the outcome of a campaign call. `code` is one of
ListDispositionsResponse&#39;s codes (e.g. &#34;no_answer&#34;, &#34;callback&#34;).
`callback_date` is ISO `YYYY-MM-DDTHH:mmZZ` and is set ONLY for the
&#34;callback&#34; disposition — omitted (empty) otherwise.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| code | [string](#scalar-value-types) |  |  |
| callback_date | [string](#scalar-value-types) |  |  |







### EndCampaignCall {#babelconnect-v1-EndCampaignCall}
EndCampaignCall ends the agent&#39;s live campaign call. Deliberately distinct
from the generic Hangup: it also releases the dialer&#39;s channel and drives
the campaign member-state transition to DISPOSITION, neither of which a
plain media-plane hangup would trigger.







### EndConference {#babelconnect-v1-EndConference}
EndConference tears down the whole conference (moderator only).







### Error {#babelconnect-v1-Error}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| code | [string](#scalar-value-types) |  |  |
| message | [string](#scalar-value-types) |  |  |
| call_id | [string](#scalar-value-types) |  | optional: the call the rejected command targeted |







### FeatureAccount {#babelconnect-v1-FeatureAccount}
FeatureAccount gates the Account tab and its sections.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |
| allow_device_switch | [bool](#scalar-value-types) |  | browser/telephone selector &#43; agent-number field |
| show_status | [bool](#scalar-value-types) |  | the Status/About section |
| allow_account_switch | [bool](#scalar-value-types) |  | the multi-account switcher (ACC-E2) |
| allow_status_change | [bool](#scalar-value-types) |  | Agents may change their own presence via the status picker. When false the picker is locked: still visible, shows the current status, but not interactive. Defaults to allowed. |







### FeatureCalls {#babelconnect-v1-FeatureCalls}
FeatureCalls gates the call surface (Phone tab) and its in-call actions.
Recording stays gated by AgentInfo.can_record (not duplicated here); device
(browser/telephone) by AgentInfo.webrtc_enabled.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |
| allow_transfer | [bool](#scalar-value-types) |  | cold transfer action |
| allow_conference | [bool](#scalar-value-types) |  | conference action (own bucket later when that surface lands) |







### FeatureCti {#babelconnect-v1-FeatureCti}
FeatureCti gates CTI/integration behavior (screen-pop &#43; app→host call events).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |
| emit_call_events | [bool](#scalar-value-types) |  | emit cti.call to an embedding host on each transition |
| screen_pop | [bool](#scalar-value-types) |  | surface screen-pop notifications |







### FeatureHistory {#babelconnect-v1-FeatureHistory}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |







### FeatureMessaging {#babelconnect-v1-FeatureMessaging}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |







### FeatureOutbound {#babelconnect-v1-FeatureOutbound}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |







### FeaturePhonebook {#babelconnect-v1-FeaturePhonebook}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| enabled | [bool](#scalar-value-types) |  |  |







### FlagRecording {#babelconnect-v1-FlagRecording}
FlagRecording toggles the &#34;flagged&#34; mark on the call&#39;s active recording.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |







### GetStateRequest {#babelconnect-v1-GetStateRequest}
GetStateRequest fetches the current AgentView (the unary &#34;get current state&#34;).
Empty; the bearer token rides in &#34;authorization&#34; metadata like every call.







### Hangup {#babelconnect-v1-Hangup}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |







### HistoryRequest {#babelconnect-v1-HistoryRequest}
HistoryRequest pages the agent&#39;s call history (newest first).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| max | [int32](#scalar-value-types) |  | page size (default 50) |
| page | [int32](#scalar-value-types) |  | 1-based page (default 1) |







### HistoryResponse {#babelconnect-v1-HistoryResponse}
HistoryResponse is one page of past calls.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| calls | [CallRecord](#babelconnect-v1-CallRecord) | repeated |  |







### Hold {#babelconnect-v1-Hold}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |
| on | [bool](#scalar-value-types) |  |  |







### HoldConferenceMember {#babelconnect-v1-HoldConferenceMember}
HoldConferenceMember holds or unholds an individual member (moderator only).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| member_id | [string](#scalar-value-types) |  |  |
| on | [bool](#scalar-value-types) |  |  |







### IceServer {#babelconnect-v1-IceServer}
IceServer is a STUN/TURN server the client applies to its WebRTC peer
connection (RTCIceServer shape). Carried on CallState so an off-host client
(e.g. a phone) can relay media through TURN when it can&#39;t reach the server&#39;s
host ICE candidates. Empty in the in-cluster/LAN case.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| urls | [string](#scalar-value-types) | repeated | e.g. [&#34;turn:host:3478?transport=tcp&#34;] |
| username | [string](#scalar-value-types) |  |  |
| credential | [string](#scalar-value-types) |  |  |







### Identity {#babelconnect-v1-Identity}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| agent_id | [string](#scalar-value-types) |  | Agent UUID, hyphen-normalized |
| account | [string](#scalar-value-types) |  | customer / account id |
| number | [string](#scalar-value-types) |  | agent&#39;s number, if any |
| username | [string](#scalar-value-types) |  |  |
| state | [AgentState](#babelconnect-v1-AgentState) |  | current presence |
| account_name | [string](#scalar-value-types) |  | account / company display name, when known (ACC-E1) |
| accounts | [Account](#babelconnect-v1-Account) | repeated | accounts this agent may switch to (ACC-E2) |







### JoinCampaign {#babelconnect-v1-JoinCampaign}
JoinCampaign enters a campaign. The client normally sends `paused` false so
the agent starts `waiting` for a lead right away.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| campaign_id | [string](#scalar-value-types) |  |  |
| paused | [bool](#scalar-value-types) |  |  |







### Keepalive {#babelconnect-v1-Keepalive}
Keepalive is an empty heartbeat frame sent on the Subscribe stream so
idle connections through proxies/LBs are not closed as idle. Notably the AWS
Classic ELB in front of ingress-nginx (dev/prod EKS) has a 300s connection
idle timeout; without these frames a quiet agent&#39;s gRPC-web server-stream is
killed after 5 min. The server sends one every ~15s. It carries no state and
does NOT advance `seq`; client caches treat a keepalive StateUpdate as a no-op.







### KickConferenceMember {#babelconnect-v1-KickConferenceMember}
KickConferenceMember removes a member from the conference (moderator only).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| member_id | [string](#scalar-value-types) |  |  |







### Lead {#babelconnect-v1-Lead}
Lead is the customer the outbound dialer connected the agent to. `id`/`rank`
are only present on the richer (list-enriched) form some reads return. `id`
is the internal lead-list-item id — DISTINCT from `uid`, the
customer-provided identifier shown as the lead&#39;s id in the UI.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | internal lead-list-item id (uuid); may be empty |
| uid | [string](#scalar-value-types) |  | customer-provided lead identifier — the UI&#39;s &#34;id&#34; |
| number | [string](#scalar-value-types) |  |  |
| rank | [int32](#scalar-value-types) |  |  |
| data | [Lead.DataEntry](#babelconnect-v1-Lead-DataEntry) | repeated | arbitrary customer-supplied key/values |







### Lead.DataEntry {#babelconnect-v1-Lead-DataEntry}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| key | [string](#scalar-value-types) |  |  |
| value | [string](#scalar-value-types) |  |  |







### LeaveCampaign {#babelconnect-v1-LeaveCampaign}
LeaveCampaign exits the current campaign (the server resolves which one).
Available both from the campaign selector row and from within an active
call.







### LeaveConference {#babelconnect-v1-LeaveConference}
LeaveConference hangs up only the agent&#39;s own leg; the others stay connected.







### ListCampaignsRequest {#babelconnect-v1-ListCampaignsRequest}
ListCampaignsRequest / ListCampaignsResponse back the campaign picker
(OBDA1). Empty request: the server always asks the backend for active
campaigns only (`?active=true`) — there is no agent-facing use for
inactive ones.







### ListCampaignsResponse {#babelconnect-v1-ListCampaignsResponse}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| campaigns | [Campaign](#babelconnect-v1-Campaign) | repeated |  |







### ListDispositionsRequest {#babelconnect-v1-ListDispositionsRequest}
ListDispositionsRequest / ListDispositionsResponse back the disposition
picker (OBDC1). Empty request: the list is a static global on the backend,
not campaign- or agent-scoped.







### ListDispositionsResponse {#babelconnect-v1-ListDispositionsResponse}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| reasons | [string](#scalar-value-types) | repeated | raw codes, e.g. &#34;no_answer&#34;, &#34;callback&#34; |







### MarkConversationRead {#babelconnect-v1-MarkConversationRead}
MarkConversationRead clears the unread count on an SMS conversation (the agent
opened its thread).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| conversation_id | [string](#scalar-value-types) |  |  |







### Mute {#babelconnect-v1-Mute}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |
| on | [bool](#scalar-value-types) |  |  |







### MuteConferenceMember {#babelconnect-v1-MuteConferenceMember}
MuteConferenceMember mutes or unmutes an individual member (moderator only).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| member_id | [string](#scalar-value-types) |  |  |
| on | [bool](#scalar-value-types) |  |  |







### Notification {#babelconnect-v1-Notification}
Notification is a transient one-shot the client surfaces (a CTI screen-pop /
pushed agent data). It is NOT stored in the AgentView snapshot — it fires once.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| kind | [string](#scalar-value-types) |  | e.g. &#34;cti.message&#34; |
| title | [string](#scalar-value-types) |  |  |
| body | [string](#scalar-value-types) |  |  |
| data_json | [string](#scalar-value-types) |  | arbitrary pushed payload, JSON-encoded |
| ts | [int64](#scalar-value-types) |  |  |







### Patch {#babelconnect-v1-Patch}
Patch is an entity-level delta applied mechanically by the client cache:
replace the agent block, upsert/remove a call by id, or set wrap-up.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| agent | [AgentInfo](#babelconnect-v1-AgentInfo) |  |  |
| call_upsert | [CallState](#babelconnect-v1-CallState) |  |  |
| call_remove | [string](#scalar-value-types) |  | call id to drop |
| wrap_up | [WrapUpStatus](#babelconnect-v1-WrapUpStatus) |  |  |
| notification | [Notification](#babelconnect-v1-Notification) |  | transient CTI screen-pop (not part of the view) |
| sms_upsert | [SmsConversation](#babelconnect-v1-SmsConversation) |  | upsert an SMS thread summary by id |
| sms_remove | [string](#scalar-value-types) |  | SMS conversation id to drop |
| conference_upsert | [Conference](#babelconnect-v1-Conference) |  | upsert a conference by id |
| conference_remove | [string](#scalar-value-types) |  | conference id to drop (finished/left) |
| config | [AppConfig](#babelconnect-v1-AppConfig) |  | resolved feature config (emitted on register) |







### PauseCampaign {#babelconnect-v1-PauseCampaign}
PauseCampaign pauses (`on=true`, POST .../pause) or resumes (`on=false`,
POST .../unpause) the campaign — no request body either way (OBDA2), same
on/off shape as Mute/Hold.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| on | [bool](#scalar-value-types) |  |  |







### PhonebookEntry {#babelconnect-v1-PhonebookEntry}
PhonebookEntry is one dialable contact (or a recent number) for the dialer&#39;s
autocomplete.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| label | [string](#scalar-value-types) |  | contact name, or &#34;recent&#34; for a recently dialed number |
| number | [string](#scalar-value-types) |  |  |







### PhonebookRequest {#babelconnect-v1-PhonebookRequest}
PhonebookRequest / PhonebookResponse re-pull the agent&#39;s merged contacts &#43;
recent numbers on demand (refresh). `query` filters by label/number server-side.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| max | [int32](#scalar-value-types) |  | page size (default 200) |
| page | [int32](#scalar-value-types) |  | 1-based page (default 1) |
| query | [string](#scalar-value-types) |  | optional label/number filter |







### PhonebookResponse {#babelconnect-v1-PhonebookResponse}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| entries | [PhonebookEntry](#babelconnect-v1-PhonebookEntry) | repeated |  |







### Ping {#babelconnect-v1-Ping}
Ping is a liveness probe the server sends on the heartbeat tick (replacing the
bare Keepalive frame). The client echoes `seq` back in a Pong command; the server
measures round-trip time (RTT) from the reply and tracks per-session liveness.
Like Keepalive it keeps the connection warm, carries no state, and does NOT
advance `seq` — caches ignore it, and the reply is handled in the client&#39;s stream
loop, not the state reducer. (APP-A5/CALL-M6.)


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| seq | [uint64](#scalar-value-types) |  |  |







### PlaceCall {#babelconnect-v1-PlaceCall}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| to | [string](#scalar-value-types) |  |  |
| display_as_to | [string](#scalar-value-types) |  | service number shown to the consumer |
| display_as_from | [string](#scalar-value-types) |  | number shown to the agent |
| record | [bool](#scalar-value-types) |  | start recording the call from answer (recording.autostart) |
| session | [PlaceCall.SessionEntry](#babelconnect-v1-PlaceCall-SessionEntry) | repeated | opaque CTI/embedding correlation (from session.set) |







### PlaceCall.SessionEntry {#babelconnect-v1-PlaceCall-SessionEntry}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| key | [string](#scalar-value-types) |  |  |
| value | [string](#scalar-value-types) |  |  |







### Pong {#babelconnect-v1-Pong}
Pong replies to a server Ping (StateUpdate.ping), echoing its `seq` so the server
can match it to the outstanding ping and compute RTT. Sent automatically by the
SDK from its stream-receive loop — not a user intent. (APP-A5/CALL-M6.)


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| seq | [uint64](#scalar-value-types) |  |  |







### PresenceOption {#babelconnect-v1-PresenceOption}
PresenceOption is one selectable agent presence — &#34;Available&#34; or a configured
pause reason. `available` is whether the agent can receive calls in it.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#scalar-value-types) |  | e.g. &#34;available&#34;, &#34;break&#34; |
| label | [string](#scalar-value-types) |  | e.g. &#34;Available&#34;, &#34;Break&#34; |
| available | [bool](#scalar-value-types) |  |  |







### Register {#babelconnect-v1-Register}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| capabilities | [string](#scalar-value-types) | repeated | advisory, e.g. [&#34;webrtc&#34;] |







### ResetLineStatus {#babelconnect-v1-ResetLineStatus}
ResetLineStatus clears a blocked line state (busy/unreachable/declined) so the
agent can receive calls again.







### SendDigits {#babelconnect-v1-SendDigits}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |
| digits | [string](#scalar-value-types) |  | DTMF, e.g. &#34;1&#34;, &#34;#&#34; |







### SendSmsRequest {#babelconnect-v1-SendSmsRequest}
SendSmsRequest sends an SMS. `from` defaults to the agent&#39;s SMS-capable number
when empty. `session` carries opaque
CTI/embedding correlation keys (e.g. from session.set), like PlaceCall.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| to | [string](#scalar-value-types) |  |  |
| text | [string](#scalar-value-types) |  |  |
| from | [string](#scalar-value-types) |  |  |
| session | [SendSmsRequest.SessionEntry](#babelconnect-v1-SendSmsRequest-SessionEntry) | repeated |  |







### SendSmsRequest.SessionEntry {#babelconnect-v1-SendSmsRequest-SessionEntry}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| key | [string](#scalar-value-types) |  |  |
| value | [string](#scalar-value-types) |  |  |







### SetAgentNumber {#babelconnect-v1-SetAgentNumber}
SetAgentNumber sets the external phone number the agent&#39;s calls bridge to.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| number | [string](#scalar-value-types) |  |  |







### SetConversationOpen {#babelconnect-v1-SetConversationOpen}
SetConversationOpen opens (reopens) or closes (resolves) an SMS conversation.
The server flips SmsConversation.open optimistically and re-confirms.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| conversation_id | [string](#scalar-value-types) |  |  |
| open | [bool](#scalar-value-types) |  |  |







### SetDisplayAs {#babelconnect-v1-SetDisplayAs}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| number | [string](#scalar-value-types) |  | outbound number to present |







### SetPresence {#babelconnect-v1-SetPresence}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#scalar-value-types) |  | presence to switch to, e.g. &#34;available&#34; or a pause reason |







### SetRecordingTags {#babelconnect-v1-SetRecordingTags}
SetRecordingTags replaces the tags on the call&#39;s active recording.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |
| tags | [string](#scalar-value-types) | repeated |  |







### SetWebrtc {#babelconnect-v1-SetWebrtc}
SetWebrtc enables or disables the browser phone (WebRTC). Off = bridge calls to
the external-telephone number instead.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| on | [bool](#scalar-value-types) |  |  |







### SmsConversation {#babelconnect-v1-SmsConversation}
SmsConversation is one SMS thread summary carried in the AgentView (the full
thread history is fetched on demand, not held in the snapshot). Upsert-by-id;
the reducer keeps the list sorted by last_ts descending.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  | conversation id |
| peer | [string](#scalar-value-types) |  | the other party&#39;s number |
| last_direction | [CallDirection](#babelconnect-v1-CallDirection) |  | INBOUND = received, OUTBOUND = sent |
| last_text | [string](#scalar-value-types) |  | latest message preview |
| last_ts | [int64](#scalar-value-types) |  | unix seconds of the latest message |
| unread | [uint32](#scalar-value-types) |  | unread message count |
| contact_label | [string](#scalar-value-types) |  | phonebook label for the peer, if known |
| open | [bool](#scalar-value-types) |  | conversation open (unresolved) vs closed |







### SmsMessage {#babelconnect-v1-SmsMessage}
SmsMessage is one message inside a conversation thread, fetched on demand via
GetSmsThread (the AgentView only carries the lightweight SmsConversation
summary, not the full history). Oldest-first; the client bubbles it by
direction. `state` is the message status (received/sent/delivered/failed/
scheduled) for display only.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  |  |
| direction | [CallDirection](#babelconnect-v1-CallDirection) |  | INBOUND = received, OUTBOUND = sent |
| from | [string](#scalar-value-types) |  |  |
| to | [string](#scalar-value-types) |  |  |
| text | [string](#scalar-value-types) |  |  |
| ts | [int64](#scalar-value-types) |  | unix seconds (dateCreated) |
| state | [string](#scalar-value-types) |  | received/sent/delivered/failed/scheduled (display only) |







### SmsThreadRequest {#babelconnect-v1-SmsThreadRequest}
SmsThreadRequest / SmsThreadResponse page the messages of one SMS conversation.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| conversation_id | [string](#scalar-value-types) |  |  |
| max | [int32](#scalar-value-types) |  | page size (default 50) |
| page | [int32](#scalar-value-types) |  | 1-based page (default 1) |







### SmsThreadResponse {#babelconnect-v1-SmsThreadResponse}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| messages | [SmsMessage](#babelconnect-v1-SmsMessage) | repeated |  |







### StartConference {#babelconnect-v1-StartConference}
StartConference opens a conference around the agent&#39;s current call. `hold` puts
the existing party on hold while the first new member is dialed.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| hold | [bool](#scalar-value-types) |  |  |







### StartRecording {#babelconnect-v1-StartRecording}
StartRecording begins recording the given call.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |







### StateUpdate {#babelconnect-v1-StateUpdate}
StateUpdate is the single server → client message on the Subscribe stream. On
open the client receives a snapshot; thereafter partial patches. `seq` is
monotonic across snapshot&#43;patch — a gap means the client should resubscribe
for a fresh snapshot. `error` is an out-of-band notice (command rejection /
server warning) and does NOT advance `seq`. `keepalive` is an empty transport
heartbeat (see Keepalive) that likewise does NOT advance `seq` and carries no
state — client caches must ignore it.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| seq | [uint64](#scalar-value-types) |  |  |
| snapshot | [AgentView](#babelconnect-v1-AgentView) |  |  |
| patch | [Patch](#babelconnect-v1-Patch) |  |  |
| error | [Error](#babelconnect-v1-Error) |  |  |
| keepalive | [Keepalive](#babelconnect-v1-Keepalive) |  |  |
| ping | [Ping](#babelconnect-v1-Ping) |  |  |







### StopRecording {#babelconnect-v1-StopRecording}
StopRecording ends the call&#39;s active recording.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |







### SubscribeRequest {#babelconnect-v1-SubscribeRequest}
SubscribeRequest opens the StateUpdate stream for the authenticated agent (the
bearer token rides in &#34;authorization&#34; metadata, like every call). Empty today;
reserved for future subscription filters.







### Transfer {#babelconnect-v1-Transfer}
Transfer hands the current call to a target. Exactly one target is set:
`to` (external number), `agent_id` (another agent), or `application_id` (a
queue/voice application). `warm` selects attended (consult-then-drop) vs
blind/cold (single action).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| call_id | [string](#scalar-value-types) |  |  |
| to | [string](#scalar-value-types) |  | external number target |
| warm | [bool](#scalar-value-types) |  | true = attended/warm, false = blind/cold |
| agent_id | [string](#scalar-value-types) |  | transfer to another agent |
| application_id | [string](#scalar-value-types) |  | transfer to a queue / voice application |







### TransferTarget {#babelconnect-v1-TransferTarget}
TransferTarget is one autocomplete result for a blind transfer / add-member
pick. `id` is the backend id to pass back on Transfer/AddConferenceMember
(an agent or application UUID; for a synthetic NUMBER result it is the raw
query, not a stable id — clients should send `number`, not `id`, for that
kind). `category` is the IVR module name (APPLICATION only, e.g.
&#34;simpleMenu&#34;); `browser` marks an agent reachable only via browser phone
(no PSTN number) — AGENT only.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#scalar-value-types) |  |  |
| kind | [TransferTargetKind](#babelconnect-v1-TransferTargetKind) |  |  |
| label | [string](#scalar-value-types) |  |  |
| number | [string](#scalar-value-types) |  | NUMBER kind, and AGENT kind when it has a PSTN number |
| category | [string](#scalar-value-types) |  | APPLICATION only: the IVR module name |
| browser | [bool](#scalar-value-types) |  | AGENT only: browser-phone-reachable, no PSTN number |







### TransferTargetsRequest {#babelconnect-v1-TransferTargetsRequest}
TransferTargetsRequest / TransferTargetsResponse back the transfer-target
autocomplete (blind transfer &#43; add-member dialogs). `query` filters
server-side; empty returns the default result set (a synthetic NUMBER
target only appears once `query` looks like a number).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| query | [string](#scalar-value-types) |  |  |







### TransferTargetsResponse {#babelconnect-v1-TransferTargetsResponse}



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| targets | [TransferTarget](#babelconnect-v1-TransferTarget) | repeated |  |







### WrapUpCancel {#babelconnect-v1-WrapUpCancel}
WrapUpCancel ends the agent&#39;s after-call-work early.







### WrapUpExtend {#babelconnect-v1-WrapUpExtend}
WrapUpExtend adds time to the agent&#39;s after-call-work countdown.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| seconds | [int32](#scalar-value-types) |  | extra wrap-up seconds to add (e.g. 30) |







### WrapUpStatus {#babelconnect-v1-WrapUpStatus}
WrapUpStatus is the after-call-work countdown.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| active | [bool](#scalar-value-types) |  |  |
| remaining_seconds | [int32](#scalar-value-types) |  |  |
| last_call_type | [string](#scalar-value-types) |  |  |
| can_cancel | [bool](#scalar-value-types) |  |  |
| can_extend | [bool](#scalar-value-types) |  |  |





 



### AgentState {#babelconnect-v1-AgentState}


| Name | Number | Description |
| ---- | ------ | ----------- |
| AGENT_STATE_UNSPECIFIED | 0 |  |
| AGENT_STATE_OFFLINE | 1 |  |
| AGENT_STATE_AVAILABLE | 2 |  |
| AGENT_STATE_IN_CALL | 3 |  |
| AGENT_STATE_WRAP_UP | 4 |  |
| AGENT_STATE_PAUSED | 5 |  |
| AGENT_STATE_RINGING | 6 |  |
| AGENT_STATE_BUSY | 7 |  |




### CallDirection {#babelconnect-v1-CallDirection}


| Name | Number | Description |
| ---- | ------ | ----------- |
| CALL_DIRECTION_UNSPECIFIED | 0 |  |
| CALL_DIRECTION_INBOUND | 1 |  |
| CALL_DIRECTION_OUTBOUND | 2 |  |




### CallLifecycle {#babelconnect-v1-CallLifecycle}


| Name | Number | Description |
| ---- | ------ | ----------- |
| CALL_LIFECYCLE_UNSPECIFIED | 0 |  |
| CALL_LIFECYCLE_INIT | 1 |  |
| CALL_LIFECYCLE_RINGING | 2 | offer present; client should answer |
| CALL_LIFECYCLE_IN_PROGRESS | 3 |  |
| CALL_LIFECYCLE_BRIDGED | 4 | media flowing both ways |
| CALL_LIFECYCLE_COMPLETED | 5 |  |
| CALL_LIFECYCLE_FAILED | 6 |  |




### CallSource {#babelconnect-v1-CallSource}


| Name | Number | Description |
| ---- | ------ | ----------- |
| CALL_SOURCE_UNSPECIFIED | 0 |  |
| CALL_SOURCE_API | 1 |  |
| CALL_SOURCE_WEBRTC | 2 |  |
| CALL_SOURCE_QUEUE | 3 |  |
| CALL_SOURCE_TRANSFER | 4 |  |
| CALL_SOURCE_DIALER | 5 |  |
| CALL_SOURCE_CONFERENCE | 6 |  |
| CALL_SOURCE_CALLBACK | 7 |  |




### CampaignMemberState {#babelconnect-v1-CampaignMemberState}
CampaignMemberState is the predictive-dialer campaign membership
lifecycle: offline -&gt; logging_in -&gt; waiting -&gt; in_progress -&gt;
disposition (-&gt; waiting for the next lead), with idle as the paused branch
(waiting/logging_in &lt;-&gt; idle via pause/resume) and leave returning to
offline from any state.

| Name | Number | Description |
| ---- | ------ | ----------- |
| CAMPAIGN_MEMBER_STATE_UNSPECIFIED | 0 |  |
| CAMPAIGN_MEMBER_STATE_OFFLINE | 1 |  |
| CAMPAIGN_MEMBER_STATE_LOGGING_IN | 2 |  |
| CAMPAIGN_MEMBER_STATE_WAITING | 3 |  |
| CAMPAIGN_MEMBER_STATE_IDLE | 4 | paused |
| CAMPAIGN_MEMBER_STATE_IN_PROGRESS | 5 |  |
| CAMPAIGN_MEMBER_STATE_DISPOSITION | 6 |  |




### TransferTargetKind {#babelconnect-v1-TransferTargetKind}
TransferTargetKind discriminates a TransferTarget. The wire type only ever
carries agent / number / application (a UI may group results differently,
e.g. a &#34;phonebook&#34; section, but that is presentation only).

| Name | Number | Description |
| ---- | ------ | ----------- |
| TRANSFER_TARGET_KIND_UNSPECIFIED | 0 |  |
| TRANSFER_TARGET_KIND_AGENT | 1 |  |
| TRANSFER_TARGET_KIND_NUMBER | 2 |  |
| TRANSFER_TARGET_KIND_APPLICATION | 3 |  |


 

 



### Agent {#babelconnect-v1-Agent}


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| Authenticate | [AuthenticateRequest](#babelconnect-v1-AuthenticateRequest) | [Identity](#babelconnect-v1-Identity) | Authenticate validates the caller&#39;s bearer token and returns the resolved agent identity (id, account, presence). |
| Subscribe | [SubscribeRequest](#babelconnect-v1-SubscribeRequest) | [StateUpdate](#babelconnect-v1-StateUpdate) stream | Subscribe &#43; Send are the control stream, split into its server→client and client→server halves — the one shape every client uses (RPC-A4 retired the earlier bidi `Session` RPC, which needed HTTP/2 end-to-end and couldn&#39;t ride gRPC-web or a plain HTTP/1.1 ingress). Subscribe is the server→client half (StateUpdate: one snapshot on open, then entity-level patches; UI = f(AgentView)). Send is the client→server half (one Command per unary call). Together they key to the agent&#39;s one state store. Command rejections arrive as an Error on the Subscribe stream, never on Send&#39;s reply. |
| Send | [Command](#babelconnect-v1-Command) | [Ack](#babelconnect-v1-Ack) |  |
| GetHistory | [HistoryRequest](#babelconnect-v1-HistoryRequest) | [HistoryResponse](#babelconnect-v1-HistoryResponse) | GetHistory returns the agent&#39;s past calls (the History tab). A unary query — history is on-demand reference data, not part of the live AgentView snapshot. |
| GetSmsThread | [SmsThreadRequest](#babelconnect-v1-SmsThreadRequest) | [SmsThreadResponse](#babelconnect-v1-SmsThreadResponse) | GetSmsThread returns the messages of one SMS conversation (the chat thread). A unary query like GetHistory — the live AgentView carries only the SmsConversation summary; the full thread is fetched on demand. conversation_id is a query param (it can be a peer phone number when no conversation id is available), so this stays distinct from the POST /v1/agent/sms send. |
| GetPhonebook | [PhonebookRequest](#babelconnect-v1-PhonebookRequest) | [PhonebookResponse](#babelconnect-v1-PhonebookResponse) | GetPhonebook returns the agent&#39;s dial-from contacts &#43; recent numbers (the Contacts tab). A unary query like GetHistory: the live AgentView carries a phonebook snapshot frozen at register (AgentInfo.phonebook); this re-pulls the merged contacts&#43;recents list on demand (refresh) so a long-running session can see new contacts. `query` filters by label/number. |
| GetTransferTargets | [TransferTargetsRequest](#babelconnect-v1-TransferTargetsRequest) | [TransferTargetsResponse](#babelconnect-v1-TransferTargetsResponse) | GetTransferTargets autocompletes blind-transfer / add-member targets as the agent types — agents, raw numbers, and IVR applications. `query` filters server-side (substring across name/email/number for agents, name for applications); the lookup has no call-context param, so eligibility by call direction is a separate, already-server-computed flag the client applies itself (CallState.can_transfer_to_application hides APPLICATION results). |
| GetState | [GetStateRequest](#babelconnect-v1-GetStateRequest) | [AgentView](#babelconnect-v1-AgentView) | GetState returns the agent&#39;s current AgentView as a single unary call — the REST/web &#34;get current state&#34; (the Subscribe stream is the realtime twin). When no live session backs the caller, the server builds the snapshot on demand (agent &#43; presence &#43; wrap-up); live call state requires a stream. |
| SendSms | [SendSmsRequest](#babelconnect-v1-SendSmsRequest) | [SmsConversation](#babelconnect-v1-SmsConversation) | SendSms sends an SMS and returns the (upserted) conversation summary. Exposed over REST as POST /v1/agent/sms and as the Command.send_sms intent on the stream — both send the same message. |
| ListCampaigns | [ListCampaignsRequest](#babelconnect-v1-ListCampaignsRequest) | [ListCampaignsResponse](#babelconnect-v1-ListCampaignsResponse) | ListCampaigns lists the outbound-dialer campaigns the agent may join (the Outbound tab&#39;s campaign picker) — on-demand reference data like GetPhonebook/GetTransferTargets. |
| ListDispositions | [ListDispositionsRequest](#babelconnect-v1-ListDispositionsRequest) | [ListDispositionsResponse](#babelconnect-v1-ListDispositionsResponse) | ListDispositions lists the available call-outcome codes for the disposition picker — on-demand reference data like ListCampaigns. The list is a static global, not campaign-scoped, so the request carries no campaign id. |

 



## Scalar Value Types

| .proto Type | Notes | C++ | Java | Python | Go | C# | PHP | Ruby |
| ----------- | ----- | --- | ---- | ------ | -- | -- | --- | ---- |
| double |  | double | double | float | float64 | double | float | Float |
| float |  | float | float | float | float32 | float | float | Float |
| int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| uint32 | Uses variable-length encoding. | uint32 | int | int/long | uint32 | uint | integer | Bignum or Fixnum (as required) |
| uint64 | Uses variable-length encoding. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum or Fixnum (as required) |
| sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | uint32 | int | int | uint32 | uint | integer | Bignum or Fixnum (as required) |
| fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum |
| sfixed32 | Always four bytes. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| sfixed64 | Always eight bytes. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| bool |  | bool | boolean | boolean | bool | bool | boolean | TrueClass/FalseClass |
| string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | string | String | str/unicode | string | string | string | String (UTF-8) |
| bytes | May contain any arbitrary sequence of bytes. | string | ByteString | str | []byte | ByteString | string | String (ASCII-8BIT) |

