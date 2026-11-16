/**
 * utm_source / utm_medium / utm_campaign / utm_content / utm_term and the ad
 * click ids (gclid from Google Ads, fbclid from Facebook) of the visit that
 * brought the customer, kept 30 days and sent with the order. A new visit
 * with UTM tags replaces the previous one (last campaign wins).
 *
 * The landing page is the first page opened on the website: the page of the
 * visit that set the UTM tags, otherwise the first page seen in 30 days.
 */
export interface UtmSource {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
}

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'] as const

/** Click ids can be long; UTM tags are limited to 150 characters like on the server. */
const MAX_LENGTH: Record<(typeof UTM_KEYS)[number], number> = {
  utm_source: 150, utm_medium: 150, utm_campaign: 150, utm_content: 150, utm_term: 150, gclid: 255, fbclid: 255,
}

const THIRTY_DAYS = 60 * 60 * 24 * 30

export const useUtmSource = () => {
  const stored = useCookie<UtmSource | null>('lp_utm', { maxAge: THIRTY_DAYS, path: '/', sameSite: 'lax' })
  const landing = useCookie<string | null>('lp_landing', { maxAge: THIRTY_DAYS, path: '/', sameSite: 'lax' })

  const clean = (value: unknown, max = 150) => typeof value === 'string'
    // eslint-disable-next-line no-control-regex
    ? value.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max)
    : ''

  const cleanPath = (path: string) => {
    const value = clean(path, 500)
    return value.startsWith('/') && !value.startsWith('//') ? value : ''
  }

  const capture = (query: Record<string, unknown>, fullPath = '') => {
    const next: UtmSource = {}
    for (const key of UTM_KEYS) {
      const value = clean(Array.isArray(query[key]) ? (query[key] as unknown[])[0] : query[key], MAX_LENGTH[key])
      if (value) next[key] = value
    }
    if (!Object.keys(next).length) return
    stored.value = next
    const path = cleanPath(fullPath)
    if (path) landing.value = path
  }

  /** Keep the first page of the visit when no UTM visit set one. */
  const rememberLanding = (fullPath: string) => {
    if (landing.value) return
    const path = cleanPath(fullPath)
    if (path) landing.value = path
  }

  return { utm: stored, landing, capture, rememberLanding }
}
