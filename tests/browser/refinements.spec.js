import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'
import english from '../../src/i18n/products.en.js'
import norwegian from '../../src/i18n/products.nb.js'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('translation loading recovers after a transient failure on language re-selection', async ({
  page,
}) => {
  let failed = false
  await page.route('**/nb-1-50*.json', async (route) => {
    if (!failed) {
      failed = true
      await route.abort()
    } else await route.continue()
  })
  await page.route('https://dummyjson.com/products/1', (route) =>
    route.fulfill({
      json: {
        id: 1,
        ...english[1],
        stock: 3,
        price: 9.99,
        category: 'beauty',
        images: [],
      },
    }),
  )
  await page.goto('/products/1')
  await expect(
    page.getByRole('heading', { name: english[1].title, exact: true }),
  ).toBeVisible()
  await expect.poll(() => failed).toBe(true)
  await page.getByRole('combobox', { name: 'Velg språk' }).selectOption('en')
  await page
    .getByRole('combobox', { name: 'Choose language' })
    .selectOption('nb')
  await expect(
    page.getByRole('heading', { name: norwegian[1].title, exact: true }),
  ).toBeVisible()
})

test('history and order deletion failures remain announced inside the modal with retry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('unrelated-key', 'keep')
    const remove = Storage.prototype.removeItem
    Storage.prototype.removeItem = function (key) {
      if (
        window.failDeletion &&
        ['abyrvalg-recent', 'abyrvalg-orders'].includes(key)
      )
        throw new Error('Storage unavailable')
      return remove.call(this, key)
    }
  })
  for (const kind of ['history', 'orders']) {
    await page.goto(kind === 'history' ? '/' : '/admin/orders')
    if (kind === 'history')
      await page.getByText('Historikkvalg', { exact: true }).click()
    await page.evaluate(() => {
      window.failDeletion = true
    })
    await page
      .getByRole('button', {
        name:
          kind === 'history'
            ? 'Slett produkthistorikk'
            : 'Slett alle demoordre',
      })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Bekreft sletting' }).click()
    await expect(dialog.getByRole('alert')).toContainText('Kunne ikke slette')
    await expect(dialog.getByRole('button', { name: 'Avbryt' })).toBeEnabled()
    await expect(
      page.getByRole('status').filter({ hasText: 'Lokale data er oppdatert.' }),
    ).toHaveCount(0)
    await page.evaluate(() => {
      window.failDeletion = false
    })
    await dialog.getByRole('button', { name: 'Bekreft sletting' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByRole('status').filter({ hasText: 'Lokale data er oppdatert.' }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => localStorage.getItem('unrelated-key')),
    ).toBe('keep')
  }
})

test('Back and Forward restore position without stealing focus; fragments remain usable', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12)
  await page.getByRole('article').nth(6).scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  const productLink = page.getByRole('article').nth(6).getByRole('link')
  await productLink.focus()
  await productLink.click()
  await expect(page.getByRole('main')).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  const addToCart = page.getByRole('button', { name: 'Legg i handlekurv' })
  await addToCart.focus()
  await expect(addToCart).toBeFocused()
  const productPosition = await page.evaluate(() => scrollY)
  await page.goBack()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, 0)
  await expect(page.getByRole('main')).not.toBeFocused()
  await page.goForward()
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeCloseTo(productPosition, 0)
  await expect(page.getByRole('main')).not.toBeFocused()
  await page.goto('/#catalogue')
  await expect
    .poll(() =>
      page
        .locator('#catalogue')
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(30)
})

test('valid and malformed fragments navigate and focus a usable target', async ({
  page,
}) => {
  await page.goto('/#%')
  await expect(page).toHaveURL(/#%$/)
  await expect(page.getByRole('main')).toBeFocused()

  await page.goto('/#missing-target')
  await expect(page.getByRole('main')).toBeFocused()

  await page.goto('/')
  await page.getByRole('link', { name: 'Utforsk utvalget' }).click()
  await expect(page).toHaveURL(/#catalogue$/)
  await expect(page.locator('#catalogue')).toBeVisible()
  await expect
    .poll(() =>
      page
        .locator('#catalogue')
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(30)
})

test('small cart thumbnails keep their fallback inside the image frame', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/products/1')
  await page
    .getByRole('button', { name: 'Legg i handlekurv', exact: true })
    .click()
  await page.getByRole('button', { name: 'Bekreft tillegg' }).click()
  await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).click()
  const fallback = page.getByRole('img', { name: /Bilde ikke tilgjengelig/ })
  expect(
    await fallback.evaluate((el) => {
      const inner = el.getBoundingClientRect()
      const frame = el.parentElement.getBoundingClientRect()
      return (
        inner.top >= frame.top &&
        inner.bottom <= frame.bottom &&
        inner.left >= frame.left &&
        inner.right <= frame.right
      )
    }),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/final-cart-320.png',
    fullPage: true,
  })
})
