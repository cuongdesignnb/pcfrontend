<script setup lang="ts">
import type { NewsArticle, NewsCategory, NewsBuilderBanner } from '~/types/news'
import { canonicalAbsoluteUrl, serializeJsonLd, useSeoDocument } from '~/composables/useSeoDocument'
import { getErrorStatusCode } from '~/utils/errors'
import { newsArticleUrl, newsCategoryUrl } from '~/utils/news'

interface NewsCategoryResponse {
  category?: NewsCategory | null
  trending?: NewsArticle[]
  categories?: NewsCategory[]
  pc_builder?: NewsBuilderBanner | null
}

interface NewsListingResponse {
  posts: NewsArticle[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

const route = useRoute()
const config = useRuntimeConfig()
const { siteName } = useSettings()
const rawSlug = route.params.slug
const requestedSlug = Array.isArray(rawSlug) ? String(rawSlug[0] || '') : String(rawSlug || '')

if (!requestedSlug) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy chuyên mục.' })
}

const categoryFetch = await useFetch<NewsCategoryResponse>(
  () => `${config.public.apiBase}/blog/categories/${encodeURIComponent(requestedSlug)}`,
  { key: () => `news-category:${requestedSlug}` },
)

if (categoryFetch.error.value) {
  const errorStatus = getErrorStatusCode(categoryFetch.error.value, 503)
  throw createError({
    statusCode: errorStatus === 404 ? 404 : 503,
    statusMessage: errorStatus === 404 ? 'Chuyên mục không tồn tại.' : 'Không thể tải chuyên mục lúc này.',
  })
}

const category = computed<NewsCategory | null>(() => categoryFetch.data.value?.category || null)
if (!category.value && categoryFetch.status.value !== 'pending') {
  throw createError({ statusCode: 404, statusMessage: 'Chuyên mục không tồn tại.' })
}

const pageNumber = computed(() => {
  const value = Number(route.query.page || 1)
  return Number.isInteger(value) && value > 0 ? value : 1
})
const hasUnsupportedQuery = computed(() => Object.keys(route.query).some(key => key !== 'page'))

const { data: listing, status: listingStatus, error: listingError } = await useFetch<NewsListingResponse>(
  () => `${config.public.apiBase}/blog`,
  {
    key: () => `news-category-list:${category.value?.slug || requestedSlug}:${pageNumber.value}`,
    query: computed(() => ({ category: category.value?.slug || requestedSlug, page: pageNumber.value })),
    default: () => ({ posts: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  },
)

if (listingError.value) {
  const errorStatus = getErrorStatusCode(listingError.value, 503)
  throw createError({ statusCode: errorStatus === 404 ? 404 : 503, statusMessage: 'Không thể tải danh sách bài viết.' })
}

const canonicalPath = computed(() => {
  if (!category.value) return null
  const base = newsCategoryUrl(category.value)
  return pageNumber.value > 1 && !hasUnsupportedQuery.value ? `${base}?page=${pageNumber.value}` : base
})

if (category.value && route.path !== newsCategoryUrl(category.value)) {
  await navigateTo({ path: newsCategoryUrl(category.value), query: route.query }, { redirectCode: 301 })
}

const { origin, canonicalUrl } = useSeoDocument(() => ({
  title: `${category.value?.name || 'Chuyên mục tin tức'} - ${siteName.value}`,
  description: category.value?.description || `Các bài viết thuộc chuyên mục ${category.value?.name || 'tin tức'} tại ${siteName.value}.`,
  path: canonicalPath.value,
  robots: hasUnsupportedQuery.value ? 'noindex,follow' : 'index,follow',
}))

const articles = computed(() => listing.value?.posts || [])
const categories = computed(() => categoryFetch.data.value?.categories || [])
const trending = computed(() => categoryFetch.data.value?.trending || [])
const total = computed(() => listing.value?.meta?.total || 0)

const categoryJsonLd = computed(() => {
  if (!category.value || !canonicalUrl.value || hasUnsupportedQuery.value) return ''
  const items = articles.value
    .map((article, index) => {
      const path = newsArticleUrl(article)
      const url = canonicalAbsoluteUrl(origin.value, path)
      return url ? { '@type': 'ListItem', position: index + 1, url, name: article.title } : null
    })
    .filter(Boolean)

  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.value.name,
    url: canonicalUrl.value,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items,
    },
  })
})

useHead(() => ({
  script: categoryJsonLd.value
    ? [{ key: 'news-category-jsonld', type: 'application/ld+json', innerHTML: categoryJsonLd.value }]
    : [],
}))
</script>

<template>
  <div class="news-page">
    <div class="news-container">
      <NewsBreadcrumb />
      <header class="news-page-header">
        <div>
          <span class="news-page-kicker">Tin tức</span>
          <h1>{{ category?.name || 'Chuyên mục tin tức' }}</h1>
          <p>{{ category?.description || `Tổng hợp bài viết mới nhất từ ${siteName}.` }}</p>
        </div>
        <span v-if="total" class="news-page-count">{{ total }} bài viết</span>
      </header>
      <NewsCategoryTabs :categories="categories" />

      <div class="news-content-grid">
        <main class="news-main-column">
          <div v-if="listingStatus === 'pending'" class="news-latest-grid">
            <NewsLandingSkeleton />
          </div>
          <template v-else>
            <NewsSectionHeader :title="`Bài viết: ${category?.name || ''}`" icon="latest" to="/tin-tuc" />
            <div class="news-latest-grid">
              <NewsArticleCard v-for="article in articles" :key="article.id" :article="article" variant="latest" />
            </div>
            <p v-if="!articles.length" class="news-inline-empty">Chưa có bài viết trong chuyên mục này.</p>
            <nav v-if="(listing?.meta?.last_page || 1) > 1" class="news-category-pagination" aria-label="Phân trang chuyên mục">
              <NuxtLink v-if="pageNumber > 1" :to="{ path: newsCategoryUrl(category!), query: { page: pageNumber - 1 } }">Trang trước</NuxtLink>
              <span>Trang {{ listing?.meta?.current_page || pageNumber }} / {{ listing?.meta?.last_page || 1 }}</span>
              <NuxtLink v-if="pageNumber < (listing?.meta?.last_page || 1)" :to="{ path: newsCategoryUrl(category!), query: { page: pageNumber + 1 } }">Trang sau</NuxtLink>
            </nav>
          </template>
        </main>
        <NewsSidebar
          :trending="trending"
          :categories="categories"
          :pc-builder="categoryFetch.data.value?.pc_builder || null"
        />
      </div>
    </div>
  </div>
</template>
