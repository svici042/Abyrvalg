import englishProducts from '../../src/i18n/products.en.js'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import { mockApi } from './fixtures'

async function add(page, count = 1) {
  await page.goto('/products/1')
  await page
    .getByRole('button', { name: 'Legg i handlekurv', exact: true })
    .click()
  const input = page.getByRole('dialog').getByRole('spinbutton')
  await input.fill(String(count))
  await page.getByRole('button', { name: 'Bekreft tillegg' }).click()
}
async function review(page) {
  await add(page, 2)
  await page.goto('/checkout')
  await page.getByLabel('Navn', { exact: true }).fill('Test Person')
  await page.getByLabel('E-post', { exact: true }).fill('test@example.test')
  await page.getByLabel('Leveringsadresse').fill('Example Road 12')
  await page.getByRole('button', { name: 'Kontroller bestillingen' }).click()
}
test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('all language and currency combinations persist independently with exact totals', async ({
  page,
}) => {
  await add(page, 3)
  await page.goto('/cart')
  const original = await page.evaluate(() =>
    localStorage.getItem('abyrvalg-cart'),
  )
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const currency of ['USD', 'NOK']) {
      await page
        .getByRole('combobox', { name: /Currency|Valuta/ })
        .selectOption(currency)
      for (const language of ['EN', 'NO']) {
        await page
          .getByRole('combobox', { name: /Choose language|Velg språk/ })
          .selectOption(language === 'EN' ? 'en' : 'nb')
        const total =
          currency === 'USD'
            ? language === 'EN'
              ? '29.97'
              : '29,97'
            : language === 'EN'
              ? '314.70'
              : '314,70'
        await expect(page.getByRole('article')).toContainText(currency)
        await expect(page.getByRole('article')).toContainText(total)
        await expect(
          page.getByRole('combobox', { name: /Currency|Valuta/ }),
        ).toHaveValue(currency)
      }
    }
  }
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb')
  await expect(
    page.getByRole('combobox', { name: /Currency|Valuta/ }),
  ).toHaveValue('NOK')
  expect(await page.evaluate(() => localStorage.getItem('abyrvalg-cart'))).toBe(
    original,
  )
})

test('quantity dialog supports draft editing, cancellation, focus and atomic stock limits', async ({
  page,
}) => {
  await page.goto('/products/1')
  const trigger = page.getByRole('button', {
    name: 'Legg i handlekurv',
    exact: true,
  })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  const input = dialog.getByRole('spinbutton')
  await expect(input).toBeFocused()
  await input.fill('')
  await input.press('Enter')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(
    dialog.getByRole('button', { name: 'Bekreft tillegg' }),
  ).toBeDisabled()
  await input.fill('2')
  await expect(dialog).toContainText('209,80')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 0 varer' }),
  ).toBeVisible()
  await trigger.click()
  await dialog.getByRole('button', { name: 'Avbryt' }).click()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await input.fill('2')
  await dialog
    .getByRole('button', { name: 'Bekreft tillegg' })
    .evaluate((button) => {
      button.click()
      button.click()
    })
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 2 varer' }),
  ).toBeVisible()
  await trigger.click()
  await expect(dialog).toContainText('Tilgjengelig å legge til: 1')
  await dialog.getByRole('button', { name: 'Bekreft tillegg' }).click()
  await expect(
    page.getByRole('button', { name: 'Lagergrensen er nådd' }),
  ).toBeDisabled()
  await page.goto('/cart')
  await page.getByRole('spinbutton').fill('')
  await page.getByRole('spinbutton').press('Enter')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-cart'))[0].quantity,
    ),
  ).toBe(3)
  await page.getByRole('spinbutton').fill('1')
  await page.getByRole('spinbutton').press('Enter')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-cart'))[0].quantity,
    ),
  ).toBe(1)
})

test('toast translates, pauses while focused and restores focus when closed', async ({
  page,
}) => {
  await add(page)
  const toast = page
    .getByRole('complementary')
    .filter({ hasText: 'Lagt til 1 stk.' })
  await expect(toast.getByRole('status')).toBeVisible()
  await toast.getByRole('link').focus()
  await page.waitForTimeout(4700)
  await expect(toast).toBeVisible()
  await toast.getByRole('button', { name: 'Lukk' }).click()
  await expect(
    page.getByRole('button', { name: 'Legg i handlekurv', exact: true }),
  ).toBeFocused()
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm addition' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Added 1 item:' }),
  ).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(
    page.getByRole('status').filter({ hasText: 'Added 1 item:' }),
  ).toHaveCount(0, { timeout: 7000 })
})

test('checkout freezes amounts during header changes and recovers from preparation failure', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = crypto.randomUUID.bind(crypto)
    crypto.randomUUID = () => {
      if (!window.allowOrder) throw new Error('Preparation failure')
      return original()
    }
  })
  await review(page)
  await expect(
    page.getByRole('heading', { name: 'Se gjennom bestillingen' }),
  ).toBeFocused()
  await page
    .getByRole('button', { name: 'Simuler betaling og bestill' })
    .click()
  await expect(
    page.getByText('The order could not be saved.', { exact: false }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Simuler betaling og bestill' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Ordren kunne ikke lagres' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-cart'))[0].quantity,
    ),
  ).toBe(2)
  await page.evaluate(() => {
    window.allowOrder = true
  })
  await page
    .getByRole('combobox', { name: /Currency|Valuta/ })
    .selectOption('USD')
  await page
    .getByRole('button', { name: 'Simuler betaling og bestill' })
    .click()
  await page
    .getByRole('combobox', { name: /Currency|Valuta/ })
    .selectOption('NOK')
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await expect(page).toHaveURL(/\/orders\/AB-/)
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('abyrvalg-orders'))[0],
  )
  expect(saved.currency).toBe('USD')
  expect(saved.totalMinor).toBe(1998)
  expect(saved.rate).toBe(1)
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText(
    'USD 19.98',
  )
  await page.goto('/admin/orders/' + saved.id)
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText(
    'USD 19.98',
  )
})

test('search does not navigate on typing and route focus ignores filter updates', async ({
  page,
}) => {
  for (const route of ['/cart', '/checkout', '/admin/orders']) {
    await page.goto(route)
    const search = page.getByRole('searchbox', { name: 'Søk etter produkter' })
    await search.fill('test')
    await page.waitForTimeout(600)
    await expect(page).toHaveURL(new RegExp(route + '$'))
    await expect(search).toBeFocused()
  }
  await page
    .getByRole('searchbox', { name: 'Søk etter produkter' })
    .press('Enter')
  await expect(page).toHaveURL(/q=test$/)
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page).toHaveTitle('Utforsk – Abyrvalg')
  await page.getByRole('searchbox').fill('test2')
  await page.getByRole('searchbox').press('Enter')
  await expect(page.getByRole('searchbox')).toBeFocused()
  await page.getByRole('link', { name: 'Hopp til innhold' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await page.goto('/missing-page')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('history is not read before opt-in, and disabling/deleting touches only app data', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('unrelated-key', 'keep')
    const get = Storage.prototype.getItem
    window.historyReads = 0
    Storage.prototype.getItem = function (key) {
      if (key === 'abyrvalg-recent') window.historyReads++
      return get.call(this, key)
    }
  })
  await page.goto('/products/1')
  expect(await page.evaluate(() => window.historyReads)).toBe(0)
  await page.goto('/products/2')
  await expect(
    page.getByRole('region', { name: 'Nylig sett' }).getByRole('link'),
  ).toHaveCount(0)
  await page.goto('/')
  await page.getByText('Historikkvalg', { exact: true }).click()
  await page.getByRole('checkbox').check()
  await page.goto('/products/1')
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('abyrvalg-recent') || '[]').length,
      ),
    )
    .toBe(1)
  await page.goto('/products/2')
  await expect(page.getByRole('region', { name: 'Nylig sett' })).toBeVisible()
  await page.goto('/')
  await page.getByText('Historikkvalg', { exact: true }).click()
  await page.getByRole('checkbox').click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Bekreft sletting' })
    .click()
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-recent')),
  ).toBeNull()
  await page.goto('/admin/orders')
  await page.getByRole('button', { name: 'Slett alle demoordre' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Bekreft sletting' })
    .click()
  expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe(
    'keep',
  )
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-orders')),
  ).toBeNull()
})

test('English excludes dictionaries, Norwegian loads them once and failures retain API text', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('abyrvalg-language', '"en"'),
  )
  const requests = []
  page.on('request', (request) => {
    if (
      request.resourceType() === 'fetch' &&
      /(nb|en)-\d+-\d+(?:-[^/?]+)?\.json/.test(request.url())
    )
      requests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12)
  expect(requests).toHaveLength(0)
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('nb')
  await expect.poll(() => requests.length).toBe(8)
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('en')
  await page
    .getByRole('combobox', { name: /Choose language|Velg språk/ })
    .selectOption('nb')
  expect(requests).toHaveLength(8)
})

test('translation download failure keeps products usable', async ({ page }) => {
  await page.route('**/nb-1-50-*.json', (route) => route.abort())
  await page.route('https://dummyjson.com/products/1', (route) =>
    route.fulfill({
      json: {
        id: 1,
        ...englishProducts[1],
        price: 9.99,
        stock: 3,
        category: 'beauty',
        images: [],
      },
    }),
  )
  await page.goto('/products/1')
  await expect(
    page.getByRole('heading', { name: englishProducts[1].title, exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Legg i handlekurv', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

for (const width of [320, 375, 768, 1440]) {
  test('automatic accessibility and contrast at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() =>
      localStorage.setItem(
        'abyrvalg-display',
        JSON.stringify({
          motion: 'limited',
          palette: 'contrast',
          text: 'large',
        }),
      ),
    )
    await page.goto('/')
    await expect(
      page.getByRole('button', {
        name: /Visning|Stopp bevegelse|Display|Stop motion/,
      }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: /Om denne demoen|About this demo/ }),
    ).toHaveCount(0)
    for (const theme of ['dark', 'light']) {
      if ((await page.locator('html').getAttribute('data-theme')) !== theme)
        await page.getByRole('button', { name: /Bytt til/ }).click()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()
        ).violations,
      ).toEqual([])
    }
    for (const reducedMotion of ['reduce', 'no-preference']) {
      await page.emulateMedia({ reducedMotion })
      expect(
        await page
          .locator('[class*="orbit"]')
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe('none')
    }
    await page.emulateMedia({ forcedColors: 'active', contrast: 'more' })
    await expect(page.getByRole('combobox', { name: 'Valuta' })).toBeVisible()
    await page.getByRole('combobox', { name: 'Valuta' }).focus()
    await expect(page.getByRole('combobox', { name: 'Valuta' })).toBeFocused()
    await page.screenshot({
      path: 'test-results/forced-colors-' + width + '.png',
      fullPage: true,
    })
  })
}

test('configured production headers allow real API, images and lazy translation modules', async ({
  page,
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_PREVIEW,
    'This policy check requires the production preview server.',
  )
  await page.unroute('https://dummyjson.com/**')
  const config = fs.readFileSync('netlify.toml', 'utf8')
  const policy = config.match(/Content-Security-Policy = "([^"]+)"/)[1]
  await page.route('http://127.0.0.1:4173/**', async (route) => {
    const response = await route.fetch()
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': policy,
        'x-content-type-options': 'nosniff',
      },
    })
  })
  await page.addInitScript(() => {
    window.policyErrors = []
    document.addEventListener('securitypolicyviolation', (event) =>
      window.policyErrors.push(event.violatedDirective),
    )
  })
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12, { timeout: 25000 })
  const firstImage = page.getByRole('article').first().locator('img')
  await expect
    .poll(() =>
      firstImage.evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true)
  await page.getByRole('article').first().getByRole('link').click()
  await expect(
    page.getByRole('heading', {
      name: 'Essence Lash Princess-maskara',
      exact: true,
    }),
  ).toBeVisible()
  expect(await page.evaluate(() => window.policyErrors)).toEqual([])
})

test('large text, zoom-equivalent layout and keyboard dialogs across shopping pages', async ({
  page,
}) => {
  await add(page)
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/cart', '/checkout', '/admin/orders']) {
      await page.goto(route)
      await page.addStyleTag({ content: 'html { font-size: 125%; }' })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      await expect(
        page.getByRole('combobox', { name: /Currency|Valuta/ }),
      ).toBeVisible()

      if (width === 640) {
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
        expect(results.violations).toEqual([])
      }
    }
  }
  await page.goto('/products/1')
  await page
    .getByRole('button', { name: 'Legg i handlekurv', exact: true })
    .focus()
  await page.keyboard.press('Enter')
  for (let step = 0; step < 10; step++) {
    await page.keyboard.press('Tab')
    expect(
      await page
        .getByRole('dialog')
        .evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Legg i handlekurv', exact: true }),
  ).toBeFocused()
  await page
    .getByRole('button', { name: 'Legg i handlekurv', exact: true })
    .click()
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
  await page.mouse.click(1, 1)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Handlekurv, 1 varer' }),
  ).toBeVisible()
})

test('legacy display settings are ignored without changing shopping data', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('abyrvalg-currency', '"EUR"')
    localStorage.setItem('abyrvalg-display', '{bad')
  })
  await add(page)
  await expect(page.getByRole('combobox', { name: 'Valuta' })).toHaveValue(
    'NOK',
  )
  await page.getByRole('combobox', { name: 'Velg språk' }).selectOption('en')
  await page.getByRole('combobox', { name: 'Currency' }).selectOption('USD')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('abyrvalg-cart'))[0].quantity,
    ),
  ).toBe(1)
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-display')),
  ).toBe('{bad')
  expect(await page.locator('html').getAttribute('data-palette')).toBeNull()
  expect(await page.locator('html').getAttribute('data-motion')).toBeNull()
})
