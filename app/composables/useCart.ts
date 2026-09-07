import type { CartResponse, CartSummary } from '~/types/cart'

const emptySummary = (): CartSummary => ({
  item_count: 0,
  selected_item_count: 0,
  original_subtotal: 0,
  payable_before_shipping: 0,
  line_count: 0,
  selected_line_count: 0,
  quantity: 0,
  subtotal: 0,
  product_discount: 0,
  coupon_discount: 0,
  shipping_fee: 0,
  total: 0,
  shipping: {
    default_fee: 0,
    free_threshold: 0,
    amount_remaining_for_free_shipping: 0,
    eligible_for_free_shipping: false,
    estimated_fee: 0,
    free_shipping_remaining: 0,
    is_free: false,
  },
})

const emptyCart = (): CartResponse => ({
  id: 0,
  cart: { id: 0, item_count: 0, quantity: 0, selected_quantity: 0 },
  items: [],
  summary: emptySummary(),
  accessories: [],
  recommendations: [],
  benefits: [],
  payment_methods: [],
  support: { hotline: '', hours: '' },
  total: 0,
  count: 0,
  selected_count: 0,
  coupon: null,
})

function normalizeResponse(response: Partial<CartResponse>): CartResponse {
  const items = Array.isArray(response.items) ? response.items : []
  const selectedItems = items.filter(item => item.selected !== false)
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
  const fallbackOriginalSubtotal = selectedItems.reduce((sum, item) => sum + Number(item.pricing?.line_original ?? item.original_unit_price ?? item.price ?? 0), 0)
  const fallbackSubtotal = items
    .filter(item => item.selected !== false)
    .reduce((sum, item) => sum + Number(item.pricing?.line_total ?? item.unit_price ?? item.price ?? 0) * (item.pricing?.line_total === undefined ? Number(item.quantity ?? 0) : 1), 0)
  const summary = {
    ...emptySummary(),
    ...(response.summary || {}),
    item_count: Number(response.summary?.item_count ?? totalQuantity),
    selected_item_count: Number(response.summary?.selected_item_count ?? selectedQuantity),
    line_count: Number(response.summary?.line_count ?? items.length),
    selected_line_count: Number(response.summary?.selected_line_count ?? selectedItems.length),
    original_subtotal: Number(response.summary?.original_subtotal ?? fallbackOriginalSubtotal),
    subtotal: Number(response.summary?.subtotal ?? fallbackSubtotal),
    payable_before_shipping: Number(response.summary?.payable_before_shipping ?? response.summary?.subtotal ?? fallbackSubtotal),
    total: Number(response.summary?.total ?? response.total ?? response.summary?.payable_before_shipping ?? fallbackSubtotal),
  }

  return {
    ...emptyCart(),
    ...response,
    cart: { ...emptyCart().cart, ...(response.cart || {}) },
    items,
    summary: {
      ...summary,
      shipping: {
        ...emptySummary().shipping,
        ...(response.summary?.shipping || {}),
        amount_remaining_for_free_shipping: Number(response.summary?.shipping?.amount_remaining_for_free_shipping ?? response.summary?.shipping?.free_shipping_remaining ?? 0),
        eligible_for_free_shipping: Boolean(response.summary?.shipping?.eligible_for_free_shipping ?? response.summary?.shipping?.is_free ?? false),
        estimated_fee: Number(response.summary?.shipping?.estimated_fee ?? response.summary?.shipping?.default_fee ?? response.summary?.shipping_fee ?? 0),
      },
    },
    accessories: Array.isArray(response.accessories) ? response.accessories : [],
    recommendations: Array.isArray(response.recommendations) ? response.recommendations : [],
    benefits: Array.isArray(response.benefits) ? response.benefits : [],
    payment_methods: Array.isArray(response.payment_methods) ? response.payment_methods : [],
    support: { ...emptyCart().support, ...(response.support || {}) },
    total: Number(response.total ?? summary.total),
    count: Number(response.count ?? totalQuantity),
    selected_count: Number(response.selected_count ?? selectedQuantity),
    coupon: response.coupon ?? null,
  }
}

export const useCart = () => {
  const config = useRuntimeConfig()
  const { getHeaders } = useCartSession()
  const { token } = useAuth()
  const state = useState<CartResponse>('cart-response', emptyCart)
  const loading = useState<boolean>('cart-loading', () => false)
  const error = useState<unknown | null>('cart-error', () => null)
  const requestSequence = useState<number>('cart-request-sequence', () => 0)
  const latestReadSequence = useState<number>('cart-latest-read-sequence', () => 0)
  const mutationSequence = useState<number>('cart-mutation-sequence', () => 0)
  const pendingMutations = useState<number>('cart-pending-mutations', () => 0)
  const activeRequests = useState<number>('cart-active-requests', () => 0)

  const items = computed(() => state.value.items)
  const total = computed(() => state.value.summary.total)
  const itemCount = computed(() => state.value.count)
  const selectedCount = computed(() => state.value.selected_count)
  const selectedItemCount = computed(() => state.value.summary.selected_item_count)

  const apply = (response: Partial<CartResponse>) => {
    state.value = normalizeResponse(response)
    error.value = null
    return state.value
  }

  const request = async (path: string, options: Record<string, unknown> = {}) => {
    const method = String(options.method ?? 'GET').toUpperCase()
    const isRead = method === 'GET' || method === 'HEAD'
    const requestId = requestSequence.value + 1
    requestSequence.value = requestId
    const mutationVersionAtStart = mutationSequence.value
    const pendingMutationsAtStart = pendingMutations.value
    let mutationId = 0

    if (isRead) {
      latestReadSequence.value = requestId
    } else {
      mutationId = mutationSequence.value + 1
      mutationSequence.value = mutationId
      pendingMutations.value += 1
    }

    activeRequests.value += 1
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Partial<CartResponse>>(`${config.public.apiBase}${path}`, {
        ...options,
        ...(isRead ? { cache: 'no-store' } : {}),
        headers: {
          ...getHeaders(),
          ...(isRead ? { 'Cache-Control': 'no-cache' } : {}),
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
          ...((options.headers as Record<string, string> | undefined) || {}),
        },
      })

      // Header and page fetches can overlap with a cart mutation. Never let a
      // response that started before/while a mutation was pending overwrite
      // the cart snapshot returned by the mutation.
      const canApply = isRead
        ? latestReadSequence.value === requestId
          && mutationSequence.value === mutationVersionAtStart
          && pendingMutationsAtStart === 0
          && pendingMutations.value === 0
        : mutationSequence.value === mutationId

      return canApply ? apply(response) : state.value
    } catch (caught) {
      if (!isRead || latestReadSequence.value === requestId) error.value = caught
      console.error('[useCart] Request failed:', caught)
      return null
    } finally {
      if (!isRead) pendingMutations.value = Math.max(0, pendingMutations.value - 1)
      activeRequests.value = Math.max(0, activeRequests.value - 1)
      loading.value = activeRequests.value > 0
    }
  }

  const fetchCart = async () => request('/cart')

  const addItem = async (productId: number, quantity = 1, variantId?: number | null) => Boolean(await request('/cart/items', {
    method: 'POST',
    body: { product_id: productId, quantity, ...(variantId ? { variant_id: variantId } : {}) },
  }))

  const updateItem = async (itemId: number, quantity: number) => Boolean(await request(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: { quantity },
  }))

  const setItemSelected = async (itemId: number, selected: boolean) => Boolean(await request(`/cart/items/${itemId}/selection`, {
    method: 'PATCH',
    body: { selected },
  }))

  const selectAll = async (selected: boolean) => Boolean(await request('/cart/selection', {
    method: 'PATCH',
    body: { selected },
  }))

  const removeItem = async (itemId: number) => Boolean(await request(`/cart/items/${itemId}`, { method: 'DELETE' }))

  const removeItems = async (itemIds: number[]) => Boolean(await request('/cart/items', {
    method: 'DELETE',
    body: { item_ids: itemIds },
  }))

  const clearCart = async () => Boolean(await request('/cart', { method: 'DELETE' }))

  if (import.meta.client) {
    watch(token, (nextToken, previousToken) => {
      if (nextToken === previousToken) return
      if (!nextToken) apply(emptyCart())
      void fetchCart()
    })
  }

  return {
    state,
    items,
    total,
    loading,
    error,
    itemCount,
    selectedCount,
    selectedItemCount,
    fetchCart,
    addItem,
    updateItem,
    setItemSelected,
    selectAll,
    removeItem,
    removeItems,
    clearCart,
  }
}
