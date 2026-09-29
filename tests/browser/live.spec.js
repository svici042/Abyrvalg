import { test, expect } from '@playwright/test'

test('live DummyJSON catalogue and direct product refresh', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12, { timeout: 25000 })
  // Verify that the live API sorts catalogue, search and categories before pagination.
  for (const path of ['/', '/?q=phone', '/?category=beauty']) {
    await page.goto(path)
    const response = page.waitForResponse(
      (response) =>
        response.url().includes('sortBy=price') &&
        response.url().includes('order=desc'),
    )
    await page
      .getByRole('combobox', { name: 'Sorter etter' })
      .selectOption('price-desc')
    const data = await (await response).json()
    const prices = data.products.map((product) => product.price)
    expect(prices.length).toBeGreaterThan(1)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  }
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12)
  // Load lazy images before capturing the full catalogue for visual review.
  for (const card of await page.getByRole('article').all()) {
    await card.scrollIntoViewIfNeeded()
  }
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => {})),
    )
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: 'test-results/desktop-live.png',
    fullPage: true,
  })
  await page.getByRole('article').first().getByRole('link').click()
  await expect(
    page.getByRole('button', { name: 'Legg i handlekurv' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Legg i handlekurv' }),
  ).toBeVisible()
})
