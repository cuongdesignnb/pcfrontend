import type { CheckoutQuote, CheckoutQuoteRequest } from '~/types/checkout'

export const useCheckoutQuote = () => {
  const config = useRuntimeConfig()
  const { getHeaders: getCartHeaders } = useCartSession()
  const { token } = useAuth()
  const quote = ref<CheckoutQuote | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const headers = () => ({
    ...getCartHeaders(),
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  })

  const fetchQuote = async (payload: CheckoutQuoteRequest): Promise<CheckoutQuote | null> => {
    const currentRequestId = ++requestId
    loading.value = true
    error.value = null
    quote.value = null
    try {
      const response = await $fetch<CheckoutQuote>(`${config.public.apiBase}/checkout/quote`, {
        method: 'POST',
        headers: headers(),
        body: payload,
      })
      if (currentRequestId !== requestId) return null
      quote.value = response
      return response
    } catch (caught) {
      if (currentRequestId === requestId) {
        const payload = (caught as { data?: { message?: string } }).data
        error.value = payload?.message ?? 'Không thể cập nhật báo giá checkout.'
      }
      return null
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  const scheduleQuote = (payload: CheckoutQuoteRequest, delay = 280) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    requestId += 1
    quote.value = null
    loading.value = true
    error.value = null
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void fetchQuote(payload)
    }, delay)
  }

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { quote, loading, error, fetchQuote, scheduleQuote }
}
