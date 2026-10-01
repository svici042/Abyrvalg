export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const IMAGE_ERROR = 'Use JPG, PNG, WebP or GIF images up to 5 MB.'
export const DECODE_ERROR =
  'Invalid image bytes or dimensions. Maximum 4096 pixels per side and 16 million pixels.'
export const ANIMATION_ERROR =
  'Animated images are not accepted because metadata removal cannot safely preserve their animation. Use a static image; existing saved animations are preserved.'
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export function validateImage(file) {
  if (!TYPES.includes(file.type) || !file.size || file.size > MAX_IMAGE_SIZE)
    throw Error(IMAGE_ERROR)
}
export function validateDimensions(width, height) {
  if (
    !width ||
    !height ||
    width > 4096 ||
    height > 4096 ||
    width * height > 16000000
  )
    throw Error(DECODE_ERROR)
}
// Read format headers before decoding, so oversized images never allocate a bitmap.
export function inspectImage(bytes, type) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (start, length) =>
    String.fromCharCode(...bytes.slice(start, start + length))
  let width, height
  try {
    if (
      type === 'image/png' &&
      ascii(1, 3) === 'PNG' &&
      bytes[0] === 137 &&
      ascii(12, 4) === 'IHDR'
    ) {
      width = view.getUint32(16)
      height = view.getUint32(20)
      for (let offset = 8; offset + 12 <= bytes.length;) {
        if (ascii(offset + 4, 4) === 'acTL') throw Error(ANIMATION_ERROR)
        offset += 12 + view.getUint32(offset)
      }
    } else if (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216) {
      let offset = 2
      while (offset < bytes.length) {
        if (bytes[offset++] !== 255) throw Error(DECODE_ERROR)
        while (bytes[offset] === 255) offset++
        const marker = bytes[offset++]
        if (marker === 217 || marker === 218) break
        const length = view.getUint16(offset)
        if (length < 2) throw Error(DECODE_ERROR)
        if ([192, 193, 194].includes(marker)) {
          height = view.getUint16(offset + 3)
          width = view.getUint16(offset + 5)
          break
        }
        offset += length
      }
    } else if (
      type === 'image/gif' &&
      ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
    ) {
      width = view.getUint16(6, true)
      height = view.getUint16(8, true)
      let offset = 13 + (bytes[10] & 128 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0)
      let frames = 0
      const skipBlocks = () => {
        while (offset < bytes.length && bytes[offset]) {
          const size = bytes[offset++]
          offset += size
        }
        if (offset >= bytes.length) throw Error(DECODE_ERROR)
        offset++
      }
      while (offset < bytes.length && bytes[offset] !== 59) {
        const marker = bytes[offset++]
        if (marker === 33) {
          offset++
          skipBlocks()
        } else if (marker === 44) {
          if (++frames > 1) throw Error(ANIMATION_ERROR)
          validateDimensions(
            view.getUint16(offset + 4, true),
            view.getUint16(offset + 6, true),
          )
          const packed = bytes[offset + 8]
          offset += 9
          if (packed & 128) offset += 3 * 2 ** ((packed & 7) + 1)
          offset++
          skipBlocks()
        } else throw Error(DECODE_ERROR)
      }
      if (frames !== 1 || bytes[offset] !== 59) throw Error(DECODE_ERROR)
    } else if (
      type === 'image/webp' &&
      ascii(0, 4) === 'RIFF' &&
      ascii(8, 4) === 'WEBP'
    ) {
      const chunk = ascii(12, 4)
      if (chunk === 'VP8X') {
        if (bytes[20] & 2) throw Error(ANIMATION_ERROR)
        width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
        height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
      } else if (chunk === 'VP8L' && bytes[20] === 47) {
        const bits = view.getUint32(21, true)
        width = (bits & 16383) + 1
        height = ((bits >>> 14) & 16383) + 1
      } else if (
        chunk === 'VP8 ' &&
        ascii(23, 3) === String.fromCharCode(157, 1, 42)
      ) {
        width = view.getUint16(26, true) & 16383
        height = view.getUint16(28, true) & 16383
      }
    }
    validateDimensions(width, height)
    return { width, height }
  } catch (error) {
    if (error.message === ANIMATION_ERROR) throw error
    throw Error(DECODE_ERROR)
  }
}
export async function sanitizeImage(file) {
  validateImage(file)
  const { width, height } = inspectImage(
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  )
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw Error(DECODE_ERROR)
  }
  try {
    validateDimensions(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    // Orientation may swap JPEG dimensions; both header and decoded sizes were bounded.
    if (width * height !== bitmap.width * bitmap.height)
      throw Error(DECODE_ERROR)
    canvas.getContext('2d').drawImage(bitmap, 0, 0)
    const result = await new Promise((resolve) =>
      canvas.toBlob(
        resolve,
        file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
        0.92,
      ),
    )
    if (!result) throw Error(DECODE_ERROR)
    validateImage(result)
    return result
  } finally {
    bitmap.close()
  }
}
