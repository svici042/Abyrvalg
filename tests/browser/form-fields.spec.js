import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

async function expectFormControlsNamedAndUnique(page) {
  const result = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll('input, select, textarea'),
    )
    const ids = controls.map((control) => control.id).filter(Boolean)
    const labels = Array.from(document.querySelectorAll('label[for]'))

    return {
      unnamed: controls
        .filter((control) => !control.id && !control.name)
        .map((control) => control.outerHTML),
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      labelsWithoutControls: labels
        .filter((label) => !document.getElementById(label.htmlFor))
        .map((label) => label.outerHTML),
    }
  })

  expect(result.unnamed).toEqual([])
  expect(result.duplicateIds).toEqual([])
  expect(result.labelsWithoutControls).toEqual([])
}

test('form controls have names and unique labels while selectors keep working', async ({
  page,
}) => {
  await mockApi(page)
  await page.goto('/')
  await expectFormControlsNamedAndUnique(page)

  const language = page.getByRole('combobox', {
    name: /Choose language|Velg språk/,
  })
  const currency = page.getByRole('combobox', { name: /Currency|Valuta/ })
  const sorting = page.getByRole('combobox', { name: /Sort by|Sorter etter/ })
  await expect(language).toHaveAttribute('name', 'language')
  await expect(currency).toHaveAttribute('name', 'currency')
  await expect(sorting).toHaveAttribute('name', 'sort')
  await language.selectOption('en')
  await currency.selectOption('USD')
  await sorting.selectOption('price-desc')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(currency).toHaveValue('USD')
  await expect(page).toHaveURL(/sort=price-desc/)

  await page.goto('/admin/orders')
  await expectFormControlsNamedAndUnique(page)
  await expect(
    page.getByRole('searchbox', {
      name: 'Search by order number or customer',
    }),
  ).toHaveAttribute('name', 'orderSearch')
  await expect(
    page.getByRole('combobox', { name: 'Fulfilment status' }),
  ).toHaveAttribute('name', 'status')

  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.getByRole('spinbutton')).toHaveAttribute('name', 'quantity')
  await page.getByRole('button', { name: 'Confirm addition' }).click()
  await page.getByRole('link', { name: /Cart, 1 items/ }).click()
  await page.getByRole('link', { name: 'Go to demo checkout' }).click()
  await expectFormControlsNamedAndUnique(page)
  for (const name of ['name', 'email', 'address']) {
    await expect(page.locator(`#${name}`)).toHaveAttribute('name', name)
  }

  await page.getByLabel('Name', { exact: true }).fill('Test Customer')
  await page.getByLabel('Email', { exact: true }).fill('test@example.test')
  await page.getByLabel('Delivery address').fill('Sample Street 5')
  await page.getByRole('button', { name: 'Review order' }).click()
  await page
    .getByRole('button', { name: 'Simulate payment and place order' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Your order is confirmed' }),
  ).toBeVisible()
  await page.goto('/admin/orders')
  await page.getByRole('link', { name: 'Open order' }).click()
  await expectFormControlsNamedAndUnique(page)
  await expect(
    page.getByRole('combobox', { name: 'Fulfilment status' }),
  ).toHaveAttribute('name', 'fulfilmentStatus')
})
