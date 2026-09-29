import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { mockApi } from './fixtures'
import { contrast, renderedPair } from './contrast'

for (const theme of ['light', 'dark']) {
  test(
    'semantic contrast and shopping states in ' + theme,
    async ({ page }, testInfo) => {
      const measurements = {}
      async function measure(
        name,
        locator,
        minimum = 4.5,
        property = 'color',
        pseudo = null,
      ) {
        const colors = await renderedPair(
          locator,
          property,
          'backgroundColor',
          pseudo,
        )
        const ratio = contrast(...colors)
        measurements[name] = {
          colors,
          ratio: Number(ratio.toFixed(2)),
          minimum,
        }
        expect(ratio, name).toBeGreaterThanOrEqual(minimum)
      }
      async function screenshot(name) {
        await page.screenshot({
          path: `test-results/palette-${theme}-${name}.png`,
          fullPage: true,
        })
      }
      await mockApi(page)
      await page.addInitScript((theme) => {
        localStorage.setItem('abyrvalg-theme', JSON.stringify(theme))
        localStorage.setItem('abyrvalg-language', '"en"')
      }, theme)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/')
      await expect(page.getByRole('article')).toHaveCount(12)
      await measure('body text', page.locator('h1'))
      await measure('secondary text', page.locator('footer p').first())
      await measure(
        'link',
        page.getByRole('link', { name: 'Explore', exact: true }),
      )
      const search = page.getByRole('searchbox')
      await measure('placeholder', search, 4.5, 'color', '::placeholder')
      await measure(
        'search boundary',
        page.getByRole('search'),
        3,
        'borderTopColor',
      )
      const selected = page.getByRole('button', {
        name: 'All products',
        exact: false,
      })
      await measure('selected category', selected)
      await selected.hover()
      await measure('selected category hover', selected)
      await search.focus()
      await measure('focus ring', search, 3, 'outlineColor')
      await screenshot('selected-focus')
      await page.goto('/products/1')
      const add = page.getByRole('button', { name: 'Add to cart', exact: true })
      await measure('primary action', add)
      await measure('cart badge', page.locator('header nav span'))
      await add.hover()
      await measure('primary hover', add)
      await add.click()
      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('spinbutton')
      await measure('input boundary', input, 3, 'borderTopColor')
      for (const invalid of ['', '-1', '1.5', '4']) {
        await input.fill(invalid)
        await input.press('Enter')
        await expect(
          dialog.getByRole('button', { name: 'Confirm addition' }),
        ).toBeDisabled()
      }
      await measure(
        'disabled label',
        dialog.getByRole('button', { name: 'Confirm addition' }),
      )
      await measure('validation text', dialog.getByRole('alert'))
      await screenshot('quantity-error')
      await input.fill('2')
      await expect(dialog).toContainText('209.80')
      await measure(
        'confirm action',
        dialog.getByRole('button', { name: 'Confirm addition' }),
      )
      await screenshot('quantity')
      await dialog.getByRole('button', { name: 'Confirm addition' }).click()
      const toast = page
        .getByRole('complementary')
        .filter({ hasText: 'Added 2 items:' })
      await toast.hover()
      await measure('success notification', toast.getByRole('status'))
      await measure('success boundary', toast, 3, 'borderTopColor')
      await screenshot('toast')
      await page.goto('/checkout')
      await page.getByRole('button', { name: 'Review order' }).click()
      await measure('checkout error', page.locator('#name-error'))
      await screenshot('checkout-errors')
      await page.getByLabel('Name', { exact: true }).fill('Demo Customer')
      await page.getByLabel('Email', { exact: true }).fill('demo@example.test')
      await page.getByLabel('Delivery address').fill('Fictional Road 12')
      await page.getByRole('button', { name: 'Review order' }).click()
      await page
        .getByRole('button', { name: 'Simulate payment and place order' })
        .click()
      await expect(
        page.getByRole('heading', { name: 'Your order is confirmed' }),
      ).toBeVisible()
      await screenshot('confirmation')
      await page.getByRole('link', { name: 'Demo orders', exact: true }).click()
      await screenshot('administration')
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()
        ).violations,
      ).toEqual([])
      await page.goto('/?q=tomt')
      await expect(page.getByText('No products found')).toBeVisible()
      await screenshot('empty')
      await page.route('https://dummyjson.com/products/2', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        await route.fulfill({ status: 503, json: {} })
      })
      await page.goto('/products/2')
      await expect(page.getByText('Loading product …')).toBeVisible()
      await screenshot('loading')
      await expect(
        page.getByRole('button', { name: 'Try again' }),
      ).toBeVisible()
      await screenshot('request-error')
      await page.evaluate(() =>
        localStorage.setItem('abyrvalg-currency', '"EUR"'),
      )
      await page.goto('/cart')
      const warning = page
        .getByRole('status')
        .filter({ hasText: 'Saved data could not be read.' })
      await measure('storage warning', warning)
      await screenshot('warning')
      await fs.writeFile(
        'test-results/contrast-' + theme + '.json',
        JSON.stringify(measurements, null, 2),
      )
      await testInfo.attach('measured-contrast', {
        body: JSON.stringify(measurements, null, 2),
        contentType: 'application/json',
      })
    },
  )
}
