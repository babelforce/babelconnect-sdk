import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'babelconnect SDKs',
  tagline: 'Build agent experiences on babelconnect — TypeScript, Go, and the gRPC/REST contract',
  favicon: 'img/favicon.ico',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Production URL + base path for GitHub Pages (babelforce.github.io/babelconnect-sdk/).
  url: 'https://babelforce.github.io',
  baseUrl: '/babelconnect-sdk/',

  organizationName: 'babelforce',
  projectName: 'babelconnect-sdk',

  onBrokenLinks: 'throw',
  // Generated proto/TypeDoc markdown carries protoc-gen-doc `<a name>` anchors + intra-page `#…`
  // links that don't map to Docusaurus heading slugs — warn instead of failing the build.
  onBrokenAnchors: 'warn',

  // Parse `.md` as CommonMark (not MDX) so generated reference files containing `map<…>`, `<…>`,
  // and `{…}` (proto md, TypeDoc output) don't break the MDX compiler. `.mdx` stays MDX.
  markdown: {
    format: 'detect',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/babelforce/babelconnect-sdk/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // Offline full-text search (no Algolia/network): builds a static index at build time
  // and adds the navbar search box.
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/babelconnect-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'babelconnect SDKs',
      logo: {
        alt: 'babelforce',
        src: 'img/babelforce-b.png',           // dark plum 'b' mark — light mode
        srcDark: 'img/babelforce-b-white.png',  // white 'b' mark — dark mode
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/docs/typescript/getting-started', label: 'TypeScript', position: 'left'},
        {to: '/docs/go/getting-started', label: 'Go', position: 'left'},
        {to: 'pathname:///reference/rest/', label: 'REST API', position: 'left'},
        {to: 'pathname:///reference/events/', label: 'Events API', position: 'left'},
        {
          href: 'https://github.com/babelforce',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Tutorial', to: '/docs/tutorial/first-softphone'},
            {label: 'State & events', to: '/docs/concepts/state-and-events'},
            {label: 'Intents reference', to: '/docs/concepts/intents'},
            {label: 'Glossary', to: '/docs/concepts/glossary'},
            {label: 'Recipes', to: '/docs/guides/recipes'},
            {label: 'TypeScript vs Go', to: '/docs/guides/typescript-vs-go'},
            {label: 'Authentication', to: '/docs/guides/authentication'},
            {label: 'Troubleshooting', to: '/docs/guides/troubleshooting'},
          ],
        },
        {
          title: 'Reference',
          items: [
            {label: 'gRPC / proto', to: '/docs/protocol/grpc'},
            {label: 'REST / OpenAPI', href: 'pathname:///reference/rest/'},
            {label: 'Events / AsyncAPI', href: 'pathname:///reference/events/'},
          ],
        },
        {
          title: 'SDKs',
          items: [
            {label: 'TypeScript (npm)', href: 'https://www.npmjs.com/package/@babelforce/babelconnect-sdk'},
            {label: 'Go (pkg.go.dev)', href: 'https://pkg.go.dev/github.com/babelforce/babelconnect-sdk-go'},
            {label: 'Proto contract', href: 'https://github.com/babelforce/babelconnect-proto'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'babelforce on GitHub', href: 'https://github.com/babelforce'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} babelforce GmbH. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      // `ts`/`go`/`json`/`html` ship with prism-react-renderer; `bash` (the `sh`
      // alias) and `http` do not, so the shell and OAuth/REST examples need them.
      additionalLanguages: ['bash', 'http'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
