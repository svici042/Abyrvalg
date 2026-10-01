import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

test.use({ isMobile: true, hasTouch: true })

for (const width of [320, 360, 390, 430]) {
  test(`mobile shopping and orders at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await mockApi(page)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    async function checkLayout(name) {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: `test-results/mobile-${width}-${name}.png`,
        fullPage: true,
      })
    }

    await page.goto('/')
    await expect(page.getByRole('article')).toHaveCount(12)
    await checkLayout('catalogue')
    await page.getByLabel('Velg kategori').selectOption('beauty')
    await expect(page.getByRole('article')).toHaveCount(2)
    await page.getByRole('searchbox').fill('test')
    await page.getByRole('button', { name: 'Søk', exact: true }).tap()
    await page.getByRole('button', { name: 'Neste' }).tap()
    await expect(page.getByText('Side 2 av 2')).toBeVisible()
    await page.getByRole('article').first().getByRole('link').tap()
    await page.reload()
    await page.getByRole('button', { name: 'Legg i handlekurv' }).tap()
    await page
      .getByRole('button', { name: 'Bekreft tillegg', exact: true })
      .click()
    await checkLayout('product')
    await page.getByRole('link', { name: 'Handlekurv, 1 varer' }).tap()
    await page.getByRole('button', { name: 'Flere Produkt' }).tap()
    await expect(page.getByRole('spinbutton')).toHaveValue('2')
    await checkLayout('cart')
    await page.getByRole('combobox', { name: 'Velg språk' }).selectOption('en')
    await page.getByRole('button', { name: 'Switch to dark theme' }).tap()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('link', { name: 'Go to demo checkout' }).tap()
    await page.getByLabel('Name', { exact: true }).fill('Mobile Demo')
    await page.getByLabel('Email', { exact: true }).fill('mobile@example.test')
    await page.getByLabel('Delivery address').fill('Fictional street 12')
    await page.getByRole('button', { name: 'Review order' }).tap()
    await checkLayout('checkout')
    await page
      .getByRole('button', { name: 'Simulate payment and place order' })
      .tap()
    await expect(
      page.getByRole('heading', { name: 'Your order is confirmed' }),
    ).toBeVisible()
    await checkLayout('confirmation')
    await page
      .getByRole('link', { name: 'Demo administration', exact: true })
      .tap()
    await page
      .getByRole('link', { name: 'Demo orders', exact: true })
      .first()
      .tap()
    await page.getByRole('link', { name: 'Open order' }).tap()
    await expect(page).toHaveURL(/\/admin\/orders\/AB-/)
    await page
      .getByRole('combobox', { name: 'Fulfilment status', exact: true })
      .selectOption('shipped')
    await expect(
      page.getByText('Order updated.', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('combobox', { name: 'Fulfilment status' }),
    ).toHaveValue('shipped')
    await checkLayout('admin')
    expect(errors).toEqual([])
  })
}
