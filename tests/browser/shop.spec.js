import { test, expect } from '@playwright/test'

import { mockApi } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('server pagination, URL history, search, categories and empty results', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page.getByText('Side 1 av 3')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Forrige' })).toBeDisabled()
  await page.getByRole('button', { name: 'Neste' }).click()
  await expect(
    page.getByRole('heading', { name: 'Produkt 13', exact: true }),
  ).toBeVisible()
  await page.goBack()
  await expect(page.getByText('Side 1 av 3')).toBeVisible()
  await page.goForward()
  await expect(page.getByText('Side 2 av 3')).toBeVisible()
  await page.getByRole('button', { name: 'Neste' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Neste' })).toBeDisabled()
  await page.getByRole('button', { name: 'Skjønnhet', exact: true }).click()
  await expect(page).toHaveURL(/category=beauty$/)
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.getByRole('searchbox').fill('test')
  await page.getByRole('button', { name: 'Søk', exact: true }).click()
  await expect(page).toHaveURL(/\?q=test$/)
  await expect(page.getByText('Side 1 av 2')).toBeVisible()
  await page.getByRole('searchbox').fill('tomt')
  await page.getByRole('button', { name: 'Søk', exact: true }).click()
  await expect(page.getByText('Ingen produkter funnet')).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Produktsider' }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Tøm søk' }).click()
  await page.getByRole('button', { name: 'Søk', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(12)
  await page.goto('/?page=-4')
  await expect(page.getByText('Side 1 av 3')).toBeVisible()
  await page.goto('/?page=99')
  await expect(page.getByText('Side 3 av 3')).toBeVisible()
})

test('direct detail, stock limits, cart totals, persistence and theme', async ({
  page,
}) => {
  await page.goto('/products/1')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Ikke oppgitt')).toBeVisible()
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click()
  await page.getByRole('dialog').getByRole('spinbutton').fill('2')
  await page.getByRole('dialog').getByRole('spinbutton').press('Enter')
  await page.getByRole('button', { name: 'Bekreft tillegg' }).click()
  await page.getByRole('link', { name: 'Handlekurv, 2 varer' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('spinbutton')).toHaveValue('2')
  await expect(page.getByText(/209,80/)).toHaveCount(2)
  await page.getByRole('spinbutton').fill('9')
  await page.getByRole('spinbutton').press('Enter')
  await expect(page.getByRole('spinbutton')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await page.getByRole('spinbutton').fill('3')
  await page.getByRole('spinbutton').press('Enter')
  await expect(page.getByRole('spinbutton')).toHaveValue('3')
  await expect(
    page.getByRole('button', { name: 'Flere Produkt 1' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Bytt til mørkt tema' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 3 varer' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Fjern Produkt 1' }).click()
  await expect(page.getByText('Her er det plass til gode funn')).toBeVisible()
  await page.getByRole('searchbox').fill('test')
  await page.getByRole('button', { name: 'Søk', exact: true }).click()
  await expect(page).toHaveURL(/\?q=test$/)
})

test('bad storage, missing routes and mobile layout in both themes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('abyrvalg-cart', '{bad')
    localStorage.setItem('abyrvalg-theme', '"invalid"')
  })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(
    page.getByText('Lagrede data kunne ikke leses. Standardverdier brukes.'),
  ).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(12)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/mobile-light.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Bytt til mørkt tema' }).click()
  await page.screenshot({
    path: 'test-results/mobile-dark.png',
    fullPage: true,
  })
  await page.goto('/products/9999')
  await expect(page.getByText('Produktet finnes ikke')).toBeVisible()
  await page.goto('/finnes-ikke')
  await expect(page.getByText('404 – Her var det tomt')).toBeVisible()
})

test('loading, independent API errors and retry', async ({ page }) => {
  await page.route('https://dummyjson.com/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.fulfill({ status: 500, json: { message: 'Temporary error' } })
  })
  await page.goto('/')
  await expect(page.getByText('Laster produkter …')).toBeVisible()
  await expect(page.getByText('Vi fikk ikke hentet produktene')).toBeVisible()
  await expect(page.getByText('Kunne ikke hente kategorier.')).toBeVisible()
  await mockApi(page)
  await page
    .getByRole('alert')
    .filter({ hasText: 'Kunne ikke hente kategorier.' })
    .getByRole('button')
    .click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'Vi fikk ikke hentet produktene' })
    .getByRole('button')
    .click()
  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(
    page.getByRole('button', { name: 'Skjønnhet', exact: true }),
  ).toBeVisible()
})

test('storage access denied keeps cart usable and shows a warning', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Denied')
      },
    })
  })
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click()
  await page
    .getByRole('button', { name: 'Bekreft tillegg', exact: true })
    .click()
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 1 varer' }),
  ).toBeVisible()
  await expect(
    page.getByText('Kunne ikke lagre.', { exact: false }),
  ).toBeVisible()
})
