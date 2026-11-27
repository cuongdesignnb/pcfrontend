// Backend base URL the storefront proxies feeds and fixed file links to.
export function backendOrigin(): string | null {
  const configured = process.env.NUXT_API_PROXY_TARGET || 'http://nginx'
  try {
    const url = new URL(configured)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}
