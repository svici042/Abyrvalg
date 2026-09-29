import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

test('local development starts at / and direct product routes survive refresh', async ({
  page,
}) => {
  await mockApi(page)
  await page.goto('/')

  await expect(page.locator('meta[name="app-base-path"]')).toHaveAttribute(
    'content',
    '/',
  )
  const scriptOrder = await page.evaluate(() =>
    Array.from(document.scripts, (script) => ({
      src: script.getAttribute('src'),
      type: script.type,
    })),
  )
  const restoreIndex = scriptOrder.findIndex((script) =>
    script.src?.endsWith('/github-pages-restore.js'),
  )
  const appModuleIndex = scriptOrder.findIndex((script) =>
    script.src?.includes('/src/main.jsx'),
  )

  expect(restoreIndex).toBeGreaterThanOrEqual(0)
  expect(appModuleIndex).toBeGreaterThan(restoreIndex)

  await page.goto('/products/1?source=local#main')
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/products\/1\?source=local#main$/)

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/products\/1\?source=local#main$/)
})
