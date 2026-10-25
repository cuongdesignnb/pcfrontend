import { expect, test } from '@playwright/test'
import { parse } from 'parse5'
import { parsePublicPage } from '../../app/utils/publicPages'

const origin = 'https://storefront.example.test'
const fixtureApi = 'http://127.0.0.1:4174'
type HtmlNode = { tagName?: string; nodeName?: string; value?: string; attrs?: { name: string; value: string }[]; childNodes?: HtmlNode[] }
const all = (node: HtmlNode): HtmlNode[] => [node, ...(node.childNodes || []).flatMap(all)]
const text = (node: HtmlNode): string => node.value || (node.childNodes || []).map(text).join('')
const attr = (node: HtmlNode, name: string) => node.attrs?.find(item => item.name === name)?.value

function document(html: string) {
  const nodes = all(parse(html) as HtmlNode)
  return {
    title: text(nodes.find(node => node.tagName === 'title') || {}),
    h1: nodes.filter(node => node.tagName === 'h1').map(text),
    canonical: attr(nodes.find(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical') || {}, 'href'),
    ogUrl: attr(nodes.find(node => node.tagName === 'meta' && attr(node, 'property') === 'og:url') || {}, 'content'),
    schemas: nodes.filter(node => node.tagName === 'script' && attr(node, 'type') === 'application/ld+json').map(node => JSON.parse(text(node))),
    bodyText: text(nodes.find(node => node.tagName === 'article') || {}),
  }
}

test.beforeEach(async ({ request }) => {
  expect((await request.post(fixtureApi + '/__seo/fixture/scenario', { data: { scenario: 'identity-valid' } })).ok()).toBeTruthy()
})

test('[SSR] published CMS page has actual body, one H1, canonical and WebPage metadata', async ({ request }) => {
  const response = await request.get('/chinh-sach-fixture')
  expect(response.status()).toBe(200)
  const parsed = document(await response.text())
  expect(parsed.title).toBe('Chính sách SEO fixture')
  expect(parsed.h1).toEqual(['Chính sách fixture'])
  expect(parsed.bodyText).toContain('Nội dung chính sách từ CMS.')
  expect(parsed.canonical).toBe(origin + '/chinh-sach-fixture')
  expect(parsed.ogUrl).toBe(parsed.canonical)
  expect(parsed.schemas.find(schema => schema['@type'] === 'WebPage')).toMatchObject({ name: 'Chính sách fixture', url: parsed.canonical, dateModified: '2026-10-09T05:19:04Z' })
})

test('[SSR] blank metadata uses this page title/body and not a previous title', async ({ request }) => {
  const response = await request.get('/dieu-khoan-fixture')
  expect(response.status()).toBe(200)
  const parsed = document(await response.text())
  expect(parsed.title).toBe('Điều khoản fixture - Fixture PC Center')
  expect(parsed.h1).toEqual(['Điều khoản fixture'])
  expect(parsed.canonical).toBe(origin + '/dieu-khoan-fixture')
  expect(parsed.schemas.find(schema => schema['@type'] === 'WebPage')?.description).toContain('Điều khoản khác')
})

test('[SSR] historical page alias makes a single 301 to the current URL', async ({ request }) => {
  const response = await request.get('/ancienne-politique?ref=fixture', { maxRedirects: 0 })
  expect(response.status()).toBe(301)
  expect(response.headers().location).toBe('/chinh-sach-fixture?ref=fixture')
  expect((await request.get(response.headers().location)).status()).toBe(200)
})

test('[SSR] hidden and missing CMS pages return 404 and never reveal a published body', async ({ request }) => {
  for (const path of ['/trang-an-fixture', '/page-missing-fixture']) {
    const response = await request.get(path)
    expect(response.status()).toBe(404)
    expect(document(await response.text()).bodyText).not.toContain('Nội dung chính sách từ CMS.')
  }
})

test('[SSR] an API failure or malformed 200 is not masked as a category 404', async ({ request }) => {
  for (const path of ['/page-request-error', '/page-invalid-data']) {
    expect((await request.get(path)).status()).toBe(503)
  }
})

test('[SSR] a real category remains a product listing including sort queries', async ({ request }) => {
  const response = await request.get('/linh-kien?sort=price_asc')
  expect(response.status()).toBe(200)
  const html = await response.text()
  const parsed = document(html)
  expect(parsed.h1).toEqual(['Linh kiện fixture'])
  expect(parsed.title).toBe('Linh kiện SEO fixture - Fixture PC Center')
  expect(html).toContain('Fixture Product A')
  expect(parsed.schemas.some(schema => schema['@type'] === 'WebPage')).toBe(false)
})

test('[SSR] public-page parser rejects unsafe/mismatched paths and invalid shape', () => {
  const page = { id: 1, title: 'Fixture', slug: 'fixture-page', body: '', canonical_path: '/fixture-page' }
  expect(parsePublicPage({ page })).toMatchObject(page)
  for (const bad of [null, [], { page: [] }, { page: { ...page, id: 0 } }, { page: { ...page, title: '  ' } }, { page: { ...page, slug: '../admin' } }, { page: { ...page, canonical_path: 'https://unsafe.example' } }]) {
    expect(parsePublicPage(bad)).toBeNull()
  }
})

test('[BROWSER] CMS body survives hydration and fits a mobile viewport', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/chinh-sach-fixture')
  await expect(page.locator('.static-page h1')).toHaveText('Chính sách fixture')
  await expect(page.locator('.static-page-body table')).toBeVisible()
  await expect(page.locator('.static-page-body a')).toHaveAttribute('href', 'tel:0123456789')
  await expect(page).toHaveTitle('Chính sách SEO fixture')
  expect(await page.evaluate(() => document.querySelector('.static-page-article')!.getBoundingClientRect().right)).toBeLessThanOrEqual(375)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376)
  expect(errors).toEqual([])
})

test('[BROWSER] client navigation page → page → category → page clears stale content/head', async ({ page }) => {
  await page.goto('/chinh-sach-fixture')
  const markers = await page.evaluate(() => { (window as any).__publicPagesNavigationMarker = 'same-document'; return true })
  expect(markers).toBe(true)
  await page.locator('footer a[href="/dieu-khoan-fixture"]').click()
  await expect(page).toHaveTitle('Điều khoản fixture - Fixture PC Center')
  await expect(page.locator('.static-page-body')).not.toContainText('Nội dung chính sách từ CMS.')
  await page.locator('footer a[href="/linh-kien"]').click()
  await expect(page).toHaveTitle('Linh kiện SEO fixture - Fixture PC Center')
  await expect(page.locator('.static-page')).toHaveCount(0)
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some(script => JSON.parse(script.textContent || '{}')['@type'] === 'WebPage'))).toBe(false)
  await page.locator('footer a[href="/chinh-sach-fixture"]').click()
  await expect(page).toHaveTitle('Chính sách SEO fixture')
  await expect(page.locator('.static-page h1')).toHaveText('Chính sách fixture')
  expect(await page.evaluate(() => (window as any).__publicPagesNavigationMarker)).toBe('same-document')
})

test('[BROWSER] category query sorting still updates without changing to a static page', async ({ page }) => {
  await page.goto('/linh-kien?sort=price_asc')
  const sort = page.locator('select').filter({ has: page.locator('option[value="price_desc"]') }).first()
  await expect(sort).toHaveValue('price_asc')
  await sort.selectOption('price_desc')
  await expect(page).toHaveURL(/sort=price_desc/)
  await expect(page.locator('h1')).toHaveText('Linh kiện fixture')
  await expect(page.locator('.static-page')).toHaveCount(0)
})
