import { createError, getRouterParam, sendStream, setResponseHeader, setResponseStatus } from 'h3'

// Fixed file links (/files/{slug}, Admin → Thư viện media) are served by the
// backend. This lets the shop share them on laptopplus.vn. Only the body and
// file headers are passed on, never the backend's cookies.
const SLUG = /^[A-Za-z0-9_-]{1,120}$/
const PASSED_HEADERS = ['content-type', 'content-length', 'content-disposition', 'cache-control', 'last-modified', 'etag', 'x-content-type-options', 'content-security-policy']

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!SLUG.test(slug)) throw createError({ statusCode: 404, statusMessage: 'File not found' })
  const origin = backendOrigin()
  if (!origin) throw createError({ statusCode: 503, statusMessage: 'File upstream is not configured' })

  let upstream: Response
  try {
    upstream = await fetch(`${origin}/files/${encodeURIComponent(slug)}`, { redirect: 'manual' })
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'File upstream is unavailable' })
  }
  if (upstream.status !== 200) {
    throw createError({ statusCode: upstream.status === 404 ? 404 : 503, statusMessage: 'File not available' })
  }

  setResponseStatus(event, 200)
  for (const name of PASSED_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) setResponseHeader(event, name, value)
  }
  setResponseHeader(event, 'x-robots-tag', 'noindex')
  if (!upstream.body) return null
  return sendStream(event, upstream.body)
})
