# Interface: EmbedEventMeta

What the app said about the envelope an event arrived in — which mount
posted it, and under which name.

## Properties

### instanceId?

```ts
optional instanceId: string;
```

The posting instance's [EmbedOptions.instanceId](EmbedOptions.md#instanceid), or `undefined`
when the envelope carried none (an app build older than this field).

***

### name

```ts
name: string;
```

The event name, as posted.
