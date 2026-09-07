import 'server-only'

interface CacheEntry {
  promise: Promise<unknown>
  expiresAt: number
}

// Ephemeral per-instance cache: bounded memory, request coalescing, no cached failures.
export function createStatsCache(maxEntries = 512, now = Date.now) {
  const entries = new Map<string, CacheEntry>()

  return async function cached<T>(key: string, load: () => Promise<T>, ttl: (value: T) => number): Promise<T> {
    const existing = entries.get(key)
    if (existing && existing.expiresAt > now()) {
      entries.delete(key)
      entries.set(key, existing)
      return existing.promise as Promise<T>
    }
    entries.delete(key)
    while (entries.size >= maxEntries) {
      entries.delete(entries.keys().next().value!)
    }
    const entry: CacheEntry = { expiresAt: Infinity, promise: Promise.resolve() }
    entry.promise = Promise.resolve().then(load).then(value => {
      entry.expiresAt = now() + ttl(value)
      return value
    }).catch(error => {
      if (entries.get(key) === entry) entries.delete(key)
      throw error
    })
    entries.set(key, entry)
    return entry.promise as Promise<T>
  }
}
