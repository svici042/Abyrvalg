import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('sorting keeps filters and resets local catalogue pagination', async ({
  page,
}) => {
  await page.goto('/?q=test&page=2')
  await page
    .getByRole('combobox', { name: 'Sorter etter' })
    .selectOption('price-desc')
  await expect(page).toHaveURL(/q=test&sort=price-desc/)
  await expect(page.getByText('Side 1 av 2')).toBeVisible()
  await page.getByRole('button', { name: 'Skjønnhet', exact: true }).click()
  await expect(page).toHaveURL(/category=beauty&sort=price-desc/)
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Sorter etter' }),
  ).toHaveValue('price-desc')
})

test('search requires explicit submission and retains focus', async ({
  page,
}) => {
  await page.goto('/')
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('/products/search?'))
      requests.push(request.url())
  })
  await page.getByRole('searchbox').pressSequentially('test', { delay: 60 })
  await page.waitForTimeout(600)
  expect(requests).toHaveLength(0)
  await page.getByRole('searchbox').press('Enter')
  await expect(page).toHaveURL(/q=test$/)
  await expect(page.getByRole('article')).toHaveCount(12)
  expect(requests).toHaveLength(1)
  await expect(page.getByRole('searchbox')).toBeFocused()
  await page.getByRole('searchbox').fill('discard')
  await page.getByRole('link', { name: 'Handlekurv, 0 varer' }).click()
  await page.waitForTimeout(550)
  await expect(page).toHaveURL(/\/cart$/)
  await page.goBack()
  await expect(page.getByRole('searchbox')).toHaveValue('test')
})

test('gallery wraps, supports keyboard and recent products survive refresh', async ({
  page,
}) => {
  await page.route('https://dummyjson.com/products/1', (route) =>
    route.fulfill({
      json: {
        id: 1,
        title: 'Gallery product',
        price: 9.99,
        category: 'beauty',
        stock: 3,
        rating: 4,
        images: ['/missing-a.png', '/missing-b.png', '/missing-c.png'],
        thumbnail: '',
      },
    }),
  )
  await page.addInitScript(() =>
    localStorage.setItem('abyrvalg-recent-enabled', 'true'),
  )
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Forrige bilde' }).click()
  await expect(page.getByText('Bilde 3 av 3')).toBeVisible()
  await page.getByRole('button', { name: 'Neste bilde' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Bilde 1 av 3')).toBeVisible()
  await page.getByRole('button', { name: 'Vis bilde 2' }).click()
  await expect(
    page.getByRole('button', { name: 'Vis bilde 2' }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.goto('/products/2')
  await expect(
    page.getByRole('region', { name: 'Nylig sett' }).getByRole('link'),
  ).toHaveCount(1)
  await page.goto('/')
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Nylig sett' }).getByRole('link'),
  ).toHaveCount(2)
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await expect(
    page.getByRole('region', { name: 'Recently viewed' }),
  ).toContainText('NOK')
})

test('navigation and checkout links have visible hover changes', async ({
  page,
}) => {
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click()
  await page
    .getByRole('button', { name: 'Bekreft tillegg', exact: true })
    .click()
  await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).click()
  const navigation = page.getByRole('link', { name: 'Utforsk', exact: true })
  await navigation.hover()
  await expect(navigation).toHaveCSS('text-decoration-line', 'underline')
  const checkout = page.getByRole('link', { name: 'Til demokassen' })
  const before = await checkout.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )
  await checkout.hover()
  expect(
    await checkout.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).not.toBe(before)
})
