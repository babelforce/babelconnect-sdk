---
title: Control only (no audio)
sidebar_label: Control only
sidebar_position: 3
description: Observe state and send commands without browser media, while routing calls to an external phone.
---

# Control only (no audio)

Set `mediaFactory: null` explicitly; omitting it selects browser media. Also set `autoAnswer: false`
so outbound offers don't trigger attempts to answer without media. This works in browsers and Node 20+.

The following fragment assumes `serverUrl`, `token`, and your `render` callback:

```ts
import { BabelconnectClient } from "@babelforce/babelconnect-sdk";

const bc = BabelconnectClient.connect({
  serverUrl, token, mediaFactory: null, autoAnswer: false,
  onError: e => console.error(e.code, e.message),
});
const stop = bc.subscribe(render);
bc.sendSms("+15551234567", "On my way!");
// When finished: stop(); await bc.close();
```

## When to use it

Use this mode for an agent's dashboard, messaging, presence, or automation. A token identifies
one agent; this is not a team-wide observer API. [Go automation](../go/quickstart-control-only)
has a different default: a silent WebRTC leg.

## What works without audio

The state stream, non-media intents and unary fetches still work. `answerCall` needs media and
reports `no_media` when none is configured. A `placeCall` intent can succeed, but a human still
needs somewhere to hear the call.

**Registration changes routing.** `register()` loads presence options, caller IDs, contacts and
feature config and requests WebRTC reachability, even with an empty capabilities list or no media
factory. For calls on an external phone, register, wait for the resulting deployment data, then set
`setWebrtc(false)` and `setAgentNumber(number)`. Confirm both values in state before dialing.
TypeScript sends are asynchronous; adjacent calls do not guarantee completion order.
Repeat the routing setup after registering a replacement session.

For a pure observer, avoid registration unless those reference data are needed; registration is
not a passive read. If you do register, restore the intended audio route. With WebRTC off and no
external number, the agent is unreachable.

See [where calls ring](../concepts/intents#session--identity),
[client cleanup](./quickstart-client#cleanup), and [error handling](../guides/errors-and-reconnects).
