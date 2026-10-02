import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

for (const language of ['en', 'nb']) {
  for (const theme of ['light', 'dark']) {
    test(`administration pagination, filters and editing in ${language}/${theme}`, async ({
      page,
    }) => {
      await mockApi(page)
      await page.setViewportSize({ width: 375, height: 844 })
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('abyrvalg-language', JSON.stringify(language))
          localStorage.setItem('abyrvalg-theme', JSON.stringify(theme))
        },
        { language, theme },
      )
      const nb = language === 'nb'
      await page.goto('/admin/products')
      const list = page.locator('main ul[class*="list"] > li')
      const next = page.getByRole('button', {
        name: nb ? 'Neste' : 'Next',
        exact: true,
      })
      const previous = page.getByRole('button', {
        name: nb ? 'Forrige' : 'Previous',
        exact: true,
      })
      await expect(list).toHaveCount(12)
      await expect(
        page
          .getByRole('status')
          .filter({ hasText: nb ? '25 produkter' : '25 products' }),
      ).toBeVisible()
      await expect(previous).toBeDisabled()
      await next.focus()
      await page.keyboard.press('Enter')
      await expect(list).toHaveCount(12)
      await next.click()
      await expect(list).toHaveCount(1)
      await expect(next).toBeDisabled()
      await page
        .locator('[name="adminProductVisibility"]')
        .selectOption('visible')
      await expect(previous).toBeDisabled()
      await next.click()
      await next.click()
      await page
        .getByRole('button', {
          name: nb ? 'Rediger produkt #25' : 'Edit product #25',
          exact: true,
        })
        .click()
      await page.locator('[name="productHidden"]').check()
      await page
        .getByRole('button', { name: nb ? 'Lagre' : 'Save', exact: true })
        .click()
      await expect(
        page
          .getByRole('status')
          .filter({ hasText: nb ? 'Endringene er lagret' : 'Changes saved' }),
      ).toBeVisible()
      await page
        .getByRole('button', { name: nb ? 'Avbryt' : 'Cancel', exact: true })
        .click()
      await expect(list).toHaveCount(12)
      await expect(
        page.getByText(nb ? 'Side 2 av 2' : 'Page 2 of 2', { exact: true }),
      ).toBeVisible()
      await page.locator('[name="adminProductCategory"]').selectOption('beauty')
      await expect(list).toHaveCount(2)
      await expect(previous).toBeDisabled()
      await expect(
        page.locator('[name="adminProductCategory"] option[value="beauty"]'),
      ).toHaveText(nb ? 'Skjønnhet' : 'Beauty')
      await page.locator('[name="adminProductSearch"]').fill('unmatched text')
      await expect(list).toHaveCount(0)
      await expect(next).toBeDisabled()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
    })
  }
}
