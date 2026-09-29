import { test, expect } from '@playwright/test'
import { mockApi } from '../browser/fixtures.js'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('production base restores direct product URLs, queries, fragments and refreshes', async ({
  page,
}) => {
  await page.goto('/Abyrvalg/products/1?source=pages#main')
  await expect(page.locator('meta[name="app-base-path"]')).toHaveAttribute(
    'content',
    '/Abyrvalg/',
  )
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(
    'http://127.0.0.1:4174/Abyrvalg/products/1?source=pages#main',
  )

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(
    'http://127.0.0.1:4174/Abyrvalg/products/1?source=pages#main',
  )
})

test('production restoration keeps valid and malformed fragments usable', async ({
  page,
}) => {
  await page.goto('/Abyrvalg/#catalogue')
  await expect(page).toHaveURL(/\/Abyrvalg\/#catalogue$/)
  await expect(page.getByRole('article')).toHaveCount(12)
  await expect
    .poll(() =>
      page
        .locator('#catalogue')
        .evaluate((element) => Math.abs(element.getBoundingClientRect().top)),
    )
    .toBeLessThan(30)

  await page.goto('/Abyrvalg/products/1?source=pages#%')
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/Abyrvalg\/products\/1\?source=pages#%$/)
  await expect(page.getByRole('main')).toBeFocused()
})

test('invalid stored URLs are discarded without changing the route', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('github-pages-redirect', 'not a valid URL')
  })
  await page.goto('/Abyrvalg/')

  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page).toHaveURL('http://127.0.0.1:4174/Abyrvalg/')
  expect(
    await page.evaluate(() =>
      window.sessionStorage.getItem('github-pages-redirect'),
    ),
  ).toBeNull()
})

test('destinations outside the exact app base path are rejected', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      'github-pages-redirect',
      `${window.location.origin}/Abyrvalg-evil/products/1`,
    )
  })
  await page.goto('/Abyrvalg/')

  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page).toHaveURL('http://127.0.0.1:4174/Abyrvalg/')
})

test('unavailable session storage leaves the 404 fallback link usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      },
    })
  })
  await page.goto('/Abyrvalg/products/1')

  const fallback = page.getByRole('link', {
    name: 'Go to the Abyrvalg home page',
  })
  await expect(fallback).toBeVisible()
  await expect(fallback).toHaveAttribute('href', '/Abyrvalg/')
})

test('unavailable session storage does not prevent app startup', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      },
    })
  })
  await page.goto('/Abyrvalg/')

  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page).toHaveURL('http://127.0.0.1:4174/Abyrvalg/')
})
