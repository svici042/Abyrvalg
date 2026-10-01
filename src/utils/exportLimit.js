export const MAX_CONFIG_SIZE = 50 * 1024 * 1024
export const EXPORT_ERROR =
  'Configuration exceeds 50 MB. Remove some images before exporting.'
export function assertExportSize(size) {
  if (size > MAX_CONFIG_SIZE) throw Error(EXPORT_ERROR)
  return size
}
// Exact compact JSON overhead plus the padded Base64 length, without encoding bytes.
export function imageExportSize(reference, blob) {
  return (
    new TextEncoder().encode(JSON.stringify(reference)).length +
    1 +
    2 +
    `data:${blob.type};base64,`.length +
    4 * Math.ceil(blob.size / 3) +
    1
  )
}
