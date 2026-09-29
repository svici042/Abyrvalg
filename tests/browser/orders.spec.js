import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

async function fillCustomer(page) {
  await page.locator('#name').fill('Demo Customer')
  await page.locator('#email').fill('demo@example.test')
  await page.locator('#address').fill('Fictional Road 12')
}

async function prepareCheckout(page) {
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click()
  await page
    .getByRole('button', { name: 'Bekreft tillegg', exact: true })
    .click()
  await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).click()
  await page.getByRole('link', { name: 'Til demokassen' }).click()
  await fillCustomer(page)
  await page.getByRole('button', { name: 'Kontroller bestillingen' }).click()
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('category API names, language persistence, conversion and no drift', async ({
  page,
}) => {
  await page.goto('/?category=beauty')
  await expect(
    page.getByRole('article').first().getByText('Skjønnhet', { exact: true }),
  ).toBeVisible()
  await page.getByRole('article').first().getByRole('link').click()
  await expect(
    page.getByRole('article').getByText('Skjønnhet', { exact: true }),
  ).toHaveCount(2)
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click()
  await page
    .getByRole('button', { name: 'Bekreft tillegg', exact: true })
    .click()
  await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).click()
  for (let index = 0; index < 3; index++) {
    await page
      .getByRole('combobox', { name: /Choose language|Velg språk/ })
      .selectOption('en')
    await page
      .getByRole('combobox', { name: /Currency|Valuta/ })
      .selectOption('USD')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible()
    await expect(page.getByRole('article')).toContainText('USD 9.99')
    await page
      .getByRole('combobox', { name: /Choose language|Velg språk/ })
      .selectOption('nb')
    await page
      .getByRole('combobox', { name: /Currency|Valuta/ })
      .selectOption('NOK')
    await expect(page.getByRole('article')).toContainText('104,90')
  }
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-cart'))[0].price,
    ),
  ).toBe(9.99)
  await page.getByRole('searchbox').fill('test')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('nb')
  await expect(page).toHaveURL(/q=test&page=2/)
  await expect(page.getByText('Side 2 av 2')).toBeVisible()
})

test('checkout validates, prevents duplicates, snapshots NOK and administers saved orders', async ({
  page,
}) => {
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click()
  await page
    .getByRole('button', { name: 'Bekreft tillegg', exact: true })
    .click()
  await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).click()
  await page.getByRole('link', { name: 'Til demokassen' }).click()
  await page.getByRole('button', { name: 'Kontroller bestillingen' }).click()
  await expect(page.getByText('Fyll inn et navn (minst 2 tegn).')).toBeVisible()
  await fillCustomer(page)
  await page.getByRole('button', { name: 'Kontroller bestillingen' }).click()
  const pay = page.getByRole('button', { name: 'Simuler betaling og bestill' })
  await pay.click()
  await expect(pay).toBeDisabled()
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 1 varer' }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await expect(
    page.getByRole('heading', { name: 'Your order is confirmed' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible()
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('abyrvalg-orders')),
  )
  expect(saved).toHaveLength(1)
  expect(saved[0].currency).toBe('NOK')
  expect(saved[0].totalMinor).toBe(10490)
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText(
    'NOK 104.90',
  )
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Your order is confirmed' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Demo orders' }).click()
  await page
    .getByRole('searchbox', { name: 'Search by order number or customer' })
    .fill('nobody')
  await expect(page.getByText('No orders to show')).toBeVisible()
  await page
    .getByRole('searchbox', { name: 'Search by order number or customer' })
    .fill('Demo Customer')
  await page.getByRole('link', { name: 'Open order' }).click()
  await page
    .getByRole('combobox', { name: 'Fulfilment status', exact: true })
    .selectOption('shipped')
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Fulfilment status', exact: true }),
  ).toHaveValue('shipped')
  await expect(page.getByText('Simulated paid', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Back to orders', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Fulfilment status', exact: true })
    .selectOption('new')
  await expect(page.getByText('No orders to show')).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Fulfilment status', exact: true })
    .selectOption('shipped')
  await page.getByRole('link', { name: 'Open order' }).click()
  await page.getByRole('button', { name: 'Delete order', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(
    page.getByRole('combobox', { name: 'Fulfilment status', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Delete order', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, delete order' }).click()
  await expect(page.getByText('No orders to show')).toBeVisible()
})

test('failed order write retains cart and retry succeeds once', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'abyrvalg-orders' && !window.allowOrders)
        throw new Error('Quota exceeded')
      return original.call(this, key, value)
    }
  })
  await prepareCheckout(page)
  await page
    .getByRole('button', { name: 'Simuler betaling og bestill' })
    .click()
  await expect(
    page.getByText('Ordren kunne ikke lagres.', { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 1 varer' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
  ).toBeNull()
  await page.evaluate(() => {
    window.allowOrders = true
  })
  await page
    .getByRole('button', { name: 'Simuler betaling og bestill' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Bestillingen er bekreftet' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-orders')).length,
    ),
  ).toBe(1)
})

test('invalid saved orders are not overwritten, and empty/missing routes are useful', async ({
  page,
}) => {
  await page.goto('/checkout')
  await expect(page.getByText('Her er det plass til gode funn')).toBeVisible()
  await page.evaluate(() => localStorage.setItem('abyrvalg-orders', '{invalid'))
  await page.goto('/admin/orders')
  await expect(
    page.getByText('Lagrede ordre kunne ikke leses.', { exact: false }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
  ).toBe('{invalid')
  await page
    .getByRole('button', { name: 'Nullstill ugyldige ordredata' })
    .click()
  await page.getByRole('button', { name: 'Avbryt' }).click()
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
  ).toBe('{invalid')
  await page.goto('/orders/missing')
  await expect(
    page.getByRole('heading', { name: 'Ordren finnes ikke' }),
  ).toBeVisible()
})

test('checkout, confirmation and admin fit mobile and desktop in both languages/themes', async ({
  page,
}) => {
  await prepareCheckout(page)
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const language of ['NO', 'EN']) {
      await page
        .getByRole('combobox', { name: /Choose language|Velg språk/ })
        .selectOption(language === 'EN' ? 'en' : 'nb')
      for (const theme of ['dark', 'light']) {
        const current = await page.locator('html').getAttribute('data-theme')
        if (current !== theme)
          await page.getByRole('button', { name: /Bytt til|Switch to/ }).click()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
        await page.screenshot({
          path: `test-results/checkout-${width}-${language}-${theme}.png`,
          fullPage: true,
        })
      }
    }
  }
  await page
    .getByRole('button', { name: 'Simulate payment and place order' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Your order is confirmed' }),
  ).toBeVisible()
  const confirmation = page.url()
  for (const route of [confirmation, '/admin/orders']) {
    await page.goto(route)
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const language of ['NO', 'EN']) {
        await page
          .getByRole('combobox', { name: /Choose language|Velg språk/ })
          .selectOption(language === 'EN' ? 'en' : 'nb')
        for (let index = 0; index < 2; index++) {
          await page.getByRole('button', { name: /Bytt til|Switch to/ }).click()
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true)
        }
      }
    }
  }
})

for (const purchaseLanguage of ['NO', 'EN']) {
  test(`admin transaction currency stays fixed for ${purchaseLanguage} purchases`, async ({
    page,
  }) => {
    await prepareCheckout(page)
    await page
      .getByRole('combobox', { name: /Choose language|Velg språk/ })
      .selectOption(purchaseLanguage === 'EN' ? 'en' : 'nb')
    await page
      .getByRole('button', {
        name: /Simuler betaling og bestill|Simulate payment and place order/,
      })
      .click()
    await expect(page).toHaveURL(/\/orders\/AB-/)
    const saved = await page.evaluate(() =>
      localStorage.getItem('abyrvalg-orders'),
    )
    const order = JSON.parse(saved)[0]
    for (const route of ['/admin/orders', `/admin/orders/${order.id}`]) {
      await page.goto(route)
      for (const language of ['EN', 'NO', 'EN']) {
        await page
          .getByRole('combobox', { name: /Choose language|Velg språk/ })
          .selectOption(language === 'EN' ? 'en' : 'nb')
        const amount =
          route === '/admin/orders'
            ? page.getByRole('article')
            : page.getByRole('region', { name: /Summary|Oppsummering/ })
        await expect(amount).toContainText('NOK')
        await expect(amount).toContainText(
          language === 'EN' ? '104.90' : '104,90',
        )
      }
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    }
    expect(
      await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
    ).toBe(saved)
  })
}

test('category labels follow language in filters and product details', async ({
  page,
}) => {
  await page.goto('/?category=beauty')
  await expect(
    page.getByRole('button', { name: 'Skjønnhet', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await expect(
    page.getByRole('button', { name: 'Beauty', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Beauty', exact: true }),
  ).toBeVisible()
  await page.getByRole('article').first().getByRole('link').click()
  await expect(
    page.getByRole('article').getByText('Beauty', { exact: true }),
  ).toHaveCount(2)
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('nb')
  await expect(
    page.getByRole('article').getByText('Skjønnhet', { exact: true }),
  ).toHaveCount(2)
  await page.reload()
  await expect(
    page.getByRole('article').getByText('Skjønnhet', { exact: true }),
  ).toHaveCount(2)
})
