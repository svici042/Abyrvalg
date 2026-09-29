import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'
import english from '../../src/i18n/products.en.js'
import norwegian from '../../src/i18n/products.nb.js'

test('product language follows selection throughout shopping and saved orders', async ({
  page,
}) => {
  await mockApi(page)
  await page.addInitScript(() =>
    localStorage.setItem('abyrvalg-recent-enabled', 'true'),
  )
  const product = {
    id: 2,
    ...english[2],
    price: 9.99,
    stock: 3,
    category: 'beauty',
    rating: 4,
    thumbnail: '',
    images: [],
  }
  await page.route('https://dummyjson.com/products/2', (route) =>
    route.fulfill({ json: product }),
  )
  await page.route('https://dummyjson.com/products?*', (route) =>
    route.fulfill({
      json: { products: [product], total: 1, skip: 0, limit: 12 },
    }),
  )
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: norwegian[2].title, exact: true }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await expect(
    page.getByRole('heading', { name: english[2].title, exact: true }),
  ).toBeVisible()
  await page.getByRole('article').getByRole('link').click()
  await expect(
    page.getByText(english[2].description, { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('nb')
  await expect(
    page.getByText(norwegian[2].description, { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Legg i handlekurv', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Bekreft tillegg', exact: true })
    .click()
  await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).click()
  await expect(
    page.getByRole('heading', { name: norwegian[2].title }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await expect(
    page.getByRole('heading', { name: english[2].title }),
  ).toBeVisible()
  const cart = await page.evaluate(() => localStorage.getItem('abyrvalg-cart'))
  await page.getByRole('link', { name: 'Go to demo checkout' }).click()
  await page.locator('#name').fill('Demo Customer')
  await page.locator('#email').fill('demo@example.test')
  await page.locator('#address').fill('Example Road 12')
  await page.getByRole('button', { name: 'Review order', exact: true }).click()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('nb')
  await expect(
    page.getByRole('region', { name: 'Oppsummering' }),
  ).toContainText(norwegian[2].title)
  expect(await page.evaluate(() => localStorage.getItem('abyrvalg-cart'))).toBe(
    cart,
  )
  await page
    .getByRole('button', { name: 'Simuler betaling og bestill' })
    .click()
  await expect(page).toHaveURL(/\/orders\/AB-/)
  const saved = await page.evaluate(() =>
    localStorage.getItem('abyrvalg-orders'),
  )
  const order = JSON.parse(saved)[0]
  expect(order.lines[0].title).toBe(english[2].title)
  for (const route of [page.url(), `/admin/orders/${order.id}`]) {
    await page.goto(route)
    for (const [button, title, region] of [
      ['EN', english[2].title, 'Summary'],
      ['NO', norwegian[2].title, 'Oppsummering'],
    ]) {
      await page
        .getByRole('combobox', { name: /Choose language|Velg språk/ })
        .selectOption(button === 'EN' ? 'en' : 'nb')
      await expect(page.getByRole('region', { name: region })).toContainText(
        title,
      )
    }
  }
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
  ).toBe(saved)
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Nylig sett' })).toContainText(
    norwegian[2].title,
  )
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Recently viewed' }),
  ).toContainText(english[2].title)
})
