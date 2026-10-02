export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const IMAGE_ERROR = 'Use JPG, PNG, WebP or GIF images up to 5 MB.'
export const DECODE_ERROR =
  'Invalid image bytes or dimensions. Maximum 4096 pixels per side and 16 million pixels.'
export const ANIMATION_ERROR =
  'Animated images are not accepted because metadata removal cannot safely preserve their animation. Use a static image; existing saved animations are preserved.'
export const ANIMATION_IMPORT_PROMPT =
  'This backup contains animated images. Restore their original bytes to preserve animation? Original metadata will also be retained. Only continue with a trusted backup.'
export const ANIMATION_IMPORT_CANCELLED =
  'Animated image import cancelled. Existing settings are unchanged.'
export const ANIMATION_LIMIT_ERROR =
  'Animated backups must have at most 300 frames and 64 million frame pixels.'
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
export function inspectImage(bytes, type, allowAnimation = false) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (start, length) =>
    String.fromCharCode(...bytes.slice(start, start + length))
  let width, height
  let animated = false
  let frames = 0
  let framePixels = 0
  function animation() {
    if (!allowAnimation) throw Error(ANIMATION_ERROR)
    animated = true
  }
  // Bound animated frame rectangles as well as the overall canvas before decoding.
  function frame(frameWidth, frameHeight, x = 0, y = 0) {
    validateDimensions(frameWidth, frameHeight)
    framePixels += frameWidth * frameHeight
    if (++frames > 300 || framePixels > 64000000)
      throw Error(ANIMATION_LIMIT_ERROR)
    if (x + frameWidth > width || y + frameHeight > height)
      throw Error(DECODE_ERROR)
  }
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
        const chunk = ascii(offset + 4, 4)
        const size = view.getUint32(offset)
        if (offset + size + 12 > bytes.length) throw Error(DECODE_ERROR)
        // Trailing bytes are ignored by the decoder and removed by static re-encoding.
        if (chunk === 'IEND') {
          if (size !== 0) throw Error(DECODE_ERROR)
          break
        }
        if (chunk === 'acTL') {
          animation()
          if (size !== 8 || !view.getUint32(offset + 8))
            throw Error(DECODE_ERROR)
          if (view.getUint32(offset + 8) > 300)
            throw Error(ANIMATION_LIMIT_ERROR)
        }
        if (allowAnimation && chunk === 'fcTL') {
          if (size !== 26) throw Error(DECODE_ERROR)
          frame(
            view.getUint32(offset + 12),
            view.getUint32(offset + 16),
            view.getUint32(offset + 20),
            view.getUint32(offset + 24),
          )
        }
        offset += 12 + size
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
          if (frames >= 1) animation()
          frame(
            view.getUint16(offset + 4, true),
            view.getUint16(offset + 6, true),
            view.getUint16(offset, true),
            view.getUint16(offset + 2, true),
          )
          const packed = bytes[offset + 8]
          offset += 9
          if (packed & 128) offset += 3 * 2 ** ((packed & 7) + 1)
          offset++
          skipBlocks()
        } else throw Error(DECODE_ERROR)
      }
      if (!frames || bytes[offset] !== 59) throw Error(DECODE_ERROR)
    } else if (
      type === 'image/webp' &&
      ascii(0, 4) === 'RIFF' &&
      ascii(8, 4) === 'WEBP'
    ) {
      const chunk = ascii(12, 4)
      if (chunk === 'VP8X') {
        if (bytes[20] & 2) animation()
        width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
        height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
        if (animated) {
          const uint24 = (offset) =>
            bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16)
          for (let offset = 12; offset + 8 <= bytes.length;) {
            const size = view.getUint32(offset + 4, true)
            if (offset + 8 + size > bytes.length) throw Error(DECODE_ERROR)
            if (ascii(offset, 4) === 'ANMF') {
              if (size < 16) throw Error(DECODE_ERROR)
              frame(
                1 + uint24(offset + 14),
                1 + uint24(offset + 17),
                2 * uint24(offset + 8),
                2 * uint24(offset + 11),
              )
            }
            offset += 8 + size + (size % 2)
          }
        }
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
    if (animated && !frames) throw Error(DECODE_ERROR)
    return { width, height, animated }
  } catch (error) {
    if ([ANIMATION_ERROR, ANIMATION_LIMIT_ERROR].includes(error.message))
      throw error
    throw Error(DECODE_ERROR)
  }
}
export async function sanitizeImage(file, confirmAnimation) {
  validateImage(file)
  const { width, height, animated } = inspectImage(
    new Uint8Array(await file.arrayBuffer()),
    file.type,
    typeof confirmAnimation === 'function',
  )
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw Error(DECODE_ERROR)
  }
  try {
    validateDimensions(bitmap.width, bitmap.height)
    if (width * height !== bitmap.width * bitmap.height)
      throw Error(DECODE_ERROR)
    if (animated) {
      if (!confirmAnimation()) throw Error(ANIMATION_IMPORT_CANCELLED)
      // Backup restoration is explicit: canvas would silently flatten the animation.
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    // Orientation may swap JPEG dimensions; both header and decoded sizes were bounded.
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
