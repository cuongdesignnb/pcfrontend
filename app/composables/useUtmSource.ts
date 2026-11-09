/**
 * utm_source / utm_campaign / utm_content of the visit that brought the
 * customer, kept 30 days and sent with the order. A new visit with UTM tags
 * replaces the previous one (last campaign wins).
 */
export interface UtmSource {
  utm_source?: string
  utm_campaign?: string
  utm_content?: string
}

const UTM_KEYS = ['utm_source', 'utm_campaign', 'utm_content'] as const

export const useUtmSource = () => {
  const stored = useCookie<UtmSource | null>('lp_utm', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  const clean = (value: unknown) => typeof value === 'string'
    // eslint-disable-next-line no-control-regex
    ? value.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, 150)
    : ''

  const capture = (query: Record<string, unknown>) => {
    const next: UtmSource = {}
    for (const key of UTM_KEYS) {
      const value = clean(Array.isArray(query[key]) ? (query[key] as unknown[])[0] : query[key])
      if (value) next[key] = value
    }
    if (Object.keys(next).length) stored.value = next
  }

  return { utm: stored, capture }
}
