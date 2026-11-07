import { getRequestURL, sendRedirect, type H3Event } from 'h3'

/**
 * Applies the 301/302 rules managed in admin (SEO → Chuyển hướng) before a page
 * renders. Rules are fetched from the backend and kept for a minute; when the
 * backend is unreachable the last list (or none) is used so pages still load.
 */
interface RedirectRule { from: string, to: string, status: number }

const TTL_MS = 60_000
let cache: { at: number, rules: Map<string, RedirectRule> } | null = null
let pending: Promise<Map<string, RedirectRule>> | null = null

export function normalizeRedirectPath(path: string): string {
  let decoded = path
  try {
    decoded = decodeURIComponent(path)
  } catch {
    // Keep the raw path when it is not valid percent-encoding.
  }
  const trimmed = decoded.toLowerCase().replace(/\/+$/, '')
  return trimmed || '/'
}

export function parseRedirectRules(value: unknown): Map<string, RedirectRule> {
  const rules = new Map<string, RedirectRule>()
  const list = value && typeof value === 'object' && 'data' in value && Array.isArray(value.data) ? value.data : []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const { from, to, status } = item as Record<string, unknown>
    if (typeof from !== 'string' || !from.startsWith('/') || typeof to !== 'string') continue
    const local = to.startsWith('/') && !to.startsWith('//')
    if (!local && !/^https:\/\//i.test(to)) continue
    rules.set(normalizeRedirectPath(from), { from, to, status: status === 302 ? 302 : 301 })
  }
  return rules
}

async function loadRules(): Promise<Map<string, RedirectRule>> {
  const origin = (process.env.NUXT_API_PROXY_TARGET || '').replace(/\/$/, '')
  if (!origin) return new Map()
  try {
    const rules = parseRedirectRules(await $fetch(`${origin}/api/v1/redirects`, { timeout: 2000, retry: 0 }))
    cache = { at: Date.now(), rules }
    return rules
  } catch {
    cache = { at: Date.now(), rules: cache?.rules ?? new Map() }
    return cache.rules
  }
}

async function rules(): Promise<Map<string, RedirectRule>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules
  pending ??= loadRules().finally(() => { pending = null })
  return pending
}

export default defineEventHandler(async (event: H3Event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const url = getRequestURL(event)
  const path = url.pathname
  if (path === '/' || /^\/(_nuxt|api|__nuxt|_ipx|_i18n|sitemaps?)(\/|$)/.test(path) || /\.[a-z0-9]{2,5}$/i.test(path)) return

  const rule = (await rules()).get(normalizeRedirectPath(path))
  if (!rule) return
  // Keep tracking parameters (utm_…, ref) when the target has no query of its own.
  const target = rule.to.startsWith('/') && !rule.to.includes('?') && url.search ? rule.to + url.search : rule.to
  return sendRedirect(event, target, rule.status)
})
