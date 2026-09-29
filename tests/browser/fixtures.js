const products = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  title: `Produkt ${index + 1}`,
  price: 9.99,
  category: 'beauty',
  stock: 3,
  rating: 4.5,
  description: 'Et fint produkt til hverdagen.',
  thumbnail: '',
  images: [],
}))

export async function mockApi(page) {
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/products/categories') {
      return route.fulfill({ json: [{ slug: 'beauty', name: 'Beauty' }] })
    }
    if (/\/products\/\d+$/.test(url.pathname)) {
      const product = products.find(
        (item) => item.id === Number(url.pathname.split('/').pop()),
      )
      return route.fulfill({
        status: product ? 200 : 404,
        json: product || { message: 'Not found' },
      })
    }
    let result = products
    if (url.pathname.endsWith('/search'))
      result = url.searchParams.get('q') === 'tomt' ? [] : products.slice(0, 13)
    if (url.pathname.includes('/category/')) result = products.slice(0, 2)
    const skip = Number(url.searchParams.get('skip'))
    const limit = Number(url.searchParams.get('limit'))
    await route.fulfill({
      json: {
        products: result.slice(skip, skip + limit),
        total: result.length,
        skip,
        limit,
      },
    })
  })
}
