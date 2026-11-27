import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { RobotsDirective, SeoDocumentInput } from '~/types/seo'
import { normalizeSeoTitle } from '~/utils/seoIdentity'

function cleanOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null

  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (url.username || url.password || url.search || url.hash || (url.pathname !== '' && url.pathname !== '/')) return null
    if (import.meta.server && process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export function trustedSiteOrigin(value: unknown): string | null {
  return cleanOrigin(value)
}

export function publicAbsoluteUrl(origin: string | null, pathOrUrl: string | null | undefined): string | null {
  if (!origin || !pathOrUrl) return null
  try {
    const url = new URL(pathOrUrl, origin)
    if (url.origin !== origin) return url.toString()
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function canonicalAbsoluteUrl(origin: string | null, path: string | null | undefined): string | null {
  if (!origin || !path || !path.startsWith('/') || path.startsWith('//')) return null
  try {
    const url = new URL(path, origin)
    if (url.origin !== origin) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Canonical set in admin: an absolute https URL. A value that only repeats
 * the page's own path (the API's default) is ignored, so the storefront
 * origin keeps deciding the host.
 */
export function canonicalOverrideUrl(origin: string | null, value: string | null | undefined, ownPath: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null
  try {
    const url = origin ? new URL(value, origin) : new URL(value)
    if (url.protocol !== 'https:' && !(origin && url.origin === origin)) return null
    if (url.username || url.password) return null
    url.hash = ''
    if (ownPath && url.pathname === ownPath.split('?')[0] && !url.search) return null
    return url.toString()
  } catch {
    return null
  }
}

/** Robots value from the API; anything unexpected falls back to the default. */
export function normalizeRobots(value: unknown, fallback: RobotsDirective = 'index,follow'): RobotsDirective {
  const allowed: RobotsDirective[] = ['index,follow', 'noindex,follow', 'noindex,nofollow', 'index,nofollow']
  const cleaned = typeof value === 'string' ? value.replace(/\s+/g, '') as RobotsDirective : null
  return cleaned && allowed.includes(cleaned) ? cleaned : fallback
}

/** Meta description text: HTML tags and entities removed, one line, at most 160 characters. */
export function plainSeoText(value: string | null | undefined, max = 160): string {
  const text = String(value ?? '')
    .replace(/<(?:br|\/p|\/li|\/h[1-6])\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function useSeoDocument(input: MaybeRefOrGetter<SeoDocumentInput>) {
  const config = useRuntimeConfig()
  const origin = computed(() => trustedSiteOrigin(config.public.siteUrl))
  const document = computed(() => toValue(input))
  const canonicalUrl = computed(() => canonicalOverrideUrl(origin.value, document.value.canonicalUrl, document.value.path)
    || canonicalAbsoluteUrl(origin.value, document.value.path))
  const imageUrl = computed(() => publicAbsoluteUrl(origin.value, document.value.image))

  useSeoMeta({
    title: () => normalizeSeoTitle(document.value.title) || undefined,
    description: () => plainSeoText(document.value.description) || undefined,
    robots: () => document.value.robots || 'index,follow',
    ogTitle: () => normalizeSeoTitle(document.value.title) || undefined,
    ogDescription: () => plainSeoText(document.value.description) || undefined,
    ogUrl: () => canonicalUrl.value || undefined,
    ogType: () => document.value.type || 'website',
    ogImage: () => imageUrl.value || undefined,
    twitterCard: 'summary_large_image',
  })

  useHead(() => ({
    link: canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  }))

  return { origin, canonicalUrl, imageUrl }
}
