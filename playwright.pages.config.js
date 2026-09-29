import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/pages-e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/pages-e2e/server.js',
    url: 'http://127.0.0.1:4174/Abyrvalg/',
    reuseExistingServer: !process.env.CI,
  },
})
