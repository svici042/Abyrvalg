import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

test('shared branding across sizes, themes, languages and shop routes', async ({
  page,
}) => {
  test.setTimeout(120000)
  await mockApi(page)
  await page.addInitScript(() => {
    localStorage.setItem(
      'abyrvalg-cart',
      JSON.stringify([
        {
          id: 1,
          title: 'Produkt 1',
          price: 9.99,
          quantity: 1,
          stock: 3,
          thumbnail: '',
        },
      ]),
    )
  })
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const language of ['nb', 'en']) {
      for (const theme of ['light', 'dark']) {
        await page.goto('/')
        await page.evaluate(
          ({ language, theme }) => {
            localStorage.setItem('abyrvalg-language', JSON.stringify(language))
            localStorage.setItem('abyrvalg-theme', JSON.stringify(theme))
          },
          { language, theme },
        )
        for (const [name, route] of Object.entries({
          catalogue: '/',
          product: '/products/1',
          cart: '/cart',
          checkout: '/checkout',
          admin: '/admin/orders',
        })) {
          await page.goto(route)
          await expect(page.locator('html')).toHaveAttribute('lang', language)
          await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            theme,
          )
          await expect(page.locator('main')).not.toContainText(/Laster|Loading/)
          const logos = page.locator('header img, footer img')
          await expect(logos).toHaveCount(2)
          expect(
            await logos.evaluateAll((images) =>
              images.every(
                (image) =>
                  image.complete &&
                  image.naturalWidth === 564 &&
                  Math.abs(image.width / image.height - 1974 / 560) < 0.08,
              ),
            ),
          ).toBe(true)
          await expect(page.locator('footer')).toContainText(
            `© ${new Date().getFullYear()} Bim & Bom`,
          )
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true)
          const footer = await page.locator('footer').boundingBox()
          expect(footer.y + footer.height).toBeGreaterThanOrEqual(899)
          // Check that direct header groups occupy separate areas after responsive reflow.
          expect(
            await page.locator('header > div').evaluate((header) => {
              const boxes = Array.from(header.children, (child) =>
                child.getBoundingClientRect(),
              )
              return boxes.every((a, index) =>
                boxes
                  .slice(index + 1)
                  .every(
                    (b) =>
                      a.right <= b.left + 1 ||
                      b.right <= a.left + 1 ||
                      a.bottom <= b.top + 1 ||
                      b.bottom <= a.top + 1,
                  ),
              )
            }),
          ).toBe(true)
          await page.screenshot({
            path: `test-results/branding-${width}-${language}-${theme}-${name}.png`,
            fullPage: true,
          })
        }
      }
    }
  }
})
