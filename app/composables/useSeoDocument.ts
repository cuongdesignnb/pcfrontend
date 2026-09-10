import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { SeoDocumentInput } from '~/types/seo'

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

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function useSeoDocument(input: MaybeRefOrGetter<SeoDocumentInput>) {
  const config = useRuntimeConfig()
  const origin = computed(() => trustedSiteOrigin(config.public.siteUrl))
  const document = computed(() => toValue(input))
  const canonicalUrl = computed(() => canonicalAbsoluteUrl(origin.value, document.value.path))
  const imageUrl = computed(() => publicAbsoluteUrl(origin.value, document.value.image))

  useSeoMeta({
    title: () => document.value.title,
    description: () => document.value.description || undefined,
    robots: () => document.value.robots || 'index,follow',
    ogTitle: () => document.value.title,
    ogDescription: () => document.value.description || undefined,
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
