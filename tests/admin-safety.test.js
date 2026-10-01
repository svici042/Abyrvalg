import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertExportSize,
  imageExportSize,
  MAX_CONFIG_SIZE,
} from '../src/utils/exportLimit.js'
import {
  inspectImage,
  validateDimensions,
  ANIMATION_ERROR,
} from '../src/utils/imageValidation.js'
import {
  externalHosts,
  hasHttpImages,
  emptyConfig,
} from '../src/utils/admin.js'
import { defaultStoreContent } from '../src/config/storeContent.js'

test('export preflight accounts for padded Base64, UTF-8 JSON keys and MIME prefix', () => {
  const ref = 'image:test'
  const data = 'data:image/png;base64,' + Buffer.alloc(4).toString('base64')
  const actual = Buffer.byteLength(JSON.stringify({ [ref]: data })) - 2 + 1
  assert.equal(imageExportSize(ref, { size: 4, type: 'image/png' }), actual)
  assert.equal(assertExportSize(MAX_CONFIG_SIZE), MAX_CONFIG_SIZE)
  assert.throws(() => assertExportSize(MAX_CONFIG_SIZE + 1), /50 MB/)
})
test('headers reject forged MIME, huge dimensions and animations before decoding', () => {
  assert.throws(
    () => inspectImage(new Uint8Array([1, 2, 3]), 'image/png'),
    /Invalid image/,
  )
  assert.throws(() => validateDimensions(4097, 1))
  assert.throws(() => validateDimensions(4096, 4096))
  validateDimensions(4000, 4000)
  const bytes = new Uint8Array(48)
  bytes.set([137, 80, 78, 71], 0)
  bytes.set(Buffer.from('IHDR'), 12)
  const view = new DataView(bytes.buffer)
  view.setUint32(8, 13)
  view.setUint32(16, 50000)
  view.setUint32(20, 1)
  assert.throws(() => inspectImage(bytes, 'image/png'), /Invalid image/)
  view.setUint32(16, 1)
  bytes.set(Buffer.from('acTL'), 37)
  // APNG chunk starts after the 25-byte IHDR chunk.
  assert.throws(
    () => inspectImage(bytes, 'image/png'),
    (error) => error.message === ANIMATION_ERROR,
  )
})
test('external hosts are deduplicated and HTTP migration is detected', () => {
  const config = {
    ...emptyConfig(),
    content: { logo: 'https://images.example/a' },
    products: {
      1: {
        thumbnail: 'http://old.example/a',
        images: ['https://images.example/b'],
      },
    },
  }
  assert.deepEqual(externalHosts(config), ['images.example', 'old.example'])
  assert.equal(hasHttpImages(config), true)
  assert.equal(hasHttpImages(emptyConfig()), false)
})
test('shared bilingual defaults preserve the original hero segments and correct branding', () => {
  const content = defaultStoreContent()
  assert.equal(content.storeName.en, 'Abyrvalg')
  assert.equal(content.storeName.nb, 'Abyrvalg')
  assert.equal(content.heroHeading.nb, 'Hverdagen, med litt mer muligheter.')
  assert.equal(
    content.heroHeading.en,
    'Everyday life, with a little more possibility.',
  )
})

test('serialized saves detect stale revisions and reject quota failures without changing storage', async () => {
  const values = new Map()
  let tail = Promise.resolve()
  const locks = {
    request(name, callback) {
      if (name.startsWith('abyrvalg-draft:')) return Promise.resolve(callback())
      const next = tail.then(callback)
      tail = next.catch(() => {})
      return next
    },
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { locks },
  })
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const { persistAdministration, CONFLICT } =
    await import('../src/utils/adminStorage.js')
  const results = await Promise.allSettled([
    persistAdministration(emptyConfig(), null),
    persistAdministration(emptyConfig(), null),
  ])
  assert.equal(
    results.filter((result) => result.status === 'fulfilled').length,
    1,
  )
  assert.equal(
    results.find((result) => result.status === 'rejected').reason.message,
    CONFLICT,
  )
  const before = localStorage.getItem('abyrvalg-admin')
  localStorage.setItem = () => {
    throw Error('quota')
  }
  await assert.rejects(
    persistAdministration(emptyConfig(), before),
    /Changes could not be saved/,
  )
  assert.equal(localStorage.getItem('abyrvalg-admin'), before)
})
