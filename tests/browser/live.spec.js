import { test, expect } from '@playwright/test'

function isSearchPage(response, skip) {
  const url = new URL(response.url())
  return (
    url.pathname === '/products/search' &&
    url.searchParams.get('q') === 'a' &&
    url.searchParams.get('skip') === String(skip)
  )
}

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

test('live DummyJSON search paginates results and failed images get a fallback', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12, {
    timeout: 25000,
  })

  const firstPageResponse = page.waitForResponse((response) =>
    isSearchPage(response, 0),
  )
  await page.getByRole('searchbox').fill('a')
  await page.getByRole('button', { name: 'Søk', exact: true }).click()
  const firstPageResponseValue = await firstPageResponse
  expect(firstPageResponseValue.ok()).toBe(true)
  const firstPage = await firstPageResponseValue.json()

  expect(firstPage.total).toBeGreaterThan(12)
  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page.getByText('Side 1 av', { exact: false })).toBeVisible()

  const secondPageResponse = page.waitForResponse((response) =>
    isSearchPage(response, 12),
  )
  await page.getByRole('button', { name: 'Neste' }).click()
  const secondPageResponseValue = await secondPageResponse
  expect(secondPageResponseValue.ok()).toBe(true)
  const secondPage = await secondPageResponseValue.json()

  expect(secondPage.products.length).toBeGreaterThan(0)
  const firstPageIds = firstPage.products.map(({ id }) => id)
  const secondPageIds = secondPage.products.map(({ id }) => id)
  expect(secondPageIds.filter((id) => firstPageIds.includes(id))).toEqual([])
  await expect(page).toHaveURL(/q=a&page=2/)
  await expect(page.getByRole('article')).toHaveCount(
    secondPage.products.length,
  )

  await page.route('https://cdn.dummyjson.com/**', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12, {
    timeout: 25000,
  })
  await expect(
    page.getByRole('img', { name: /Bilde ikke tilgjengelig/ }).first(),
  ).toBeVisible()
})
