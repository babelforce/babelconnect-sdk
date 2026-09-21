# Interface: EmbedTheme

The bounded set of brand tokens a host page may hand the embedded app.

It is a **token set, not a stylesheet**: the app paints to a canvas, so a
host CSS file has nothing to select, and an open styling surface would be
an unbounded contract to keep. Each token maps onto one role of the app's
own design system.

Precedence is **this theme > the deployment's configured brand > the
bundled defaults**, applied token by token: a token you omit keeps the
deployment value, and so does a token whose value the app refuses.

A **refused** token is reported back as `cti.error` with
`code: "theme_rejected"` and a message naming it — the rest of the payload
still applies. Unknown keys are ignored silently, so a newer token is
always safe to send to an older app.

The theme is **not persisted** by the app. The SDK remembers what you last
set and re-sends it on every `ready`, exactly as it does the bearer token,
so an iframe reload keeps your branding. A **refused** token is dropped from
those re-sends — the app would refuse it again and you would collect one more
identical `cti.error` per reload — until you set a new value for it.

## Example

```ts
const bc = BabelconnectEmbed.mount({
  container, serverUrl, token,
  theme: { brandName: "Acme", accentColor: "#112233", mode: "system" },
});
bc.app.setTheme({ mode: "dark" }); // mid-session, no reload
```

## Properties

### accentColor?

```ts
optional accentColor: null | string;
```

Accent/CTA colour as `#rrggbb`, or `#aarrggbb` whose alpha is `FF`. Any
other alpha is refused.

***

### brandName?

```ts
optional brandName: null | string;
```

Product name — window/tab title and the logo's accessible label. Up to 64 characters.

***

### cornerRadius?

```ts
optional cornerRadius: null | number;
```

Optional: corner radius of the app's containers — cards, dialogs and
popup menus — in pixels, `0`–`32`. Controls keep their own shapes.

***

### logoUrl?

```ts
optional logoUrl: null | string;
```

Logo URL. **`https:` only** — the app renders it as-is into its own document.

***

### mode?

```ts
optional mode: null | "light" | "dark" | "system";
```

Light, dark, or follow the viewer's OS setting. Overrides the agent's own preference while set.

***

### primaryColor?

```ts
optional primaryColor: null | string;
```

Optional: the primary colour role, as `#rrggbb`.

***

### surfaceColor?

```ts
optional surfaceColor: null | string;
```

Optional: the base surface colour, as `#rrggbb`. The container tints —
cards, dialogs, popup menus — are re-derived from it as contrast-checked
tonal steps, so text stays readable on any surface you send.
