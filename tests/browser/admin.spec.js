import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockApi } from './fixtures'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==',
  'base64',
)
test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => {
    if (!localStorage.getItem('abyrvalg-language'))
      localStorage.setItem('abyrvalg-language', '"en"')
  })
})
async function edit(page, id = 25) {
  await page.goto('/admin/products')
  await page
    .getByRole('button', {
      name: new RegExp(`^(Edit product|Rediger produkt) #${id}$`),
    })
    .click()
}
async function save(page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Changes saved in this browser.' }),
  ).toBeVisible()
}
test('complete catalogue editing, currency stability, refresh and individual restoration', async ({
  page,
}) => {
  await edit(page)
  await page.locator('[name="title-en"]').fill('Edited last product')
  await page.locator('[name="title-nb"]').fill('Endret siste produkt')
  await page
    .locator('[name="description-en"]')
    .fill('New supporting description')
  await page.locator('[name="productPrice"]').fill('')
  await page.locator('[name="productPrice"]').pressSequentially('123.45')
  await expect(page.locator('[name="productPrice"]')).toHaveValue('123.45')
  await page.locator('[name="productPrice"]').fill('105')
  await page.locator('[name="productCategory"]').fill('demo-category')
  await save(page)
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('abyrvalg-admin')).products[25].price,
    ),
  ).toBe(10)
  await page.getByRole('combobox', { name: 'Currency' }).selectOption('USD')
  await expect(page.locator('[name="productPrice"]')).toHaveValue('10')
  await save(page)
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('abyrvalg-admin')).products[25].price,
    ),
  ).toBe(10)
  await page.reload()
  await page
    .getByRole('button', { name: 'Edit product #25', exact: true })
    .click()
  await expect(page.locator('[name="title-en"]')).toHaveValue(
    'Edited last product',
  )
  await page.getByRole('link', { name: 'View in store', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Edited last product' }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Choose language' })
    .selectOption('nb')
  await expect(
    page.getByRole('heading', { name: 'Endret siste produkt' }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Velg språk' }).selectOption('en')
  await edit(page)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Restore original product' }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('abyrvalg-admin')).products[25],
      ),
    )
    .toBeUndefined()
})
test('image uploads, ordering, main image, removal, persistence and export/import', async ({
  page,
}) => {
  await edit(page, 1)
  await page
    .locator('[name="imageUpload"]')
    .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png })
  await expect(
    page.getByRole('button', { name: 'Main image', exact: true }),
  ).toHaveCount(1)
  await page.locator('[name="imageUrl"]').fill('https://example.com/broken.png')
  await page.getByRole('button', { name: 'Add image URL' }).click()
  await page.getByRole('button', { name: 'Move image 2 earlier' }).click()
  await page
    .getByRole('button', { name: 'Main image', exact: true })
    .first()
    .click()
  await page
    .getByRole('button', { name: 'Remove image 1', exact: true })
    .click()
  await save(page)
  await page.reload()
  await page
    .getByRole('button', { name: 'Edit product #1', exact: true })
    .click()
  await expect(page.locator('ol img')).toHaveCount(1)
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-admin')),
  ).not.toContain('base64')
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export configuration' }).click()
  const download = await downloadPromise
  const file = await download.path()
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Reset administration changes' })
    .click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('[name="adminConfigurationImport"]').setInputFiles(file)
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Configuration imported in this browser.' }),
  ).toBeVisible()
  await edit(page, 1)
  await expect(page.locator('ol img')).toHaveCount(1)
  await page.locator('[name="imageUpload"]').setInputFiles({
    name: 'unsafe.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  })
  await expect(page.getByRole('alert')).toContainText('Use JPG')
})
test('cart updates, checkout uses current price, hiding removes items and historic orders remain intact', async ({
  page,
}) => {
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
  await page.getByRole('dialog').getByRole('spinbutton').fill('3')
  await page
    .getByRole('button', { name: 'Confirm addition', exact: true })
    .click()
  await edit(page, 1)
  await page.locator('[name="productPrice"]').fill('210')
  await page.locator('[name="productStock"]').fill('2')
  await page.locator('[name="title-en"]').fill('Current demo title')
  await page.locator('[name="title-nb"]').fill('Gjeldende demonavn')
  await save(page)
  await page.getByRole('link', { name: /Cart, 2 items/ }).click()
  await expect(page.getByRole('article')).toContainText('210')
  await expect(page.getByRole('spinbutton')).toHaveValue('2')
  await expect(
    page.getByRole('status').filter({ hasText: 'Your cart was updated' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Go to demo checkout' }).click()
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText(
    'Current demo title',
  )
  await page
    .getByRole('combobox', { name: 'Choose language' })
    .selectOption('nb')
  await expect(
    page.getByRole('region', { name: 'Oppsummering' }),
  ).toContainText('Gjeldende demonavn')
  await page.getByRole('combobox', { name: 'Velg språk' }).selectOption('en')
  await page.locator('#name').fill('Demo Person')
  await page.locator('#email').fill('demo@example.com')
  await page.locator('#address').fill('Example Street 1')
  await page.getByRole('button', { name: 'Review order' }).click()
  await page
    .getByRole('button', { name: 'Simulate payment and place order' })
    .click()
  await expect(page).toHaveURL(/\/orders\//)
  const snapshot = await page.evaluate(() =>
    localStorage.getItem('abyrvalg-orders'),
  )
  await page.goto('/products/1')
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
  await page
    .getByRole('button', { name: 'Confirm addition', exact: true })
    .click()
  await edit(page, 1)
  await page.locator('[name="productHidden"]').check()
  await save(page)
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('abyrvalg-cart')),
    ),
  ).toEqual([])
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
  ).toBe(snapshot)
  await page.goto('/products/1')
  await expect(
    page.getByRole('heading', { name: 'Product not found' }),
  ).toBeVisible()
})
test('cancel, navigation warning, validation and storage failures', async ({
  page,
}) => {
  await edit(page, 1)
  await page.locator('[name="title-en"]').fill('Not saved')
  const dismissed = new Promise((resolve) =>
    page.once('dialog', async (dialog) => {
      await dialog.dismiss()
      resolve()
    }),
  )
  await page.getByRole('link', { name: 'Store content', exact: true }).click()
  await dismissed
  await expect(page.locator('[name="title-en"]')).toHaveValue('Not saved')
  const cancelled = new Promise((resolve) =>
    page.once('dialog', async (dialog) => {
      await dialog.accept()
      resolve()
    }),
  )
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await cancelled
  await expect(
    page.getByRole('button', { name: 'Edit product #1', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Edit product #1', exact: true })
    .click()
  await page.locator('[name="productStock"]').fill('-1')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect(
    await page
      .locator('[name="productStock"]')
      .evaluate((element) => element.validity.valid),
  ).toBe(false)
  await page.locator('[name="productStock"]').fill('2')
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error('Quota exceeded')
    }
  })
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Changes could not be saved' })
      .last(),
  ).toBeVisible()
})
for (const language of ['en', 'nb'])
  for (const theme of ['light', 'dark']) {
    test(`content editor keyboard, mobile and accessibility: ${language}/${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('abyrvalg-language', JSON.stringify(language))
          localStorage.setItem('abyrvalg-theme', JSON.stringify(theme))
        },
        { language, theme },
      )
      await page.goto('/admin/content')
      await page.locator('[name="storeName-en"]').fill('Demo Store')
      await page.locator('[name="storeName-nb"]').fill('Demobutikk')
      await page.locator('[name="heroHeading-en"]').fill('New hero')
      await page.locator('[name="heroHeading-nb"]').fill('Nytt hovedbanner')
      for (const field of ['heroText', 'announcement', 'footer', 'contact']) {
        await page
          .locator(`[name="${field}-en"]`)
          .fill(`Demo ${field} <b>plain text</b>`)
        await page
          .locator(`[name="${field}-nb"]`)
          .fill(`Norsk ${field} <b>ren tekst</b>`)
      }
      await page
        .getByRole('button', {
          name: language === 'en' ? 'Save' : 'Lagre',
          exact: true,
        })
        .focus()
      await page.keyboard.press('Enter')
      await expect(
        page.getByRole('status').filter({
          hasText: language === 'en' ? 'Changes saved' : 'Endringene er lagret',
        }),
      ).toBeVisible()
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      await page
        .getByRole('link', {
          name: language === 'en' ? 'View in store' : 'Se i butikken',
          exact: true,
        })
        .click()
      await expect(
        page.getByRole('heading', {
          name: language === 'en' ? 'New hero' : 'Nytt hovedbanner',
        }),
      ).toBeVisible()
      for (const field of ['heroText', 'announcement', 'footer', 'contact']) {
        await expect(
          page.getByText(
            language === 'en'
              ? `Demo ${field} <b>plain text</b>`
              : `Norsk ${field} <b>ren tekst</b>`,
            { exact: true },
          ),
        ).toBeVisible()
      }
      await expect(page.locator('b')).toHaveCount(0)
      await expect(page.locator('header')).toContainText(
        language === 'en' ? 'Demo Store' : 'Demobutikk',
      )
    })
  }

test('edited products filter and sort before pagination; recently viewed uses current text and visibility', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('abyrvalg-recent-enabled', 'true'),
  )
  await page.goto('/products/25')
  await expect(
    page.getByRole('heading', { name: 'Produkt 25', exact: true }),
  ).toBeVisible()
  await edit(page)
  await page.locator('[name="title-en"]').fill('Unique edited product')
  await page.locator('[name="productPrice"]').fill('1.05')
  await page.locator('[name="productCategory"]').fill('demo-category')
  await save(page)
  await page.goto('/?sort=price-asc')
  await expect(page.getByRole('article').first()).toContainText(
    'Unique edited product',
  )
  await expect(
    page.getByRole('region', { name: 'Recently viewed' }),
  ).toContainText('Unique edited product')
  await page.goto('/?category=demo-category')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.goto('/?q=Unique')
  await expect(page.getByRole('article')).toHaveCount(1)
  await edit(page)
  await page.locator('[name="productHidden"]').check()
  await save(page)
  await page.goto('/?q=Unique')
  await expect(page.getByRole('article')).toHaveCount(0)
  await expect(
    page.getByRole('region', { name: 'Recently viewed' }),
  ).not.toContainText('Unique edited product')
  await page.goto('/?page=2')
  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
})

test('malformed imports preserve configuration and reset preserves cart and preferences', async ({
  page,
}) => {
  await page.goto('/admin/content')
  await page.locator('[name="storeName-en"]').fill('Saved Demo')
  await save(page)
  await page.evaluate(() =>
    localStorage.setItem(
      'abyrvalg-cart',
      JSON.stringify([
        {
          id: 1,
          title: 'Produkt 1',
          thumbnail: '',
          price: 9.99,
          stock: 3,
          quantity: 2,
        },
      ]),
    ),
  )
  await page.goto('/admin')
  const before = await page.evaluate(() =>
    localStorage.getItem('abyrvalg-admin'),
  )
  await page.locator('[name="adminConfigurationImport"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99,"products":{},"content":{}}'),
  })
  await expect(
    page.getByRole('status').filter({ hasText: 'Import failed' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-admin')),
  ).toBe(before)
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Reset administration changes' })
    .click()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-cart'))[0].quantity,
    ),
  ).toBe(2)
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('abyrvalg-language')),
    ),
  ).toBe('en')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-admin')).content,
    ),
  ).toEqual({})
})

test('product editor fits mobile, supports keyboard and has labelled controls in dark NOK and light USD', async ({
  page,
}) => {
  for (const [theme, currency, language] of [
    ['dark', 'NOK', 'nb'],
    ['light', 'USD', 'en'],
  ]) {
    await page.setViewportSize({ width: 390, height: 844 })
    await edit(page, 1)
    await page
      .getByRole('combobox', { name: /Choose language|Velg språk/ })
      .selectOption(language)
    await page
      .getByRole('combobox', { name: /Currency|Valuta/ })
      .selectOption(currency)
    if ((await page.locator('html').getAttribute('data-theme')) !== theme)
      await page
        .getByRole('button', { name: /Switch to .* theme|Bytt til .* tema/ })
        .click()
    await page.locator('[name="productHidden"]').focus()
    await page.keyboard.press('Space')
    await expect(page.locator('[name="productHidden"]')).toBeChecked()
    await page.keyboard.press('Space')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
})
