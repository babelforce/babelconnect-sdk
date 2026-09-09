# Function: passwordGrant()

```ts
function passwordGrant(opts): Promise<string>
```

Exchange an agent email/password for a bearer token via babelconnect-server's
OAuth password-grant endpoint (`POST {serverUrl}/oauth/token`).

`serverUrl` is the babelconnect-server origin (the same one used for gRPC-web).
This is a convenience for local runs/tests; production hosts
typically obtain a token through their own login and pass it to
[BabelconnectClient.connect](../classes/BabelconnectClient.md#connect) / `BabelconnectEmbed.mount`.

## Parameters

### opts

#### clientId

`string`

OAuth client id (defaults to `"manager"`)

#### pass

`string`

agent password

#### serverUrl

`string`

babelconnect-server origin, e.g. `https://agent.example.com`

#### user

`string`

agent username/email

## Returns

`Promise`\<`string`\>

the `access_token`
