import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

async function prepare(page) {
  await mockApi(page)
  await page.addInitScript(() =>
    localStorage.setItem('abyrvalg-language', '"en"'),
  )
}
async function keys(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('abyrvalg-images', 1)
        request.onupgradeneeded = () =>
          request.result.createObjectStore('images')
        request.onsuccess = () => {
          const db = request.result
          const read = db
            .transaction('images')
            .objectStore('images')
            .getAllKeys()
          read.onsuccess = () => {
            resolve(read.result)
            db.close()
          }
          read.onerror = reject
        }
      }),
  )
}
async function imageFile(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    canvas.getContext('2d').fillRect(0, 0, 2, 2)
    return canvas.toDataURL().split(',')[1]
  })
  return {
    name: 'demo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(data, 'base64'),
  }
}
async function upload(page) {
  await page
    .locator('[name="imageUpload"]')
    .setInputFiles(await imageFile(page))
  await expect(page.locator('ol img')).toHaveCount(1)
}
async function save(page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Changes saved' }),
  ).toBeVisible()
}

test('two tabs preserve drafts across saves and reset, with explicit conflict resolution', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  const second = await context.newPage()
  await prepare(second)
  await second.goto('/admin/content')
  await second.locator('[name="storeName-en"]').fill('Second draft')
  await page.locator('[name="storeName-en"]').fill('First saved')
  await save(page)
  await expect(second.locator('[name="storeName-en"]')).toHaveValue(
    'Second draft',
  )
  await expect(second.getByRole('alert')).toContainText(
    'Your draft is preserved',
  )
  await expect(
    second.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled()
  second.once('dialog', (dialog) => dialog.accept())
  await second.getByRole('button', { name: 'Keep my draft' }).click()
  await save(second)
  await expect(page.locator('header')).toContainText('Second draft')
  await page.getByRole('button', { name: 'Reload saved data' }).click()
  await expect(page.locator('[name="storeName-en"]')).toHaveValue(
    'Second draft',
  )
  await second.goto('/admin')
  second.once('dialog', (dialog) => dialog.accept())
  await second
    .getByRole('button', { name: 'Reset administration changes' })
    .click()
  await expect(page.getByRole('alert')).toContainText('Your draft is preserved')
  await page.getByRole('button', { name: 'Reload saved data' }).click()
  await expect(page.locator('[name="storeName-en"]')).toHaveValue('Abyrvalg')
})

test('a save without receiving the storage event is rejected as stale', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.addInitScript(() =>
    window.addEventListener('storage', (event) =>
      event.stopImmediatePropagation(),
    ),
  )
  await page.goto('/admin/content')
  const second = await context.newPage()
  await prepare(second)
  await second.goto('/admin/content')
  await page.locator('[name="storeName-en"]').fill('Stale draft')
  await second.locator('[name="storeName-en"]').fill('Latest')
  await save(second)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Your draft is preserved')
  await expect(page.locator('[name="storeName-en"]')).toHaveValue('Stale draft')
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('abyrvalg-admin')).content.storeName.en,
    ),
  ).toBe('Latest')
})

test('cleanup protects another tab draft, then deletes removed and cancelled uploads', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  await upload(page)
  const second = await context.newPage()
  await prepare(second)
  await second.goto('/admin')
  await second.getByRole('button', { name: 'Clean up unused uploads' }).click()
  expect(await keys(page)).toHaveLength(1)
  await page
    .getByRole('button', { name: 'Remove image 1', exact: true })
    .click()
  await expect.poll(() => keys(page)).toHaveLength(0)
  await upload(page)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect.poll(() => keys(page)).toHaveLength(0)
  await upload(page)
  await save(page)
  await second.getByRole('button', { name: 'Clean up unused uploads' }).click()
  expect(await keys(page)).toHaveLength(1)
  second.once('dialog', (dialog) => dialog.accept())
  await second
    .getByRole('button', { name: 'Reset administration changes' })
    .click()
  expect(await keys(page)).toHaveLength(1) // The first tab can still reload/cancel its draft.
  await page.getByRole('button', { name: 'Reload saved data' }).click()
  await expect.poll(() => keys(page)).toHaveLength(0)
})

test('failed configuration persistence rolls back imported uploads and keeps saved settings', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin')
  const image = await imageFile(page)
  const payload = {
    version: 1,
    products: {},
    content: { logo: 'image:import' },
    images: {
      'image:import':
        'data:image/png;base64,' + image.buffer.toString('base64'),
    },
  }
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'abyrvalg-admin') throw Error('quota')
      return original.call(this, key, value)
    }
  })
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('[name="adminConfigurationImport"]').setInputFiles({
    name: 'import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  })
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Changes could not be saved' })
      .last(),
  ).toBeVisible()
  await expect.poll(() => keys(page)).toHaveLength(0)
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-admin')),
  ).toBeNull()
})

test('oversized export is rejected before FileReader creates any Base64 strings', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin')
  await page.evaluate(async () => {
    const references = Array.from({ length: 8 }, (_, i) => `image:large-${i}`)
    await new Promise((resolve) => {
      const request = indexedDB.open('abyrvalg-images', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('images')
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('images', 'readwrite')
        for (const reference of references)
          tx.objectStore('images').put(
            new Blob([new Uint8Array(5 * 1024 * 1024)], { type: 'image/png' }),
            reference,
          )
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
      }
    })
    localStorage.setItem(
      'abyrvalg-admin',
      JSON.stringify({
        version: 1,
        content: {},
        products: {
          1: {
            price: 1,
            stock: 1,
            hidden: false,
            category: 'demo',
            brand: '',
            thumbnail: references[0],
            images: references,
            text: {
              en: { title: 'Demo', description: '' },
              nb: { title: 'Demo', description: '' },
            },
          },
        },
      }),
    )
  })
  await page.reload()
  await page.evaluate(() => {
    window.readCount = 0
    FileReader.prototype.readAsDataURL = () => {
      window.readCount++
    }
  })
  await page.getByRole('button', { name: 'Export configuration' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Configuration exceeds 50 MB' }),
  ).toBeVisible()
  expect(await page.evaluate(() => window.readCount)).toBe(0)
})

test('normal storefront sends limit/skip and detail routes avoid full catalogue downloads', async ({
  page,
}) => {
  await prepare(page)
  const requests = []
  page.on('request', (request) => {
    if (request.url().startsWith('https://dummyjson.com'))
      requests.push(new URL(request.url()))
  })
  await page.goto('/?page=2&sort=price-desc')
  await expect(page.getByRole('article')).toHaveCount(12)
  expect(
    requests.some(
      (url) =>
        url.searchParams.get('limit') === '12' &&
        url.searchParams.get('skip') === '12' &&
        url.searchParams.get('sortBy') === 'price',
    ),
  ).toBe(true)
  expect(requests.some((url) => url.searchParams.get('limit') === '1000')).toBe(
    false,
  )
  requests.length = 0
  await page.goto('/products/1')
  await expect(
    page.getByRole('heading', { name: 'Produkt 1', exact: true }),
  ).toBeVisible()
  expect(requests.some((url) => url.pathname === '/products')).toBe(false)
})

test('administration titles and accessible branding use configured bilingual names', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  await expect(page).toHaveTitle('Store content – Abyrvalg')
  await page.locator('[name="storeName-en"]').fill('Demo name')
  await page.locator('[name="storeName-nb"]').fill('Demonavn')
  await save(page)
  for (const [path, title] of [
    ['/admin', 'Dashboard'],
    ['/admin/products', 'Products'],
    ['/admin/content', 'Store content'],
    ['/admin/orders', 'Demo orders'],
  ]) {
    await page.goto(path)
    await expect(page).toHaveTitle(`${title} – Demo name`)
    await expect(
      page.getByRole('link', { name: 'Demo name – home', exact: true }),
    ).toBeVisible()
  }
  await page
    .getByRole('combobox', { name: 'Choose language' })
    .selectOption('nb')
  await expect(page).toHaveTitle('Demoordre – Demonavn')
  await expect(
    page.getByRole('link', { name: 'Demonavn – hjem', exact: true }),
  ).toBeVisible()
})

test('invalid bytes, excessive dimensions and HTTP URLs are rejected; external imports require host consent', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  await page.locator('[name="imageUpload"]').setInputFiles({
    name: 'fake.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not an image'),
  })
  await expect(page.getByRole('alert')).toContainText('Invalid image bytes')
  const huge = Buffer.alloc(33)
  huge.set([137, 80, 78, 71])
  huge.write('IHDR', 12)
  huge.writeUInt32BE(50000, 16)
  huge.writeUInt32BE(1, 20)
  await page
    .locator('[name="imageUpload"]')
    .setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: huge })
  await expect(page.getByRole('alert')).toContainText('Maximum 4096')
  await page.locator('[name="imageUrl"]').fill('http://images.example/test.png')
  await page.getByRole('button', { name: 'Add image URL' }).click()
  await expect(page.getByRole('alert')).toContainText('HTTPS')
  await page.goto('/admin')
  const hosts = []
  page.on('request', (request) => {
    if (request.url().includes('images.example')) hosts.push(request)
  })
  let disclosure
  page.once('dialog', async (dialog) => {
    disclosure = dialog.message()
    await dialog.dismiss()
  })
  await page.locator('[name="adminConfigurationImport"]').setInputFiles({
    name: 'external.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        products: {},
        content: { logo: 'https://images.example/test.png' },
      }),
    ),
  })
  await expect.poll(() => disclosure).toContain('images.example')
  expect(disclosure).toContain('IP address')
  expect(hosts).toHaveLength(0)
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-admin')),
  ).toBeNull()
})

test('partial imports roll back validated images when a later image is invalid', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin')
  const file = await imageFile(page)
  const payload = {
    version: 1,
    content: {},
    products: {
      1: {
        price: 1,
        stock: 1,
        hidden: false,
        category: 'demo',
        brand: '',
        thumbnail: 'image:first',
        images: ['image:first', 'image:invalid'],
        text: {
          en: { title: 'Demo', description: '' },
          nb: { title: 'Demo', description: '' },
        },
      },
    },
    images: {
      'image:first': 'data:image/png;base64,' + file.buffer.toString('base64'),
      'image:invalid':
        'data:image/png;base64,' + Buffer.from('invalid').toString('base64'),
    },
  }
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('[name="adminConfigurationImport"]').setInputFiles({
    name: 'partial.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  })
  await expect(
    page.getByRole('status').filter({ hasText: 'Invalid image bytes' }),
  ).toBeVisible()
  await expect.poll(() => keys(page)).toHaveLength(0)
  expect(
    await page.evaluate(() => localStorage.getItem('abyrvalg-admin')),
  ).toBeNull()
})

test('restoring a product deletes its unused upload after the editor closes', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin/products')
  await page
    .getByRole('button', { name: 'Edit product #1', exact: true })
    .click()
  await upload(page)
  await save(page)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Restore original product' }).click()
  await expect.poll(() => keys(page)).toHaveLength(0)
})

test('image re-encoding removes appended metadata, and animated GIFs are rejected explicitly', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  const file = await imageFile(page)
  file.buffer = Buffer.concat([
    file.buffer,
    Buffer.from('PRIVATE-METADATA-DEMO'),
  ])
  await page.locator('[name="imageUpload"]').setInputFiles(file)
  await expect(page.locator('ol img')).toHaveCount(1)
  const containsMetadata = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.open('abyrvalg-images', 1)
        request.onsuccess = () => {
          const db = request.result
          const read = db.transaction('images').objectStore('images').getAll()
          read.onsuccess = async () => {
            const bytes = await read.result[0].arrayBuffer()
            db.close()
            resolve(
              new TextDecoder().decode(bytes).includes('PRIVATE-METADATA-DEMO'),
            )
          }
        }
      }),
  )
  expect(containsMetadata).toBe(false)
  // Two structurally valid GIF frame blocks; the animation check runs before bitmap decoding.
  const header = Buffer.from('47494638396101000100800000000000ffffff', 'hex')
  const frame = Buffer.from('2c0000000001000100000202440100', 'hex')
  await page.locator('[name="imageUpload"]').setInputFiles({
    name: 'animated.gif',
    mimeType: 'image/gif',
    buffer: Buffer.concat([header, frame, frame, Buffer.from([59])]),
  })
  await expect(page.getByRole('alert')).toContainText(
    'Animated images are not accepted',
  )
  expect(await keys(page)).toHaveLength(1)
})

test('accepted external imports render without referrers; legacy HTTP images stay blocked', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin')
  const file = await imageFile(page)
  const requests = []
  await page.route('https://images.example/**', async (route) => {
    requests.push(await route.request().allHeaders())
    return route.fulfill({ contentType: 'image/png', body: file.buffer })
  })
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('[name="adminConfigurationImport"]').setInputFiles({
    name: 'external.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        products: {},
        content: { logo: 'https://images.example/test.png' },
      }),
    ),
  })
  await expect(
    page.getByRole('status').filter({ hasText: 'Configuration imported' }),
  ).toBeVisible()
  await expect.poll(() => requests.length).toBeGreaterThan(0)
  expect(requests.every((headers) => !headers.referer)).toBe(true)
  await expect(page.locator('header img')).toHaveAttribute(
    'referrerpolicy',
    'no-referrer',
  )
  await page.evaluate(() =>
    localStorage.setItem(
      'abyrvalg-admin',
      JSON.stringify({
        version: 1,
        products: {},
        content: { logo: 'http://legacy.example/test.png' },
      }),
    ),
  )
  await page.reload()
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Legacy HTTP images are blocked' })
      .first(),
  ).toBeVisible()
  await expect(page.locator('img[src^="http://"]')).toHaveCount(0)
})

test('reloading conflicted product data refreshes the displayed price without losing the draft first', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/admin/products')
  await page
    .getByRole('button', { name: 'Edit product #1', exact: true })
    .click()
  const second = await context.newPage()
  await prepare(second)
  await second.goto('/admin/products')
  await second
    .getByRole('button', { name: 'Edit product #1', exact: true })
    .click()
  await page.locator('[name="productPrice"]').fill('15')
  await second.locator('[name="productPrice"]').fill('21')
  await save(second)
  await expect(page.locator('[name="productPrice"]')).toHaveValue('15')
  await page.getByRole('button', { name: 'Reload saved data' }).click()
  await expect(page.locator('[name="productPrice"]')).toHaveValue('21')
})

test('saving branding alone keeps the default hero line breaks and emphasis', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  await page.locator('[name="storeName-en"]').fill('Demo name')
  await save(page)
  await page.getByRole('link', { name: 'View in store', exact: true }).click()
  await expect(page.locator('h1 br')).toHaveCount(1)
  await expect(page.locator('h1 em')).toHaveText('possibility.')
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('abyrvalg-admin')).content.heroHeading,
    ),
  ).toBeUndefined()
})

test('explicit reset recovers unreadable administration without touching cart, preferences or orders', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/admin')
  await page.evaluate(() => {
    localStorage.setItem('abyrvalg-admin', '{broken')
    localStorage.setItem('abyrvalg-orders', '[]')
    localStorage.setItem('unrelated-demo', 'preserved')
  })
  await page.reload()
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Reset administration changes' })
    .click()
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Administration changes reset' }),
  ).toBeVisible()
  const state = await page.evaluate(() => ({
    config: JSON.parse(localStorage.getItem('abyrvalg-admin')),
    orders: localStorage.getItem('abyrvalg-orders'),
    unrelated: localStorage.getItem('unrelated-demo'),
    language: localStorage.getItem('abyrvalg-language'),
  }))
  expect(state.config.products).toEqual({})
  expect(state.orders).toBe('[]')
  expect(state.unrelated).toBe('preserved')
  expect(state.language).toBe('"en"')
})

test('importing in another tab preserves the active content draft and signals a conflict', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/admin/content')
  await page.locator('[name="storeName-en"]').fill('Keep this draft')
  const second = await context.newPage()
  await prepare(second)
  await second.goto('/admin')
  second.once('dialog', (dialog) => dialog.accept())
  await second
    .locator('[name="adminConfigurationImport"]')
    .setInputFiles({
      name: 'config.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          products: {},
          content: { storeName: { en: 'Imported name', nb: 'Importert navn' } },
        }),
      ),
    })
  await expect(
    second.getByRole('status').filter({ hasText: 'Configuration imported' }),
  ).toBeVisible()
  await expect(page.locator('[name="storeName-en"]')).toHaveValue(
    'Keep this draft',
  )
  await expect(page.getByRole('alert')).toContainText('Your draft is preserved')
  await page.getByRole('button', { name: 'Reload saved data' }).click()
  await expect(page.locator('[name="storeName-en"]')).toHaveValue(
    'Imported name',
  )
})

test('closed-tab uploads become eligible for explicit cleanup', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/admin')
  const second = await context.newPage()
  await prepare(second)
  await second.goto('/admin/content')
  await upload(second)
  await page.getByRole('button', { name: 'Clean up unused uploads' }).click()
  expect(await keys(page)).toHaveLength(1)
  await second.close()
  await page.getByRole('button', { name: 'Clean up unused uploads' }).click()
  await expect.poll(() => keys(page)).toHaveLength(0)
})
