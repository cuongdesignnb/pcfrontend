import { createError, getHeader, getRequestURL, sendStream, setResponseHeader, setResponseStatus } from 'h3'

// The catalog feeds (Google Merchant XML, Meta CSV) live on the backend. This
// lets the shop give Google and Meta a laptopplus.vn address. Only the body and
// a few safe headers are passed on: the backend's session cookies must never
// reach the storefront domain. The feed token stays in the query string.
const FEED_PATH = /^\/feeds\/(google\/products\.xml|meta\/[a-z0-9-]+\.csv)$/

function backendOrigin(): string | null {
  const configured = process.env.NUXT_API_PROXY_TARGET || ''
  try {
    const url = new URL(configured)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!FEED_PATH.test(url.pathname)) {
    throw createError({ statusCode: 404, statusMessage: 'Feed not found' })
  }
  const origin = backendOrigin()
  if (!origin) {
    throw createError({ statusCode: 503, statusMessage: 'Feed upstream is not configured' })
  }

  const ifNoneMatch = getHeader(event, 'if-none-match')
  let upstream: Response
  try {
    upstream = await fetch(origin + url.pathname + url.search, {
      headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {},
      redirect: 'manual',
    })
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Feed upstream is unavailable' })
  }

  if (upstream.status !== 200 && upstream.status !== 304) {
    throw createError({ statusCode: upstream.status === 404 ? 404 : 503, statusMessage: 'Feed not available' })
  }

  setResponseStatus(event, upstream.status)
  for (const name of ['content-type', 'etag', 'last-modified', 'content-disposition']) {
    const value = upstream.headers.get(name)
    if (value) setResponseHeader(event, name, value)
  }
  setResponseHeader(event, 'cache-control', 'private, no-store, max-age=0')
  setResponseHeader(event, 'x-robots-tag', 'noindex, nofollow')

  if (upstream.status === 304 || !upstream.body) return null
  return sendStream(event, upstream.body)
})
