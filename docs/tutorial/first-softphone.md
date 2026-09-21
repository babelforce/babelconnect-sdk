---
title: Your first softphone
sidebar_label: Your first softphone
sidebar_position: 1
description: Build a complete TypeScript browser client that renders state, dials, answers on a click, and cleans up.
---

# Your first softphone

Build a small browser phone with a dialer and one card per call. Incoming calls wait for an
**Answer** click. Outgoing calls answer the agent's own leg automatically.

You need Node 22.12+, a modern browser, a microphone, a reachable babelconnect-server origin,
and an agent bearer token. The account must allow calls and provide an outbound caller ID.
Ask the deployment operator to allow `http://localhost:5173` in CORS. Microphone access needs
HTTPS or localhost; a server alone is not a complete telephony deployment.

## 1. Install

```sh
mkdir my-softphone
cd my-softphone
npm init -y
npm install @babelforce/babelconnect-sdk
npm install --save-dev typescript vite
mkdir src
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"], "strict": true, "noEmit": true, "skipLibCheck": true
  },
  "include": ["src"]
}
```

## 2. Get a token

Obtain a short-lived test token using [Authentication](../guides/authentication).
This local example accepts it in a password field and keeps it in memory. For a deployed app,
connect your login flow; never bake tokens or account passwords into source.

Create `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My softphone</title>
</head>
<body>
  <h1>My softphone</h1>
  <form id="login">
    <label>Server <input id="server" type="url" required placeholder="https://agent.example.com"></label>
    <label>Token <input id="token" type="password" required autocomplete="off"></label>
    <button id="connect">Connect</button>
  </form>
  <p id="status" role="status">Disconnected</p>
  <p id="error" role="alert"></p>
  <form id="dial">
    <label>Number <input id="number" type="tel" required placeholder="+15551234567"></label>
    <button id="call" disabled>Call</button>
  </form>
  <div id="calls"></div>
  <button id="disconnect" disabled>Disconnect</button>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## 3. Connect and mirror state

Create `src/main.ts`. This is the complete application; it defines every helper it uses.

```ts
import {
  BabelconnectClient, CallDirection, CallLifecycle, CallSource, type AgentView,
} from "@babelforce/babelconnect-sdk";

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node as T;
}
const login = element<HTMLFormElement>("login");
const dial = element<HTMLFormElement>("dial");
const server = element<HTMLInputElement>("server");
const token = element<HTMLInputElement>("token");
const number = element<HTMLInputElement>("number");
const connect = element<HTMLButtonElement>("connect");
const callButton = element<HTMLButtonElement>("call");
const disconnect = element<HTMLButtonElement>("disconnect");
const status = element("status");
const error = element("error");
const calls = element("calls");
let bc: BabelconnectClient | undefined;
let unsubscribe: (() => void) | undefined;
let usable = false;

function report(message: string): void { error.textContent = message; }
function button(label: string, action: () => void): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = label;
  node.onclick = action;
  node.disabled = !usable;
  return node;
}
function render(view: AgentView): void {
  // subscribe() immediately supplies a possibly empty cache, before any network reply.
  callButton.disabled = !usable || !view.config?.calls?.enabled || !view.agent?.displayAs;
  if (usable) status.textContent = view.agent?.id
    ? `${view.agent.name}: ${view.agent.presenceLabel || view.agent.presenceName}`
    : "Connecting…";
  calls.replaceChildren();
  for (const call of view.activeCalls) {
    const card = document.createElement("section");
    const title = document.createElement("p");
    const peer = call.direction === CallDirection.INBOUND ? call.from : call.to;
    title.textContent = `${call.anonymous ? "Anonymous" : peer} — ${CallLifecycle[call.state]}`;
    card.append(title);
    const needsAnswer = call.state === CallLifecycle.RINGING &&
      (call.direction !== CallDirection.OUTBOUND || call.source === CallSource.CALLBACK);
    if (needsAnswer && call.webrtcOffer) {
      card.append(button("Answer", () => { void bc?.answerCall(call.id).catch(e => report(String(e))); }));
    }
    card.append(button(call.state === CallLifecycle.RINGING ? "Reject" : "Hang up",
      () => bc?.hangup(call.id)));
    if (call.state === CallLifecycle.IN_PROGRESS || call.state === CallLifecycle.BRIDGED) {
      card.append(button(call.muted ? "Unmute" : "Mute", () => bc?.mute(call.id, !call.muted)));
    }
    calls.append(card);
  }
}
function connectionLost(message: string): void {
  usable = false;
  status.textContent = "Disconnected or stale — disconnect, then connect again";
  report(message);
  if (bc) render(bc.view);
}
async function close(): Promise<void> {
  usable = false;
  unsubscribe?.();
  unsubscribe = undefined;
  const previous = bc;
  bc = undefined;
  try { await previous?.close(); }
  catch (e) { report(String(e)); }
  finally {
    calls.replaceChildren();
    status.textContent = "Disconnected";
    callButton.disabled = disconnect.disabled = true;
    connect.disabled = false;
  }
}
login.onsubmit = event => {
  event.preventDefault();
  if (bc) return;
  report("");
  usable = true;
  connect.disabled = true;
  disconnect.disabled = false;
  try {
    bc = BabelconnectClient.connect({
      serverUrl: server.value.replace(/\/+$/, ""), token: token.value,
      onError: e => e.code === "disconnected"
        ? connectionLost(e.message)
        : report(`${e.code}${e.callId ? ` (${e.callId})` : ""}: ${e.message}`),
      onGap: () => connectionLost("State updates were missed."),
    });
    token.value = "";
    unsubscribe = bc.subscribe(render);
    bc.register();
  } catch (e) { report(String(e)); void close(); }
};
dial.onsubmit = event => {
  event.preventDefault();
  if (bc && !callButton.disabled) { report(""); bc.placeCall(number.value.trim()); }
};
disconnect.onclick = () => { void close(); };
window.addEventListener("pagehide", () => { void close(); });
```

Check and serve it:

```sh
npx tsc
npx vite --host localhost --port 5173 --strictPort
```

Open `http://localhost:5173`, enter the server origin and token, then **Connect**. Registration
loads feature settings and caller IDs and requests WebRTC reachability. The SDK queues early
intents until the stream starts. Rendering only reads state; it never answers calls.

## 4. Place a call

Enter an E.164 number and click **Call**. The SDK's default browser media handles the offer
and auto-answers your own outbound leg. Grant microphone permission and check that both parties
can hear each other. The Call button stays disabled until calls are enabled and `agent.displayAs`
is populated; use a [caller-ID picker](../guides/recipes#outbound-dial-with-a-caller-id-picker)
if the account requires a selection. The server may still reject dialing for presence or line status.

## 5. Answer an inbound call

Call the agent from another phone. The card displays **Answer** and **Reject**; neither happens
until you click. Scheduled outbound callbacks also need explicit acceptance. A ringing call without
a WebRTC offer cannot be answered by this browser. See [where calls ring](../concepts/intents#session--identity).

## 6. During the call, and hanging up

**Mute** sends an intent; the next state update changes the label. **Hang up** ends the call.
**Disconnect** detaches the renderer and awaits `close()` to release the stream and media.
`pagehide` also starts cleanup, though browsers do not wait for asynchronous unload work.
Closing does not revoke the token; see [Logout](../guides/authentication#logout).

## The same in Go

Use the complete [Go terminal example](../go/quickstart-client). Check its availability and transport
limits first; its default media sends silence rather than using a microphone.

## Troubleshooting your first call

| Symptom | Check |
|---|---|
| No sound | Microphone permission, HTTPS/localhost, autoplay policy, and reachable STUN/TURN. |
| No incoming card | Registration, WebRTC routing and the agent's availability. |
| Dial rejected | Read the displayed error; select an allowed caller ID and an available presence. |
| Connection lost | Disconnect, obtain a fresh token if needed, and reconnect. This closes live media. |

The [troubleshooting guide](../guides/troubleshooting) covers each case. This example deliberately
uses manual reconnection; it does not promise uninterrupted audio or automatic token refresh.

## Where to go next

[Recipes](../guides/recipes) adds presence, transfer, messaging and contacts.
[Errors & reconnects](../guides/errors-and-reconnects) explains recovery limits.
Use the [TypeScript API](../typescript/api/index.md) for method signatures or
[embed the agent app](../typescript/embedding) to use its ready-made interface.
