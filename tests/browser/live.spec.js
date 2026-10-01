import { test, expect } from '@playwright/test'

test('live DummyJSON catalogue and direct product refresh', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12, { timeout: 25000 })
  // Normal mode asks the API to sort the complete result before returning its first page.
  for (const path of ['/', '/?q=phone', '/?category=beauty']) {
    await page.goto(path)
    await expect(page.getByRole('article').first()).toBeVisible({
      timeout: 25000,
    })
    const response = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.hostname === 'dummyjson.com' &&
        url.searchParams.get('sortBy') === 'price' &&
        url.searchParams.get('order') === 'desc'
      )
    })
    await page
      .getByRole('combobox', { name: 'Sorter etter' })
      .selectOption('price-desc')
    const source = (await (await response).json()).products
    const expectedIds = source.map((product) => product.id)
    await expect
      .poll(() =>
        page
          .getByRole('article')
          .getByRole('link')
          .evaluateAll((links) =>
            links.map((link) =>
              Number(link.getAttribute('href').split('/').pop()),
            ),
          ),
      )
      .toEqual(expectedIds)
    const prices = source.map((product) => product.price)
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

  await page.getByRole('searchbox').fill('a')
  await page.getByRole('button', { name: 'Søk', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(12)
  await expect(page.getByText('Side 1 av', { exact: false })).toBeVisible()
  const firstIds = await page
    .getByRole('article')
    .getByRole('link')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  await page.getByRole('button', { name: 'Neste' }).click()
  await expect(page).toHaveURL(/q=a&page=2/)
  await expect(
    page.getByRole('article').first().getByRole('link'),
  ).not.toHaveAttribute('href', firstIds[0])
  await expect(page.getByRole('article')).toHaveCount(12)
  const secondIds = await page
    .getByRole('article')
    .getByRole('link')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(secondIds.filter((id) => firstIds.includes(id))).toEqual([])

  await page.route('https://cdn.dummyjson.com/**', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(12, {
    timeout: 25000,
  })
  await expect(
    page.getByRole('img', { name: /Bilde ikke tilgjengelig/ }).first(),
  ).toBeVisible()
})
