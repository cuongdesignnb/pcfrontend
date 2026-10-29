/**
 * The CTV (cộng tác viên) code a visitor arrived with through ?ref=CODE.
 * The first CTV keeps the visitor, so an existing code is never replaced.
 * Browsers cap cookie lifetime at about 400 days; the backend ties the
 * customer to the CTV for good by phone number on the first order.
 */
export const useAffiliateRef = () => {
  const config = useRuntimeConfig()
  const code = useCookie<string | null>('aff_ref', {
    maxAge: 60 * 60 * 24 * 400,
    path: '/',
    sameSite: 'lax',
  })

  const normalise = (value: unknown) => typeof value === 'string' ? value.trim().toUpperCase().slice(0, 20) : ''

  const capture = async (value: unknown, url: string) => {
    const incoming = normalise(value)
    if (!incoming || !/^[A-Z0-9_-]+$/.test(incoming)) return
    try {
      const response = await $fetch<{ valid: boolean; code?: string }>(`${config.public.apiBase}/affiliate/clicks`, {
        method: 'POST',
        body: { code: incoming, url: url.slice(0, 1000) },
        cache: 'no-store',
      })
      if (response.valid && !code.value) code.value = response.code ?? incoming
    } catch {
      // Tracking must never break browsing.
    }
  }

  return { code, capture }
}
