# Function: micErrorCode()

```ts
function micErrorCode(error): string
```

Classify a caught `getUserMedia` failure into one of the mic error codes,
falling back to [MEDIA\_ANSWER\_FAILED](../variables/MEDIA_ANSWER_FAILED.md) when the cause can't be told
apart. On the web the real `DOMException` is available so we read its `.name`;
the string form is also scanned as a fallback (and to stay in step with the
Dart classifier, which only has the collapsed `'Unable to getUserMedia: …'`).

## Parameters

### error

`unknown`

## Returns

`string`
