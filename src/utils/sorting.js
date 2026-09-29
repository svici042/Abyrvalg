// URL values map to translated labels and server-side sorting parameters.
export const SORT_OPTIONS = {
  default: { label: 'Default order' },
  'price-asc': { label: 'Price: low to high', sortBy: 'price', order: 'asc' },
  'price-desc': { label: 'Price: high to low', sortBy: 'price', order: 'desc' },
  'rating-desc': { label: 'Highest rating', sortBy: 'rating', order: 'desc' },
}

// Unknown URL values fall back to the API's default order.
export function validSort(value) {
  return Object.hasOwn(SORT_OPTIONS, value) ? value : 'default'
}
