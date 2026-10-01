import {
  administrationLock,
  protectedImages,
  stageImages,
  releaseImages,
} from './adminStorage.js'
import { MAX_IMAGE_SIZE, sanitizeImage } from './imageValidation.js'
import { assertExportSize, imageExportSize } from './exportLimit.js'
export { MAX_IMAGE_SIZE, validateImage } from './imageValidation.js'

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('abyrvalg-images', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('images')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(Error('Image storage unavailable'))
  })
}
async function transaction(mode, action) {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('images', mode)
      const result = action(tx.objectStore('images'))
      tx.oncomplete = () => resolve(result?.result)
      tx.onerror = tx.onabort = () => reject(Error('Image storage unavailable'))
    })
  } finally {
    db.close()
  }
}
export async function putImage(file) {
  const blob = await sanitizeImage(file)
  const reference = `image:${crypto.randomUUID()}`
  try {
    await administrationLock(async () => {
      await stageImages([reference])
      await transaction('readwrite', (store) => store.put(blob, reference))
    })
  } catch (error) {
    await releaseImages([reference])
    throw error
  }
  return reference
}
export function getImage(reference) {
  return transaction('readonly', (store) => store.get(reference))
}
// The same lock covers saves, upload publication and deletion; active draft IDs are protected.
export async function cleanupImages(candidates) {
  return administrationLock(async () => {
    const protectedRefs = await protectedImages()
    const keys =
      candidates ||
      (await transaction('readonly', (store) => store.getAllKeys()))
    const unused = keys.filter((key) => !protectedRefs.has(key))
    await transaction('readwrite', (store) => {
      for (const key of unused) store.delete(key)
    })
    return unused.length
  })
}
export async function rollbackImages(references) {
  await releaseImages(references)
  return cleanupImages(references)
}
export async function exportImages(
  references,
  overhead = 0,
  progress = () => {},
) {
  let size = assertExportSize(overhead)
  const blobs = []
  // Preflight every blob size before creating even the first Base64 string.
  for (const reference of references) {
    const blob = await getImage(reference)
    if (!blob)
      throw Error('Missing uploaded image. Remove it or upload it again.')
    size = assertExportSize(size + imageExportSize(reference, blob))
    blobs.push([reference, blob])
  }
  const images = {}
  let running = overhead
  for (const [reference, blob] of blobs) {
    running = assertExportSize(running + imageExportSize(reference, blob))
    images[reference] = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(Error('Image storage unavailable'))
      reader.readAsDataURL(blob)
    })
    progress(Object.keys(images).length, references.length)
  }
  return images
}
export async function importImages(references, images = {}) {
  const mapping = {}
  try {
    // Sequential decoding bounds memory usage; failed partial imports are rolled back.
    for (const reference of references) {
      const data = images[reference]
      if (
        typeof data !== 'string' ||
        data.length > MAX_IMAGE_SIZE * 1.4 ||
        !/^data:image\/(jpeg|png|webp|gif);base64,/.test(data)
      )
        throw Error('Invalid demo configuration')
      const [header, encoded] = data.split(',')
      let bytes
      try {
        bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))
      } catch {
        throw Error('Invalid demo configuration')
      }
      mapping[reference] = await putImage(
        new Blob([bytes], { type: header.slice(5, header.indexOf(';')) }),
      )
    }
    return mapping
  } catch (error) {
    await rollbackImages(Object.values(mapping))
    throw error
  }
}
