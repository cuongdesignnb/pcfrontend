import { expect, test, type APIRequestContext } from '@playwright/test'
import { parse } from 'parse5'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const runDir = resolve(process.env.SEO_RUN_DIR || 'tests/frontend-seo-regression')
const fixtureBase = 'http://127.0.0.1:4174'
const testOrigin = 'https://storefront.example.test'

type NodeLike = {
  nodeName?: string
  tagName?: string
  value?: string
  childNodes?: NodeLike[]
  attrs?: Array<{ name: string; value: string }>
}

type ParsedDocument = {
  title: string
  h1: string[]
  canonical: string | null
  meta: Record<string, string>
  jsonLd: unknown[]
  imageSources: string[]
}

function descendants(node: NodeLike): NodeLike[] {
  return (node.childNodes || []).flatMap(child => [child, ...descendants(child)])
}

function elements(document: NodeLike, name: string): NodeLike[] {
  return descendants(document).filter(node => (node.tagName || node.nodeName) === name)
}

function attribute(node: NodeLike, name: string): string | null {
  return node.attrs?.find(item => item.name === name)?.value ?? null
}

function text(node: NodeLike): string {
  if (node.nodeName === '#text') return node.value || ''
  return (node.childNodes || []).map(text).join('')
}

function parsedDocument(html: string): ParsedDocument {
  const document = parse(html) as unknown as NodeLike
  const titleNode = elements(document, 'title')[0]
  const meta: Record<string, string> = {}
  for (const node of elements(document, 'meta')) {
    const key = attribute(node, 'name') || attribute(node, 'property')
    const value = attribute(node, 'content')
    if (key && value !== null) meta[key] = value
  }
  const canonical = elements(document, 'link')
    .find(node => (attribute(node, 'rel') || '').split(/\s+/).includes('canonical'))
  const jsonLd = elements(document, 'script')
    .filter(node => (attribute(node, 'type') || '').toLowerCase() === 'application/ld+json')
    .map(node => JSON.parse(text(node)))

  return {
    title: text(titleNode || '').trim(),
    h1: elements(document, 'h1').map(text).map(value => value.trim()).filter(Boolean),
    canonical: canonical ? attribute(canonical, 'href') : null,
    meta,
    jsonLd,
    imageSources: elements(document, 'img')
      .map(node => attribute(node, 'src'))
      .filter((value): value is string => Boolean(value)),
  }
}

function graphNodes(jsonLd: unknown[]): Record<string, unknown>[] {
  return jsonLd.flatMap(value => {
    if (!value || typeof value !== 'object') return []
    const record = value as Record<string, unknown>
    return Array.isArray(record['@graph'])
      ? record['@graph'].filter(item => Boolean(item && typeof item === 'object')) as Record<string, unknown>[]
      : [record]
  })
}

function schemaOf(jsonLd: unknown[], type: string): Record<string, unknown> | undefined {
  return graphNodes(jsonLd).find(item => item['@type'] === type)
}

async function setScenario(request: APIRequestContext, scenario: string) {
  const response = await request.post(fixtureBase + '/__seo/fixture/scenario', { data: { scenario } })
  expect(response.ok()).toBeTruthy()
}

function saveSSR(name: string, html: string, assertions: ParsedDocument) {
  mkdirSync(resolve(runDir, 'raw-ssr'), { recursive: true })
  mkdirSync(resolve(runDir, 'assertions'), { recursive: true })
  writeFileSync(resolve(runDir, 'raw-ssr', name + '.html'), html)
  writeFileSync(resolve(runDir, 'assertions', name + '.json'), JSON.stringify(assertions, null, 2) + '\n')
}

async function getSSR(request: any, port: number, path: string) {
  const response = await request.get('http://127.0.0.1:' + port + path)
  expect(response.status(), path).toBe(200)
  const html = await response.text()
  return { html, document: parsedDocument(html) }
}

function assertNoTrailingTitleSeparator(title: string) {
  expect(title).not.toMatch(/[-|:•]\s*$/)
  expect(title.length).toBeGreaterThan(0)
}

function assertIdentity(document: ParsedDocument, expectedName: string) {
  assertNoTrailingTitleSeparator(document.title)
  expect(document.h1.some(value => value.length > 0)).toBeTruthy()
  expect(document.canonical).toBe(testOrigin + '/')
  expect(document.meta['og:title']).toBe(document.title)
  expect(document.meta['og:url']).toBe(testOrigin + '/')
  expect(schemaOf(document.jsonLd, 'Organization')?.name).toBe(expectedName)
  expect(schemaOf(document.jsonLd, 'WebSite')?.name).toBe(expectedName)
}

function assertNoIdentity(document: ParsedDocument) {
  expect(document.title).toBe('')
  expect(schemaOf(document.jsonLd, 'Organization')).toBeUndefined()
  expect(schemaOf(document.jsonLd, 'WebSite')).toBeUndefined()
  for (const node of graphNodes(document.jsonLd)) {
    expect(node.name === '').toBeFalsy()
  }
}

function attachDiagnostics(page: any) {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error: Error) => pageErrors.push(error.message))
  page.on('console', (message: any) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  return { pageErrors, consoleErrors }
}

const pageState = new WeakMap<object, { pageErrors: string[]; outbound: string[] }>()

test.describe('P1 frontend SEO regression', () => {
  if (process.env.SEO_SCOPE !== 'ssr') {
    test.beforeEach(async ({ page }) => {
      const state = { pageErrors: [] as string[], outbound: [] as string[] }
      pageState.set(page, state)
      page.on('pageerror', (error: Error) => state.pageErrors.push(error.message))
      await page.route('**/*', async route => {
        const target = new URL(route.request().url())
        const local = target.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(target.hostname)
        if (local || target.protocol === 'data:' || target.protocol === 'blob:') {
          await route.continue()
          return
        }
        state.outbound.push(target.toString())
        await route.abort('blockedbyclient')
      })
    })

    test.afterEach(async ({ page }, testInfo) => {
      const state = pageState.get(page)
      if (!state) return
      mkdirSync(resolve(runDir, 'assertions'), { recursive: true })
      const safeName = testInfo.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
      writeFileSync(resolve(runDir, 'assertions', 'browser-' + safeName + '.json'), JSON.stringify({
        title: testInfo.title,
        status: testInfo.status,
        page_errors: state.pageErrors,
        blocked_outbound: state.outbound,
      }, null, 2) + '\n')
      expect(state.pageErrors, 'unexpected browser page errors').toEqual([])
      expect(state.outbound, 'unexpected outbound browser requests').toEqual([])
    })
  }

  test('[SSR] ID-01/ID-07 valid identity and hero metadata', async ({ request }) => {
    await setScenario(request, 'identity-valid')
    const result = await getSSR(request, 4173, '/?case=id01')
    saveSSR('id01-home-valid', result.html, result.document)
    assertIdentity(result.document, 'Fixture PC Center')
    expect(result.document.h1).toContain('Fixture hero title')
    expect(result.document.meta['og:image']).toBe(testOrigin + '/seo-fixtures/logo.svg')
  })

  test('[SSR] ID-02 fallback identity and ID-04 invalid payload', async ({ request }) => {
    await setScenario(request, 'identity-fallback')
    const fallback = await getSSR(request, 4173, '/?case=id02')
    saveSSR('id02-home-fallback', fallback.html, fallback.document)
    assertIdentity(fallback.document, 'Runtime Fixture Store')

    await setScenario(request, 'identity-invalid')
    const invalid = await getSSR(request, 4173, '/?case=id04')
    saveSSR('id04-home-invalid-payload', invalid.html, invalid.document)
    assertIdentity(invalid.document, 'Runtime Fixture Store')
  })

  test('[SSR] ID-03 missing identity does not invent brand', async ({ request }) => {
    await setScenario(request, 'identity-empty')
    const result = await getSSR(request, 4175, '/?case=id03')
    saveSSR('id03-home-empty-identity', result.html, result.document)
    assertNoIdentity(result.document)
    expect(result.document.h1).toContain('Fixture hero title')
  })

  test('[SSR] IMG-01/IMG-02/IMG-03 product schema and image policy', async ({ request }) => {
    await setScenario(request, 'identity-valid')
    const first = await getSSR(request, 4173, '/linh-kien/fixture-a?case=img01')
    saveSSR('img01-product-a', first.html, first.document)
    const productA = schemaOf(first.document.jsonLd, 'Product')
    expect(productA?.image).toEqual([testOrigin + '/seo-fixtures/product-a.svg'])
    expect(first.document.meta['og:image']).toBe(testOrigin + '/seo-fixtures/product-a.svg')
    expect(first.html).toContain('/seo-fixtures/product-a.svg')
    expect(first.html).toContain('Fixture Product A image')

    await setScenario(request, 'media-unsafe')
    const second = await getSSR(request, 4173, '/linh-kien/fixture-b?case=img02')
    saveSSR('img02-product-b-fallback', second.html, second.document)
    const productB = schemaOf(second.document.jsonLd, 'Product')
    expect(productB?.image).toEqual([testOrigin + '/seo-fixtures/product-b.svg'])
    expect(second.document.imageSources).not.toContain('javascript:alert(1)')
    expect(second.html).toContain('/seo-fixtures/product-b.svg')

    await setScenario(request, 'identity-valid')
    const empty = await getSSR(request, 4173, '/linh-kien/fixture-empty?case=img03')
    saveSSR('img03-product-empty', empty.html, empty.document)
    expect(schemaOf(empty.document.jsonLd, 'Product')?.image).toBeUndefined()
    expect(empty.html).toContain('Chưa có ảnh sản phẩm')
  })

  test('[SSR] IMG-04/IMG-06 unmirrored and empty media stay empty', async ({ request }) => {
    await setScenario(request, 'identity-valid')
    const unmirrored = await getSSR(request, 4173, '/linh-kien/fixture-kiot?case=img04')
    saveSSR('img04-product-unmirrored', unmirrored.html, unmirrored.document)
    expect(schemaOf(unmirrored.document.jsonLd, 'Product')?.image).toBeUndefined()
    expect(unmirrored.document.imageSources.filter(source => /product-|missing\.svg|kiot/i.test(source))).toEqual([])
    expect(unmirrored.html).toContain('Chưa có ảnh sản phẩm')

    const empty = await getSSR(request, 4173, '/linh-kien/fixture-empty?case=img06')
    saveSSR('img06-product-empty', empty.html, empty.document)
    expect(schemaOf(empty.document.jsonLd, 'Product')?.image).toBeUndefined()
    expect(empty.document.imageSources.filter(source => /product-|missing\.svg|kiot/i.test(source))).toEqual([])
    expect(empty.html).toContain('Chưa có ảnh sản phẩm')
  })

  test('[SSR] ID-10 client-ready product title and canonical differ by product', async ({ request }) => {
    await setScenario(request, 'identity-valid')
    const a = await getSSR(request, 4173, '/linh-kien/fixture-a?case=id10a')
    const b = await getSSR(request, 4173, '/linh-kien/fixture-b?case=id10b')
    saveSSR('id10-product-a', a.html, a.document)
    saveSSR('id10-product-b', b.html, b.document)
    expect(a.document.title).toContain('Fixture Product A')
    expect(b.document.title).toContain('Fixture Product B')
    expect(a.document.canonical).toBe(testOrigin + '/linh-kien/fixture-a')
    expect(b.document.canonical).toBe(testOrigin + '/linh-kien/fixture-b')
    expect(a.document.title).not.toBe(b.document.title)
  })

  test('[BROWSER] ID-07/ID-08 hydration and real hero interaction', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    await page.goto('/?case=id07', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toHaveText('Fixture hero title')
    await expect(page).toHaveTitle('Fixture PC Center')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', testOrigin + '/')
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
    await page.getByRole('button', { name: 'Banner tiếp theo' }).click()
    await expect(page.locator('h1').first()).toHaveText('Second Fixture Hero')
    await page.getByRole('button', { name: 'Banner trước' }).click()
    await expect(page.locator('h1').first()).toHaveText('Fixture hero title')
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] ID-05/ID-06 refresh keeps and then updates last-known-good settings', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    await page.goto('/?case=id05', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle('Fixture PC Center')

    await setScenario(request, 'identity-invalid')
    await page.evaluate(async () => {
      const refresh = (window as Window & { __SEO_SETTINGS_REFRESH__?: () => Promise<void> }).__SEO_SETTINGS_REFRESH__
      if (!refresh) throw new Error('SEO settings refresh hook is unavailable')
      await refresh()
    })
    await expect(page).toHaveTitle('Fixture PC Center')
    const afterFailure = await page.locator('script[type="application/ld+json"]').evaluate(element => JSON.parse(element.textContent || '{}'))
    expect(afterFailure['@graph'].find((node: any) => node['@type'] === 'Organization').name).toBe('Fixture PC Center')

    await setScenario(request, 'identity-updated')
    await page.evaluate(async () => {
      const refresh = (window as Window & { __SEO_SETTINGS_REFRESH__?: () => Promise<void> }).__SEO_SETTINGS_REFRESH__
      if (!refresh) throw new Error('SEO settings refresh hook is unavailable')
      await refresh()
    })
    await expect(page).toHaveTitle('Updated Fixture Store')
    const afterSuccess = await page.locator('script[type="application/ld+json"]').evaluate(element => JSON.parse(element.textContent || '{}'))
    expect(afterSuccess['@graph'].find((node: any) => node['@type'] === 'Organization').name).toBe('Updated Fixture Store')
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] ID-09 SSR and hydration keep the same head contract', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    const ssr = await getSSR(request, 4173, '/?case=id09')
    await page.goto('/?case=id09', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toHaveText('Fixture hero title')
    await expect(page).toHaveTitle(ssr.document.title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', ssr.document.canonical || '')
    const browserJsonLd = await page.locator('script[type="application/ld+json"]').evaluate(element => JSON.parse(element.textContent || '{}'))
    const browserGraph = browserJsonLd['@graph'] as Array<Record<string, unknown>>
    const ssrOrganization = schemaOf(ssr.document.jsonLd, 'Organization')
    const browserOrganization = browserGraph.find(node => node['@type'] === 'Organization')
    expect(browserOrganization?.name).toBe(ssrOrganization?.name)
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] ID-08 empty hero keeps a meaningful H1', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-no-banner')
    await page.goto('/?case=id08', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.home-hero-empty h1')).toHaveText('Khám phá sản phẩm công nghệ')
    await expect(page.locator('.home-hero-empty h1')).toBeVisible()
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] IMG-05/IMG-07 image decode and broken-image recovery', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    await page.goto('/linh-kien/fixture-b?case=img05', { waitUntil: 'domcontentloaded' })
    const mainImage = page.locator('.pdp-gallery-main-trigger img')
    await expect(mainImage).toHaveAttribute('src', '/seo-fixtures/product-b.svg')
    await expect.poll(() => mainImage.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy()
    await page.goto('/linh-kien/fixture-broken?case=img07', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.pdp-gallery-empty')).toBeVisible()
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] IMG-08/ID-10 true client navigation A → B → homepage', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    const documentNavigations: string[] = []
    page.on('request', (request: any) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentNavigations.push(request.url())
    })
    await page.goto('/?case=id10-nav', { waitUntil: 'domcontentloaded' })
    const initialNavigationCount = documentNavigations.length
    await page.locator('a.product-card-link').filter({ hasText: 'Fixture Product A' }).first().click()
    await expect(page).toHaveURL(/\/linh-kien\/fixture-a$/)
    await expect(page.locator('h1').first()).toHaveText('Fixture Product A')
    await expect(page.locator('.pdp-relation-panel a').filter({ hasText: 'Fixture Product B' }).first()).toBeVisible()
    await page.locator('.pdp-relation-panel a').filter({ hasText: 'Fixture Product B' }).first().click()
    await expect(page).toHaveURL(/\/linh-kien\/fixture-b$/)
    await expect(page.locator('h1').first()).toHaveText('Fixture Product B')
    await page.locator('a.site-brand').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('h1').first()).toHaveText('Fixture hero title')
    expect(documentNavigations.length).toBe(initialNavigationCount)
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1)
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] IMG-09 broken PDP state is not inherited by a valid PDP', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    await page.goto('/linh-kien/fixture-broken?case=img09', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.pdp-gallery-empty')).toBeVisible()
    await page.locator('a.site-brand').click()
    await expect(page).toHaveURL(/\/$/)
    await page.locator('a.product-card-link').filter({ hasText: 'Fixture Product B' }).first().click()
    await expect(page).toHaveURL(/\/linh-kien\/fixture-b$/)
    const image = page.locator('.pdp-gallery-main-trigger img')
    await expect(image).toHaveAttribute('src', '/seo-fixtures/product-b.svg')
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy()
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] IMG-09 back/forward/refresh keeps gallery and schema tied to the product', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-valid')
    await page.goto('/linh-kien/fixture-a?case=img09-history', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.pdp-gallery-main-trigger img')).toHaveAttribute('src', '/seo-fixtures/product-a.svg')
    await page.locator('.pdp-relation-panel a').filter({ hasText: 'Fixture Product B' }).first().click()
    await expect(page).toHaveURL(/\/linh-kien\/fixture-b$/)
    await expect(page.locator('.pdp-gallery-main-trigger img')).toHaveAttribute('src', '/seo-fixtures/product-b.svg')

    await page.goBack()
    await expect(page).toHaveURL(/\/linh-kien\/fixture-a(?:\?.*)?$/)
    await expect(page.locator('.pdp-gallery-main-trigger img')).toHaveAttribute('src', '/seo-fixtures/product-a.svg')
    await page.goForward()
    await expect(page).toHaveURL(/\/linh-kien\/fixture-b(?:\?.*)?$/)
    await expect(page.locator('.pdp-gallery-main-trigger img')).toHaveAttribute('src', '/seo-fixtures/product-b.svg')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/Fixture Product B/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', testOrigin + '/linh-kien/fixture-b')
    const productJsonLd = await page.locator('script[data-hid="product-jsonld"]').evaluate(element => JSON.parse(element.textContent || '{}'))
    expect(schemaOf([productJsonLd], 'Product')?.name).toBe('Fixture Product B')
    expect(diagnostics.pageErrors).toEqual([])
  })

  test('[BROWSER] ID-11 isolated runtime identities do not leak between servers', async ({ page, request }) => {
    const diagnostics = attachDiagnostics(page)
    await setScenario(request, 'identity-fallback')
    await page.goto('http://127.0.0.1:4173/?case=id11-runtime', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle('Runtime Fixture Store')
    const firstJsonLd = await page.locator('script[type="application/ld+json"]').evaluate(element => JSON.parse(element.textContent || '{}'))
    expect(schemaOf([firstJsonLd], 'Organization')?.name).toBe('Runtime Fixture Store')

    await page.goto('http://127.0.0.1:4175/?case=id11-empty', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle('')
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
    await expect(page.locator('h1').first()).toHaveText('Fixture hero title')
    expect(diagnostics.pageErrors).toEqual([])
  })
})
