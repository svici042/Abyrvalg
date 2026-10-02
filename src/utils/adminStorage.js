import {
  ADMIN_KEY,
  emptyConfig,
  imageReferences,
  validateConfig,
  hasHttpImages,
} from './admin.js'

export const CONFLICT =
  'Administration changed in another tab. Your draft is preserved. Reload saved data or explicitly keep your draft to replace this section.'
export const STORAGE_ERROR =
  'Changes could not be saved. Allow browser storage or free up space.'
const LOCK = 'abyrvalg-administration'
const PREFIX = 'abyrvalg-draft:'
const drafts = new Map()
const staged = new Set()
let session

// A lifetime lock distinguishes active (including suspended) tabs from closed tabs.
export function imageSession() {
  if (!session)
    session = new Promise((resolve, reject) => {
      if (!navigator.locks)
        return reject(
          Error(
            'Safe administration requires browser locks. Use a current browser over HTTPS or localhost.',
          ),
        )
      const name = PREFIX + crypto.randomUUID()
      navigator.locks
        .request(name, () => {
          // Publish even an empty session before cleanup can inspect its lifetime lock.
          try {
            localStorage.setItem(name, '[]')
            resolve(name)
          } catch {
            reject(Error(STORAGE_ERROR))
          }
          return new Promise(() => {})
        })
        .catch(reject)
    })
  return session
}
export async function administrationLock(action) {
  await imageSession()
  return navigator.locks.request(LOCK, action)
}
function publish(name) {
  try {
    localStorage.setItem(
      name,
      JSON.stringify([...new Set([...staged, ...[...drafts.values()].flat()])]),
    )
  } catch {
    throw Error(STORAGE_ERROR)
  }
}
export async function protectImages(id, references) {
  const name = await imageSession()
  return administrationLock(() => {
    drafts.set(id, references)
    for (const reference of references) staged.delete(reference)
    publish(name)
  })
}
export async function unprotectImages(id) {
  const name = await imageSession()
  return administrationLock(() => {
    drafts.delete(id)
    publish(name)
  })
}
// Called while holding the administration lock, before an upload becomes visible.
export async function stageImages(references) {
  const name = await imageSession()
  for (const reference of references) staged.add(reference)
  publish(name)
}
export async function releaseImages(references) {
  const name = await imageSession()
  return administrationLock(() => {
    for (const reference of references) staged.delete(reference)
    publish(name)
  })
}
export function readAdministration() {
  let raw
  try {
    raw = localStorage.getItem(ADMIN_KEY)
  } catch {
    throw Error(STORAGE_ERROR)
  }
  return { raw, config: raw ? validateConfig(JSON.parse(raw)) : emptyConfig() }
}
export async function protectedImages() {
  const references = new Set(imageReferences(readAdministration().config))
  // Snapshot keys before querying locks so newly starting tabs are never deleted.
  const sessions = []
  for (let index = 0; index < localStorage.length; index++) {
    const name = localStorage.key(index)
    if (name?.startsWith(PREFIX)) sessions.push(name)
  }
  const { held, pending } = await navigator.locks.query()
  const active = new Set([...held, ...pending].map(({ name }) => name))
  for (const { name } of held) {
    if (!name.startsWith(PREFIX)) continue
    const raw = localStorage.getItem(name)
    if (!raw) throw Error(STORAGE_ERROR)
    if (raw) {
      const entries = JSON.parse(raw)
      if (
        !Array.isArray(entries) ||
        entries.some((entry) => typeof entry !== 'string')
      )
        throw Error(STORAGE_ERROR)
      for (const reference of entries) references.add(reference)
    }
  }
  // Validate every stale record before deleting any; malformed storage fails closed.
  const obsolete = sessions.filter((name) => !active.has(name))
  for (const name of obsolete) {
    const raw = localStorage.getItem(name)
    if (raw === null) continue
    const entries = JSON.parse(raw)
    if (
      !Array.isArray(entries) ||
      entries.some((entry) => typeof entry !== 'string')
    )
      throw Error(STORAGE_ERROR)
  }
  for (const name of obsolete) localStorage.removeItem(name)
  return references
}
export async function persistAdministration(next, expectedRaw) {
  return administrationLock(() => {
    let rawBefore
    try {
      rawBefore = localStorage.getItem(ADMIN_KEY)
    } catch {
      throw Error(STORAGE_ERROR)
    }
    if (rawBefore !== expectedRaw) throw Error(CONFLICT)
    const config = validateConfig(next)
    if (hasHttpImages(config))
      throw Error(
        'Legacy HTTP images are blocked. Replace them with HTTPS URLs or uploads before saving or importing.',
      )
    // A fresh revision also detects reset/import cycles returning to identical values.
    config.revision = crypto.randomUUID()
    const raw = JSON.stringify(config)
    try {
      localStorage.setItem(ADMIN_KEY, raw)
    } catch {
      throw Error(STORAGE_ERROR)
    }
    return { raw, config }
  })
}
