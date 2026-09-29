export function parsePage(value) {
  // Reject manually edited page numbers that produce invalid or unsafe offsets.
  const page = Number(value)
  return Number.isSafeInteger(page) &&
    page > 0 &&
    Number.isSafeInteger((page - 1) * 12)
    ? page
    : 1
}
