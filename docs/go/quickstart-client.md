---
title: Programmatic client
sidebar_label: Programmatic client
sidebar_position: 2
description: A complete terminal example using the current Go SDK with silent WebRTC media.
---

# Programmatic client (with audio)

Read [availability and transport limits](./getting-started) first. This complete `main.go` targets
the current source API through a trusted local endpoint. Its default WebRTC leg is **silent**;
real microphone/speaker audio requires a custom factory.

With the matching SDK and protocol modules available in your Go module, run `go run .` and use
`dial <number>`, `answer <id>`, `hangup <id>`, or `quit`. Set `BC_ADDR` to a trusted `host:port`
and supply a short-lived agent token as `BC_TOKEN` through your local environment.

```go
package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	bcv1 "github.com/babelforce/babelconnect-proto/gen/go/babelconnect/v1"
	bcclient "github.com/babelforce/babelconnect-sdk-go"
)

func main() {
	addr := os.Getenv("BC_ADDR")
	if addr == "" {
		addr = "localhost:7091"
	}
	cli, err := bcclient.Dial(context.Background(), bcclient.Options{
		Addr: addr, Token: os.Getenv("BC_TOKEN"), AutoAnswer: true,
		OnError: func(e *bcv1.Error) { log.Printf("%s (%s): %s", e.Code, e.CallId, e.Message) },
		OnGap:   func() { log.Print("State is stale; quit and reconnect for a fresh snapshot") },
	})
	if err != nil {
		log.Print(err)
		return
	}
	defer cli.Close()
	cli.Subscribe(func(v *bcv1.AgentView) {
		for _, c := range v.GetActiveCalls() {
			fmt.Printf("%s: %s %s → %s\n", c.Id, c.State, c.From, c.To)
		}
	})
	if err := cli.Register("webrtc"); err != nil {
		log.Print(err)
		return
	}
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("Wait for registration, then: dial <number>, answer <id>, hangup <id>, quit")
	for scanner.Scan() {
		parts := strings.Fields(scanner.Text())
		if len(parts) == 1 && parts[0] == "quit" {
			return
		}
		if len(parts) != 2 {
			fmt.Println("Expected command and number/call id")
			continue
		}
		switch parts[0] {
		case "dial":
			v := cli.View()
			if !v.GetConfig().GetCalls().GetEnabled() || v.GetAgent().GetDisplayAs() == "" {
				fmt.Println("Wait for call config and select an allowed caller ID first")
				continue
			}
			err = cli.PlaceCall(parts[1], "", "", false)
		case "answer":
			var ringing bool
			for _, c := range cli.View().GetActiveCalls() {
				if c.Id == parts[1] && c.State == bcv1.CallLifecycle_CALL_LIFECYCLE_RINGING && c.WebrtcOffer != "" {
					ringing = true
				}
			}
			if !ringing {
				fmt.Println("No ringing WebRTC offer for that id")
				continue
			}
			err = cli.Answer(parts[1])
		case "hangup":
			err = cli.Hangup(parts[1])
		default:
			fmt.Println("Unknown command")
			continue
		}
		if err != nil {
			log.Print(err)
		}
	}
	if err := scanner.Err(); err != nil {
		log.Print(err)
	}
}
```

## What's happening

`Register` loads reference data and requests WebRTC reachability. The current server ignores its
capability strings, so `Register()` also requests reachability. `AutoAnswer` defaults to `false`;
the example enables it for your own outbound leg. It never auto-answers inbound calls or callbacks.
`PlaceCall` takes positional `to, displayAsTo, displayAsFrom, record`; empty display overrides use
the server's defaults. The command can still be rejected asynchronously.

## Handling inbound calls

The subscriber prints state only. Type `answer <id>` to accept a ringing offer or `hangup <id>`
to reject it. Go enums include the full prefix, such as
`bcv1.CallLifecycle_CALL_LIFECYCLE_RINGING`. `View()` returns a clone (possibly empty);
`ActiveCall()` returns the first call or nil. Prefer explicit IDs when more than one call exists.

## Concurrency

Sends are serialized. Subscription callbacks run synchronously for their immediate cache delivery
and on the receive loop for later updates; keep them short. A newly attached callback can overlap
an update, so synchronize shared UI state. Views are cloned from the cache but should be treated
as read-only. `Subscribe` has no unsubscribe function: attach once, then close the client.

## Bring your own media

Use `Options.Media` for [real audio](./quickstart-control-only#adding-real-audio-later).
The default lets you verify RTP flow, not what a person hears.

## Next steps

The example reports gaps but leaves recovery to the operator. Add the policy in
[Errors & reconnects](../guides/errors-and-reconnects) before relying on a long-lived session.
[Authentication](../guides/authentication) covers PKCE and logout; [Intents](../concepts/intents)
lists the remaining commands.
