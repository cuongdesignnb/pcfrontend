import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createServer } from 'node:http'
import { URL } from 'node:url'
import {
  emptyCart,
  footerMenu,
  headerMenu,
  homepageFor,
  productDetails,
  productCardB,
  productRelations,
  settingsFor,
  publicPages,
  categoryListing,
} from '../tests/seo/fixtures/api-fixtures.mjs'

const port = Number(process.env.SEO_FIXTURE_PORT || 4174)
const logFile = process.env.SEO_FIXTURE_LOG_FILE || ''
let scenario = 'identity-valid'

if (logFile) {
  mkdirSync(dirname(logFile), { recursive: true })
}

function log(entry) {
  if (!logFile) return
  appendFileSync(logFile, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n')
}

function corsHeaders(request) {
  const origin = request.headers.origin
  return {
    'access-control-allow-origin': origin && /^http:\/\/127\.0\.0\.1:(4173|4175)$/.test(origin) ? origin : 'http://127.0.0.1:4173',
    'access-control-allow-headers': 'content-type, authorization, x-cart-session',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    vary: 'Origin',
  }
}

function send(request, response, status, body, contentType = 'application/json; charset=utf-8') {
  const headers = { 'content-type': contentType, ...corsHeaders(request) }
  response.writeHead(status, headers)
  response.end(typeof body === 'string' ? body : JSON.stringify(body))
  log({ method: request.method, path: new URL(request.url, 'http://127.0.0.1').pathname, status, scenario })
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', chunk => { body += chunk })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1')
  if (request.method === 'OPTIONS') return send(request, response, 204, '')

  if (url.pathname === '/health') return send(request, response, 200, { ok: true, scenario })
  if (url.pathname === '/__seo/fixture/scenario') {
    if (request.method === 'POST') {
      try {
        const payload = JSON.parse(await readBody(request) || '{}')
        if (typeof payload.scenario !== 'string' || !/^[a-z-]+$/.test(payload.scenario)) return send(request, response, 400, { error: 'invalid scenario' })
        scenario = payload.scenario
      } catch {
        return send(request, response, 400, { error: 'invalid json' })
      }
    }
    return send(request, response, 200, { scenario })
  }

  if (url.pathname === '/api/v1/settings') return send(request, response, 200, settingsFor(scenario))
  if (url.pathname === '/api/v1/homepage') return send(request, response, 200, homepageFor(scenario))
  if (url.pathname === '/api/v1/menus/header') return send(request, response, 200, headerMenu)
  if (url.pathname === '/api/v1/menus/footer') return send(request, response, 200, footerMenu)
  if (url.pathname === '/api/v1/cart') return send(request, response, 200, emptyCart)
  if (url.pathname === '/api/v1/wishlist') return send(request, response, 200, { ids: [] })

  const pageMatch = url.pathname.match(/^\/api\/v1\/pages\/([^/]+)$/)
  if (pageMatch) {
    const slug = decodeURIComponent(pageMatch[1])
    if (slug === 'page-request-error') return send(request, response, 503, { message: 'Fixture unavailable' })
    if (slug === 'page-invalid-data') return send(request, response, 200, { page: { title: 'Invalid payload' } })
    const page = publicPages[slug === 'ancienne-politique' ? 'chinh-sach-fixture' : slug]
    return page ? send(request, response, 200, { page }) : send(request, response, 404, { message: 'Not found' })
  }

  const categoryMatch = url.pathname.match(/^\/api\/v1\/categories\/([^/]+)$/)
  if (categoryMatch) {
    return categoryMatch[1] === 'linh-kien'
      ? send(request, response, 200, categoryListing)
      : send(request, response, 404, { message: 'Not found' })
  }

  const productMatch = url.pathname.match(/^\/api\/v1\/products\/([^/]+)$/)
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[1])
    const product = slug === 'fixture-b' && scenario !== 'media-unsafe'
      ? { ...productDetails[slug], images: [productCardB.images[0]] }
      : productDetails[slug]
    return product ? send(request, response, 200, { product }) : send(request, response, 404, { message: 'Not found' })
  }

  const relationsMatch = url.pathname.match(/^\/api\/v1\/products\/([^/]+)\/relations$/)
  if (relationsMatch) {
    return send(request, response, 200, { products: productRelations(decodeURIComponent(relationsMatch[1]), url.searchParams.get('type') || '') })
  }

  if (url.pathname.endsWith('/reviews')) return send(request, response, 200, { reviews: [], meta: { current_page: 1, last_page: 1, total: 0 } })
  if (url.pathname.endsWith('/questions')) return send(request, response, 200, { questions: [], meta: { current_page: 1, last_page: 1, total: 0 } })
  if (url.pathname.endsWith('/compatibility-summary')) return send(request, response, 200, { component_type: null, facts: [], warnings: [] })
  if (url.pathname === '/api/v1/products/cards') return send(request, response, 200, { products: [] })

  return send(request, response, 200, {})
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write('SEO_FIXTURE_READY http://127.0.0.1:' + port + '/health\n')
})

function shutdown() {
  server.closeAllConnections?.()
  server.closeIdleConnections?.()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 1_000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
