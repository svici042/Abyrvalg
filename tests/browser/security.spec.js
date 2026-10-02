import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'
import { readFileSync } from 'node:fs'

for (const headers of [false, true]) {
  test(`production ${headers ? 'Netlify headers' : 'Pages meta'} allows images and blocks injected scripts`, async ({
    page,
  }) => {
    test.skip(!process.env.PLAYWRIGHT_PREVIEW, 'Requires the production build.')
    const policy = readFileSync('netlify.toml', 'utf8').match(
      /Content-Security-Policy = "([^"]+)"/,
    )[1]
    if (headers) {
      await page.route('http://127.0.0.1:4173/**', async (route) => {
        const response = await route.fetch()
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            'content-security-policy': policy,
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'DENY',
          },
        })
      })
    }
    await mockApi(page)
    const image = readFileSync('tests/fixtures/legacy-animated.png')
    await page.route('https://images.example/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: image }),
    )
    await page.route('https://scripts.example/**', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: 'window.injectedScript = true',
      }),
    )
    await page.goto('/admin/products')
    await expect(
      page.getByRole('heading', { name: /Products|Produkter/, exact: true }),
    ).toBeVisible()
    await expect(
      page.locator('meta[http-equiv="Content-Security-Policy"]'),
    ).toHaveCount(1)
    const result = await page.evaluate(
      async (bytes) => {
        const load = (src) =>
          new Promise((resolve) => {
            const image = new Image()
            image.onload = () => resolve(true)
            image.onerror = () => resolve(false)
            image.src = src
            document.body.append(image)
          })
        const blob = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
        )
        const images = await Promise.all([
          load(blob),
          load('https://images.example/logo.png'),
        ])
        URL.revokeObjectURL(blob)
        const inline = document.createElement('script')
        inline.textContent = 'window.injectedScript = true'
        document.body.append(inline)
        const externalBlocked = await new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://scripts.example/attack.js'
          script.onerror = () => resolve(true)
          script.onload = () => resolve(false)
          document.body.append(script)
        })
        return {
          images,
          externalBlocked,
          executed: window.injectedScript === true,
        }
      },
      [...image],
    )
    expect(result).toEqual({
      images: [true, true],
      externalBlocked: true,
      executed: false,
    })
  })
}

test('Netlify response policy prevents cross-origin framing', async ({
  page,
}) => {
  const policy = readFileSync('netlify.toml', 'utf8').match(
    /Content-Security-Policy = "([^"]+)"/,
  )[1]
  await page.route('https://parent.example/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<iframe src="https://shop.example/"></iframe>',
    }),
  )
  await page.route('https://shop.example/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: { 'content-security-policy': policy, 'x-frame-options': 'DENY' },
      body: '<p>Protected shop</p>',
    }),
  )
  const blocked = page.waitForEvent('console', {
    predicate: (message) => message.text().includes('frame-ancestors'),
  })
  await page.goto('https://parent.example/')
  await blocked
  await expect(
    page.frameLocator('iframe').getByText('Protected shop'),
  ).toHaveCount(0)
})

test('imported HTML in product and store text stays inert', async ({
  page,
}) => {
  await mockApi(page)
  await page.addInitScript(() =>
    localStorage.setItem('abyrvalg-language', '"en"'),
  )
  await page.goto('/admin')
  const text =
    '<img src=x onerror="window.auditXss=1"><script>window.auditXss=1</script>'
  const payload = {
    version: 1,
    content: { footer: { en: text, nb: text } },
    products: {
      1: {
        price: 1,
        stock: 1,
        category: 'demo',
        brand: '',
        hidden: false,
        thumbnail: '',
        images: [],
        text: {
          en: { title: text, description: text },
          nb: { title: text, description: text },
        },
      },
    },
  }
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('[name="adminConfigurationImport"]').setInputFiles({
    name: 'security-test.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  })
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Configuration imported in this browser.' }),
  ).toBeVisible()
  await page.goto('/products/1')
  await expect(
    page.getByRole('heading', { name: text, exact: true }),
  ).toBeVisible()
  await expect(page.locator('footer')).toContainText(text)
  await expect(page.locator('h1 img, h1 script, footer script')).toHaveCount(0)
  expect(await page.evaluate(() => window.auditXss)).toBeUndefined()
})
