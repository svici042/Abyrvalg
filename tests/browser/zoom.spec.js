import { test, expect, chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { mockApi } from './fixtures'

test('real Chromium zoom keeps shopping routes within the viewport', async ({
  baseURL,
}, testInfo) => {
  // A temporary test extension uses the browser’s actual zoom controls.
  const extension = testInfo.outputPath('zoom-extension')
  await fs.mkdir(extension, { recursive: true })
  await fs.writeFile(
    path.join(extension, 'manifest.json'),
    JSON.stringify({
      manifest_version: 3,
      name: 'Local zoom verification',
      version: '1.0',
      permissions: ['tabs', 'fontSettings'],
      background: { service_worker: 'background.js' },
    }),
  )
  await fs.writeFile(
    path.join(extension, 'background.js'),
    'chrome.runtime.onInstalled.addListener(() => {})',
  )
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: null,
    args: [
      '--window-size=1280,900',
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  })
  try {
    const worker =
      context.serviceWorkers()[0] ||
      (await context.waitForEvent('serviceworker'))
    const page = context.pages()[0] || (await context.newPage())
    await worker.evaluate(() =>
      chrome.fontSettings.setDefaultFontSize({ pixelSize: 20 }),
    )
    await mockApi(page)
    await page.goto(`${baseURL}/products/1`)
    await page
      .getByRole('button', { name: 'Legg i handlekurv', exact: true })
      .click()
    await page.getByRole('button', { name: 'Bekreft tillegg' }).click()
    await expect(page.locator('html')).toHaveCSS('font-size', '20px')
    for (const zoom of [2, 4]) {
      const actual = await worker.evaluate(async (factor) => {
        const [tab] = await chrome.tabs.query({ url: 'http://127.0.0.1/*' })
        await chrome.tabs.setZoom(tab.id, factor)
        return chrome.tabs.getZoom(tab.id)
      }, zoom)
      expect(actual).toBeCloseTo(zoom, 5)
      for (const route of [
        '/',
        '/products/1',
        '/cart',
        '/checkout',
        '/admin/orders',
      ]) {
        await page.goto(`${baseURL}${route}`)
        await expect(page.locator('main h1')).toBeVisible()
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
          )
          .toBe(true)
        expect(
          await page.evaluate(() => window.innerWidth),
        ).toBeLessThanOrEqual(1280 / zoom)
      }
    }
  } finally {
    await context.close()
  }
})
