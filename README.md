# babelconnect developer docs

Source for the **babelconnect developer documentation** — the SDKs and the gRPC/REST contract for
building agent experiences (softphone, CTI, messaging) on babelconnect.

**Live site:** https://babelforce.github.io/babelconnect-sdk/

Start with the [TypeScript softphone tutorial](https://babelforce.github.io/babelconnect-sdk/docs/tutorial/first-softphone),
[embedding guide](https://babelforce.github.io/babelconnect-sdk/docs/typescript/embedding), or
[Go availability notes](https://babelforce.github.io/babelconnect-sdk/docs/go/getting-started).

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
