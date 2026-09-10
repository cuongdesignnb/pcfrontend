/// <reference types="node" />
// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function productionSiteUrl(): string {
  const configured = process.env.NUXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured

  // Nuxt does not load the repository's deployment-only .env.server file by
  // default. Read only this public value during a production build so the
  // canonical/OG metadata remains configured without embedding a domain in
  // application code or changing local development API defaults.
  const isProductionBuild = process.env.NODE_ENV === 'production' || process.argv.some(argument => argument === 'build' || argument.endsWith('/build'))
  if (!isProductionBuild) return ''

  const envFile = resolve(process.cwd(), '.env.server')
  if (!existsSync(envFile)) return ''

  const prefix = 'NUXT_PUBLIC_SITE_URL='
  const line = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find(candidate => candidate.trimStart().startsWith(prefix))
  if (!line) return ''

  const value = line.trimStart().slice(prefix.length).trim()
  return value.replace(/^("|')(.*)\1$/, '$2').trim()
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Modules
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
  ],

  // Keep component names stable across the product-detail subdirectory.
  components: {
    dirs: [{ path: '~/components', pathPrefix: false }],
  },

  // CSS
  css: ['~/assets/css/main.css', '~/assets/css/checkout.css', '~/assets/css/account.css', '~/assets/css/news-detail.css'],

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api/v1',
      appName: process.env.NUXT_PUBLIC_APP_NAME || '',
      siteUrl: productionSiteUrl(),
    }
  },

  // Nitro server config
  nitro: {
    routeRules: {
      '/api/**': {
        isr: false,
        proxy: (process.env.NUXT_API_PROXY_TARGET || 'http://nginx') + '/api/**',
        headers: { 'cache-control': 'private, no-store, max-age=0' },
      },
    },
  },

  // App config
  app: {
    head: {
      title: process.env.NUXT_PUBLIC_APP_NAME || '',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Route rules for rendering strategy
  routeRules: {
    '/': { ssr: true, isr: 300, swr: false },
    '/sitemap.xml': { ssr: true, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'public, max-age=300' } },
    '/sitemaps/**': { ssr: true, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'public, max-age=300' } },
    '/robots.txt': { ssr: true, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'public, max-age=3600' } },
    '/san-pham': { ssr: true, isr: 60, swr: false },
    '/san-pham/**': { ssr: true, isr: 60, swr: false },
    '/danh-muc': { ssr: true, isr: 300, swr: false },
    '/danh-muc/**': { ssr: true, isr: 300, swr: false },
    '/products': { ssr: true, isr: false, swr: false, prerender: false },
    '/products/**': { ssr: true, isr: false, swr: false, prerender: false },
    '/categories': { ssr: true, isr: false, swr: false, prerender: false },
    '/categories/**': { ssr: true, isr: false, swr: false, prerender: false },
    '/tim-kiem': { ssr: true, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/search': { ssr: true, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/tin-tuc': {
      ssr: true,
      isr: 60,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'public, max-age=60' },
    },
    '/tin-tuc/**': {
      ssr: true,
      isr: 60,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'public, max-age=60' },
    },
    '/configurator': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/configurator/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/auth/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/admin/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/payment/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/payments/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/cau-hinh': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/cau-hinh/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/cart': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/checkout/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/account/**': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/wishlist': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/gio-hang': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/gio-hang/**': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/thanh-toan': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/thanh-toan/**': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/don-hang/**': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/dang-nhap': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store, max-age=0' },
    },
    '/dang-ky': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store, max-age=0' },
    },
    '/quen-mat-khau': { ssr: false, isr: false, swr: false, prerender: false, headers: { 'cache-control': 'private, no-store, max-age=0' } },
    '/tai-khoan': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store, max-age=0' },
    },
    '/tai-khoan/**': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store, max-age=0' },
    },
    '/yeu-thich': {
      ssr: false,
      isr: false,
      swr: false,
      prerender: false,
      headers: { 'cache-control': 'private, no-store, max-age=0' },
    },
  },

  // Disable automatic prefetch on NuxtLinks (too many links → payload storm)
  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  // TypeScript
  typescript: {
    strict: true,
  }
})

