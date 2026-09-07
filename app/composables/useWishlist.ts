const WISHLIST_STORAGE_KEY = 'pc_wishlist'
const MAX_WISHLIST_ITEMS = 100

const normaliseIds = (value: unknown): number[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0))].slice(0, MAX_WISHLIST_ITEMS)
  : []

export const useWishlist = () => {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const ids = useState<number[]>('pc-wishlist-ids', () => [])
  const hydrated = useState<boolean>('pc-wishlist-hydrated', () => false)
  const serverHydrated = useState<boolean>('pc-wishlist-server-hydrated', () => false)
  const identity = useState<'guest' | 'auth' | ''>('pc-wishlist-identity', () => '')
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
    if (!import.meta.client || syncing.value) return
    if (!auth.isAuthenticated.value) {
      identity.value = 'guest'
      serverHydrated.value = false
      ids.value = readGuestIds()
      hydrated.value = true
      return
    }
    if (identity.value === 'auth' && serverHydrated.value) return

    syncing.value = true
    const guestIds = normaliseIds([...readGuestIds(), ...ids.value])
    try {
      if (guestIds.length) {
        const merged = await auth.authFetch<{ ids: unknown }>(`${config.public.apiBase}/wishlist/merge`, {
          method: 'POST',
          body: { product_ids: guestIds },
        })
        ids.value = normaliseIds(merged.ids)
        localStorage.removeItem(WISHLIST_STORAGE_KEY)
      }

      const response = await auth.authFetch<{ ids: unknown }>(`${config.public.apiBase}/wishlist`, {
        method: 'GET',
      })
      ids.value = normaliseIds(response.ids)
      hydrated.value = true
      identity.value = 'auth'
      serverHydrated.value = true
    } catch {
      // Keep local IDs intact so a later retry can merge them safely.
      ids.value = guestIds
      hydrated.value = true
      identity.value = 'guest'
      serverHydrated.value = false
    } finally {
      syncing.value = false
    }
  }

  const ready = async () => {
    await syncForIdentity()
  }

  const has = (id: number) => computed(() => ids.value.includes(id))

  const toggle = async (id: number) => {
    hydrate()
    const wasSelected = ids.value.includes(id)
    if (!auth.isAuthenticated.value) {
      ids.value = wasSelected
        ? ids.value.filter(itemId => itemId !== id)
        : (ids.value.length < MAX_WISHLIST_ITEMS ? [...ids.value, id] : ids.value)
      persist()
      return
    }

    const previous = [...ids.value]
    ids.value = wasSelected
      ? ids.value.filter(itemId => itemId !== id)
      : (ids.value.length < MAX_WISHLIST_ITEMS ? [...ids.value, id] : ids.value)
    try {
      if (wasSelected) {
        await auth.authFetch(`${config.public.apiBase}/wishlist/items/${id}`, { method: 'DELETE' })
      } else if (ids.value.includes(id)) {
        await auth.authFetch(`${config.public.apiBase}/wishlist/items`, {
          method: 'POST',
          body: { product_id: id },
        })
      }
      serverHydrated.value = true
      identity.value = 'auth'
    } catch {
      ids.value = previous
    }
  }

  const remove = async (id: number) => {
    if (!auth.isAuthenticated.value) {
      hydrate()
      ids.value = ids.value.filter(itemId => itemId !== id)
      persist()
      return
    }

    const previous = [...ids.value]
    ids.value = ids.value.filter(itemId => itemId !== id)
    try {
      await auth.authFetch(`${config.public.apiBase}/wishlist/items/${id}`, { method: 'DELETE' })
      serverHydrated.value = true
      identity.value = 'auth'
    } catch {
      ids.value = previous
    }
  }

  if (import.meta.client) {
    onMounted(() => { void syncForIdentity() })
    watch(() => auth.isAuthenticated.value, () => { void syncForIdentity() })
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
