import path from 'node:path'
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { unheadVueComposablesImports } from '@unhead/vue'
import Vuetify from 'vite-plugin-vuetify'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { autoImports, settingsPath } from '@data-fair/lib-vuetify/vite.js'
import { commonjsDeps } from '@koumoul/vjsf/utils/build.js'
import dotenv from 'dotenv'
dotenv.config({ path: import.meta.resolve('../.env').replace('file://', '') })

// Every vuetify component and directive, as the deep imports vite-plugin-vuetify injects at transform
// time — which is why the dependency scan never sees them (see optimizeDeps below).
const vuetifyDir = path.dirname(createRequire(import.meta.url).resolve('vuetify/package.json'))
const vuetifyDeps = ['components', 'directives'].flatMap(kind =>
  readdirSync(path.join(vuetifyDir, 'lib', kind), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `vuetify/${kind}/${entry.name}`))

export default defineConfig({
  base: '/agents',
  // ALL the dependencies, known at startup. Left to discovery, vite finds a dependency the first time a
  // page imports it, re-optimises, and RELOADS every open page — mid-test, on a dev server whose cache
  // was just invalidated (a dependency or config change). That failed whichever e2e test was on screen,
  // a different one each run. The scan misses two kinds: the pages, reached only through the router's
  // virtual auto-routes module (hence `entries`), and the vuetify components the vuetify plugin injects.
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.vue', 'src/**/*.ts'],
    include: [...commonjsDeps, 'ajv/dist/runtime/ucs2length', 'easymde', ...vuetifyDeps]
  },
  resolve: {
    alias: [
      { find: '~', replacement: path.resolve(__dirname, 'src/') },
      // The compiled vjsf forms import it with an interop only vite's dev mode satisfies: see the file.
      { find: /^ajv\/dist\/runtime\/ucs2length\.js$/, replacement: path.resolve(__dirname, 'src/utils/ajv-ucs2length.ts') }
    ]
  },
  html: {
    cspNonce: '{CSP_NONCE}'
  },
  plugins: [
    VueRouter({
      dts: './dts/typed-router.d.ts'
    }),
    Vue({ template: { compilerOptions: { isCustomElement: (tag) => ['d-frame'].includes(tag) } } }),
    VueI18nPlugin(),
    Vuetify({ styles: { configFile: settingsPath } }),
    AutoImport({
      dts: './dts/auto-imports.d.ts',
      vueTemplate: true,
      imports: [
        ...(autoImports as any),
        unheadVueComposablesImports,
        {
          '~/context': ['$uiConfig', '$sitePath', '$cspNonce', '$apiPath', '$fetch']
        }
      ],
      dirs: [
        'src/utils',
        'src/composables'
      ]
    }),
    Components(),
    {
      name: 'inject-site-context',
      async transformIndexHtml (html) {
        if (process.env.NODE_ENV !== 'development') return html
        const { uiConfigPath } = (await import('@data-fair/lib-express')).prepareUiConfig((await import('../api/src/ui-config.ts')).uiConfig)
        return microTemplate(html, { SITE_PATH: '', UI_CONFIG_PATH: uiConfigPath, THEME_CSS_HASH: '', PUBLIC_SITE_INFO_HASH: '' })
      }
    }
  ],
  server: {
    port: parseInt(process.env.DEV_UI_PORT!),
    // Fail on a taken port instead of drifting to the next free one. Nginx proxies
    // to DEV_UI_PORT and nowhere else, so a vite that quietly moved to port+1 is not
    // a degraded dev server — it is an invisible one, and every request through the
    // proxy answers 502. A restart that races the instance it replaces hits exactly
    // this: the outgoing sockets are still bound a second later. Better a refusal at
    // startup, naming the port, than an e2e suite failing as if the code were broken.
    strictPort: true,
    hmr: { port: parseInt(process.env.DEV_UI_HMR_PORT!) }
  },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
})
