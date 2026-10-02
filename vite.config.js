import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// Pages cannot set response headers. Reuse the production resource policy in HTML;
// frame-ancestors only works as a response header and is deliberately omitted here.
const headerPolicy = readFileSync(
  new URL('./netlify.toml', import.meta.url),
  'utf8',
).match(/Content-Security-Policy = "([^"]+)"/)[1]
const metaPolicy = headerPolicy.replace(/; frame-ancestors 'none'/, '')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'production-security-meta',
      apply: 'build',
      transformIndexHtml() {
        // Development uses Vite's injected styles and React refresh scripts.
        return [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: metaPolicy,
            },
            injectTo: 'head-prepend',
          },
          {
            tag: 'meta',
            attrs: { name: 'referrer', content: 'no-referrer' },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  ],
  base: process.env.GITHUB_PAGES === 'true' ? '/Abyrvalg/' : '/',
})
