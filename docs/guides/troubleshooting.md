---
title: Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 5
description: Find a symptom, check the cause, and follow the relevant guide.
---

# Troubleshooting

## Audio & media

| Symptom | Check |
|---|---|
| Connected but silent | HTTPS/localhost, microphone permission, browser autoplay, and reachable STUN/TURN. Go's default is silent media. [Media setup](../typescript/quickstart-client#bring-your-own-media). |
| `no_media` | TS has `mediaFactory: null`; it cannot answer audio. Supply media or use an external phone. [Control only](../typescript/quickstart-control-only). |
| Microphone error | `mic_not_found`, `mic_permission_denied`, or `mic_in_use` identifies absent, denied, or occupied hardware. [Errors](./errors-and-reconnects#1-command-rejections-onerror). |

## Calls & ringing

| Symptom | Check |
|---|---|
| No browser ringing | Register, confirm WebRTC routing and agent availability. With WebRTC off, configure an external number. [Routing](../concepts/intents#session--identity). |
| Callback waits for Answer | Expected: callbacks never auto-answer, even when outbound auto-answer is enabled. [Call model](../concepts/state-and-events#a-call-end-to-end). |
| No calls in the UI | Inspect `bc.view`, connection errors, registration and routing; check `config.calls.enabled` for visibility. A late subscriber receives cached state and does not itself lose calls. |
| `display_as_forbidden` or no caller ID | Select an allowed `availableNumbers` entry. An admin may need to [assign a Display-As number](https://help.babelforce.com/hc/en-us/articles/4410103310100-Add-a-Display-As-number-for-an-agent-to-be-presented-in-the-babelConnect-app). External conference invites can fail the same way. [Error reference](../protocol/error-codes#outbound--answering). |
| `agent_not_available` | If `lineBlocked`, offer Reset; otherwise choose an available presence. [Banner](./recipes#a-line-blocked-banner). |
| Busy after signing back in | The prebuilt app chooses busy on sign-out; that choice persists. Select Available. A standalone SDK `close()` does not set presence. Reset is for involuntary blocking only. |
| A command does nothing | Handle the send result and error callback; command outcomes arrive separately in state. [Errors](./errors-and-reconnects). |

## Connection & lifecycle

| Symptom | Check |
|---|---|
| Audio lost on reconnect | Close releases media; standalone SDKs don't re-answer an in-progress call. [Recovery limits](./errors-and-reconnects#3-disconnects--token-expiry--reconnect-with-backoff). |
| Connection indicator looks healthy after a drop | An immediate cache callback or successful send doesn't prove stream health. Go has no disconnect callback; TS clean stream endings are silent. [Indicators](./errors-and-reconnects#showing-a-connection-indicator). |
| `onGap` or stale state | Get a fresh snapshot; see the [TS notification sequencing caveat](../concepts/state-and-events#seq-ordering-and-gap-recovery). |
| Reconnect rejected | The token may have expired or been revoked. [Renew/login](./authentication#token-lifetime). |

## Setup & integration

| Symptom | Check |
|---|---|
| CORS failure | Add the app origin to the API allowlist. Empty is permissive. [TS setup](../typescript/getting-started). |
| Go cannot reach an HTTPS origin | Current `Addr` constructs plain HTTP. [Go limitations](../go/getting-started). |
| `require()` fails | Use ESM or dynamic `import()`. [TS installation](../typescript/getting-started#install). |
| Config/options/contacts missing | Registration loads these in separate updates and may encounter partial fetch failures. Handle absent fields. |
| Control-only client receives offers | Registration requests WebRTC reachability regardless of media/capabilities. [Restore external routing](../typescript/quickstart-control-only). |
| Contact name says "recent" | That literal denotes a recent number, not a person's name. [Contacts](./recipes#a-contacts-list-dial-from-the-phonebook). |
| Embed is blank or silent | Check CSP framing, embed message origins and host microphone delegation separately. [Embedding](../typescript/embedding). |
| Embed event missing | Wait for `agent.loaded`; deployed app support and CTI feature flags govern events. [Events](../typescript/embedding#4-react-to-the-app-app--host). |
| Host theme partly ignored | Read `theme_rejected`; accepted sibling tokens still apply. Re-send after ready when using raw messages. [Theme rules](../typescript/embedding#3b-theme-the-app-your-brand-inside-the-iframe). |

## See also

[Authentication](./authentication) · [Error codes](../protocol/error-codes) ·
[State & events](../concepts/state-and-events).
