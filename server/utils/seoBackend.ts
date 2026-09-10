import { createError, setResponseHeader, type H3Event } from 'h3'
import { getErrorStatusCode } from '~/utils/errors'

function backendOrigin(): string | null {
  const configured = process.env.NUXT_API_PROXY_TARGET || ''
  if (!configured) return null

  try {
    const url = new URL(configured)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export async function proxySeoXml(event: H3Event, path: string): Promise<string> {
  const origin = backendOrigin()
  if (!origin) {
    throw createError({ statusCode: 503, statusMessage: 'SEO upstream is not configured' })
  }

  try {
    const response = await $fetch.raw<string>(`${origin}${path}`, {
      headers: { accept: 'application/xml' },
      retry: 1,
    })
    if (response.status >= 400) {
      throw createError({ statusCode: response.status, statusMessage: 'SEO upstream failed' })
    }
    setResponseHeader(event, 'content-type', 'application/xml; charset=UTF-8')
    setResponseHeader(event, 'cache-control', 'public, max-age=300')
    return response._data
  } catch (error: unknown) {
    if (getErrorStatusCode(error, 0) > 0) throw error
    throw createError({ statusCode: 503, statusMessage: 'SEO upstream is unavailable' })
  }
}

export async function proxySeoText(event: H3Event, path: string): Promise<string> {
  const origin = backendOrigin()
  if (!origin) {
    throw createError({ statusCode: 503, statusMessage: 'SEO upstream is not configured' })
  }

  try {
    const response = await $fetch.raw<string>(origin + path, {
      headers: { accept: 'text/plain' },
      retry: 1,
    })
    if (response.status >= 400) {
      throw createError({ statusCode: response.status, statusMessage: 'SEO upstream failed' })
    }
    setResponseHeader(event, 'content-type', 'text/plain; charset=UTF-8')
    setResponseHeader(event, 'cache-control', 'public, max-age=3600')
    return response._data
  } catch (error: unknown) {
    if (getErrorStatusCode(error, 0) > 0) throw error
    throw createError({ statusCode: 503, statusMessage: 'SEO upstream is unavailable' })
  }
}
