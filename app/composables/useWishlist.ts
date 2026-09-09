const WISHLIST_STORAGE_KEY = 'pc_wishlist'
const MAX_WISHLIST_ITEMS = 100
let activeSyncPromise: Promise<void> | null = null
let wishlistMutationQueue: Promise<void> = Promise.resolve()

const normaliseIds = (value: unknown): number[] => Array.isArray(value)
  ? [...new Set(value.map((id) => {
    if (typeof id === 'number' && Number.isInteger(id) && id > 0) return id
    if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
    return null
  }).filter((id): id is number => typeof id === 'number' && id > 0))].slice(0, MAX_WISHLIST_ITEMS)
  : []

export const useWishlist = () => {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const ids = useState<number[]>('pc-wishlist-ids', () => [])
  const hydrated = useState<boolean>('pc-wishlist-hydrated', () => false)
  const serverHydrated = useState<boolean>('pc-wishlist-server-hydrated', () => false)
  const identity = useState<'guest' | 'auth' | ''>('pc-wishlist-identity', () => '')
  const serverIdentity = useState<string>('pc-wishlist-server-identity', () => '')
  const syncing = useState<boolean>('pc-wishlist-syncing', () => false)

  const readGuestIds = (): number[] => {
    if (!import.meta.client) return []
    try {
      return normaliseIds(JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]'))
    } catch {
      return []
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids.value.slice(0, MAX_WISHLIST_ITEMS)))
    } catch {
      // Keep the in-memory selection usable when browser storage is disabled.
    }
  }

  const hydrate = () => {
    if (auth.isAuthenticated.value || hydrated.value || !import.meta.client) return
    ids.value = readGuestIds()
    hydrated.value = true
    identity.value = 'guest'
  }

  const syncForIdentity = async () => {
    if (!import.meta.client) return
    if (activeSyncPromise) return activeSyncPromise

    const promise = (async () => {
      if (!auth.isAuthenticated.value) {
        identity.value = 'guest'
        serverIdentity.value = ''
        serverHydrated.value = false
        ids.value = readGuestIds()
        hydrated.value = true
        return
      }

      const currentIdentity = auth.user.value?.id ? `user:${auth.user.value.id}` : 'authenticated'
      if (identity.value === 'auth' && serverHydrated.value && serverIdentity.value === currentIdentity) return

      syncing.value = true
      // Only localStorage is guest data. Never merge the previous account's
      // in-memory IDs into a newly logged-in account.
      const guestIds = readGuestIds()
      try {
        if (guestIds.length) {
          await auth.authFetch(`${config.public.apiBase}/wishlist/merge`, {
            method: 'POST',
            body: { product_ids: guestIds },
          })
        }

        const response = await auth.authFetch<{ ids: unknown }>(`${config.public.apiBase}/wishlist`, {
          method: 'GET',
        })
        ids.value = normaliseIds(response.ids)
        hydrated.value = true
        identity.value = 'auth'
        serverHydrated.value = true
        serverIdentity.value = currentIdentity
        // Remove guest state only after both merge and server read succeed.
        if (guestIds.length) localStorage.removeItem(WISHLIST_STORAGE_KEY)
      } catch {
        // Keep guest IDs available for a later retry. Do not expose stale
        // wishlist data from another authenticated account.
        ids.value = guestIds
        persist()
        hydrated.value = true
        identity.value = 'guest'
        serverHydrated.value = false
        serverIdentity.value = ''
      } finally {
        syncing.value = false
      }
    })()

    activeSyncPromise = promise
    try {
      await promise
    } finally {
      if (activeSyncPromise === promise) activeSyncPromise = null
    }
  }

  const ready = async () => {
    await syncForIdentity()
  }

  const has = (id: number) => computed(() => ids.value.includes(id))

  const enqueueMutation = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = wishlistMutationQueue.then(operation, operation)
    wishlistMutationQueue = next.then(() => undefined, () => undefined)
    return next
  }

  const toggle = (id: number) => enqueueMutation(async () => {
    if (auth.isAuthenticated.value) await syncForIdentity()
    else hydrate()

    const wasSelected = ids.value.includes(id)
    if (!auth.isAuthenticated.value) {
      if (!wasSelected && ids.value.length >= MAX_WISHLIST_ITEMS) return false
      ids.value = wasSelected
        ? ids.value.filter(itemId => itemId !== id)
        : [...ids.value, id]
      persist()
      return true
    }

    const previous = [...ids.value]
    ids.value = wasSelected
      ? ids.value.filter(itemId => itemId !== id)
      : (ids.value.length < MAX_WISHLIST_ITEMS ? [...ids.value, id] : ids.value)
    if (!wasSelected && !ids.value.includes(id)) return false
    try {
      let response: { ids: unknown }
      if (wasSelected) {
        response = await auth.authFetch<{ ids: unknown }>(`${config.public.apiBase}/wishlist/items/${id}`, { method: 'DELETE' })
      } else {
        response = await auth.authFetch<{ ids: unknown }>(`${config.public.apiBase}/wishlist/items`, {
          method: 'POST',
          body: { product_id: id },
        })
      }
      ids.value = normaliseIds(response.ids)
      serverHydrated.value = true
      identity.value = 'auth'
      return true
    } catch {
      ids.value = previous
      return false
    }
  })

  const remove = (id: number) => enqueueMutation(async () => {
    if (!auth.isAuthenticated.value) {
      hydrate()
      ids.value = ids.value.filter(itemId => itemId !== id)
      persist()
      return true
    }

    await syncForIdentity()
    const previous = [...ids.value]
    ids.value = ids.value.filter(itemId => itemId !== id)
    try {
      const response = await auth.authFetch<{ ids: unknown }>(`${config.public.apiBase}/wishlist/items/${id}`, { method: 'DELETE' })
      ids.value = normaliseIds(response.ids)
      serverHydrated.value = true
      identity.value = 'auth'
      return true
    } catch {
      ids.value = previous
      return false
    }
  })

  if (import.meta.client) {
    onMounted(() => { void syncForIdentity() })
    watch(() => auth.token.value, () => {
      identity.value = ''
      serverIdentity.value = ''
      serverHydrated.value = false
      ids.value = []
      void syncForIdentity()
    })
  }

  return {
    ids,
    count: computed(() => ids.value.length),
    loading: syncing,
    hydrate,
    ready,
    syncForIdentity,
    has,
    toggle,
    remove,
  }
}
