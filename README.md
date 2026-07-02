# babelconnect developer docs

Source for the **babelconnect developer documentation** — the SDKs and the gRPC/REST contract for
building agent experiences (softphone, CTI, messaging) on babelconnect.

**Live site:** https://babelforce.github.io/babelconnect-sdk/

It covers all the babelconnect SDKs:

- **TypeScript SDK** — [`@babelforce/babelconnect-sdk`](https://www.npmjs.com/package/@babelforce/babelconnect-sdk) (npm)
- **Go SDK** — [`github.com/babelforce/babelconnect-sdk-go`](https://pkg.go.dev/github.com/babelforce/babelconnect-sdk-go)
- **Protocol** — the `babelconnect.v1` gRPC contract and its REST/OpenAPI projection

Built with [Docusaurus](https://docusaurus.io/). The API references (TypeScript TypeDoc, the gRPC
contract, and the OpenAPI/Redoc reference) are generated.

## Local development

Requires Node 20+.

```sh
npm install
npm start          # dev server with hot reload
npm run build      # production build into build/
npm run serve      # serve the production build locally
```

## License

Documentation © babelforce GmbH. Each SDK is licensed under Apache-2.0 in its own repository.
