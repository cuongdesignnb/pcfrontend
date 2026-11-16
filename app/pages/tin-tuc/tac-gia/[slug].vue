<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import type { NewsDetailAuthor } from '~/types/news-detail'
import { canonicalAbsoluteUrl, normalizeRobots, publicAbsoluteUrl, serializeJsonLd, useSeoDocument } from '~/composables/useSeoDocument'
import { getErrorStatusCode } from '~/utils/errors'
import { newsArticleUrl } from '~/utils/news'

interface NewsAuthorProfile extends NewsDetailAuthor {
  posts_count: number
  seo: {
    title: string
    description: string | null
    canonical_path: string | null
    canonical_url: string | null
    robots: string
  }
}

interface NewsAuthorResponse {
  author: NewsAuthorProfile
  posts: NewsArticle[]
  meta: { current_page: number; last_page: number; total: number }
}

const route = useRoute()
const config = useRuntimeConfig()
const { siteName } = useSettings()
const rawSlug = route.params.slug
const slug = Array.isArray(rawSlug) ? String(rawSlug[0] || '') : String(rawSlug || '')
if (!slug) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy tác giả.' })

const pageNumber = computed(() => {
  const value = Number(route.query.page || 1)
  return Number.isInteger(value) && value > 0 ? value : 1
})
const hasUnsupportedQuery = computed(() => Object.keys(route.query).some(key => key !== 'page'))

const { data, error } = await useFetch<NewsAuthorResponse>(
  () => `${config.public.apiBase}/blog/authors/${encodeURIComponent(slug)}`,
  { key: () => `news-author:${slug}:${pageNumber.value}`, query: computed(() => ({ page: pageNumber.value })) },
)
if (error.value) {
  const statusCode = getErrorStatusCode(error.value, 503)
  throw createError({ statusCode: statusCode === 404 ? 404 : 503, statusMessage: statusCode === 404 ? 'Không tìm thấy tác giả.' : 'Không thể tải trang tác giả lúc này.' })
}

const author = computed(() => data.value?.author || null)
const articles = computed(() => data.value?.posts || [])
const lastPage = computed(() => data.value?.meta?.last_page || 1)
const authorPath = computed(() => author.value?.canonical_path || `/tin-tuc/tac-gia/${slug}`)
const canonicalPath = computed(() => pageNumber.value > 1 && !hasUnsupportedQuery.value ? `${authorPath.value}?page=${pageNumber.value}` : authorPath.value)
const initials = computed(() => (author.value?.name?.trim() || 'T').charAt(0).toUpperCase())

const { origin, canonicalUrl } = useSeoDocument(() => ({
  title: `${author.value?.name || 'Tác giả'} - Tác giả tại ${siteName.value}`,
  description: author.value?.seo.description || `Các bài viết của ${author.value?.name || 'tác giả'} tại ${siteName.value}.`,
  path: canonicalPath.value,
  image: author.value?.avatar,
  robots: hasUnsupportedQuery.value ? 'noindex,follow' : normalizeRobots(author.value?.seo.robots),
  type: 'website',
}))

const authorJsonLd = computed(() => {
  if (!author.value || !canonicalUrl.value) return ''
  const personUrl = canonicalAbsoluteUrl(origin.value, authorPath.value) || canonicalUrl.value
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${personUrl}#person`,
    name: author.value.name,
    url: personUrl,
    ...(author.value.job_title ? { jobTitle: author.value.job_title } : {}),
    ...(author.value.bio ? { description: author.value.bio.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() } : {}),
    ...(author.value.avatar ? { image: publicAbsoluteUrl(origin.value, author.value.avatar) || undefined } : {}),
    ...(author.value.same_as?.length ? { sameAs: author.value.same_as } : {}),
    worksFor: { '@type': 'Organization', name: siteName.value },
  }
  const items = articles.value
    .map((article, index) => {
      const url = canonicalAbsoluteUrl(origin.value, newsArticleUrl(article))
      return url ? { '@type': 'ListItem', position: index + 1, url, name: article.title } : null
    })
    .filter(Boolean)

  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'ProfilePage', url: canonicalUrl.value, name: author.value.name, mainEntity: { '@id': `${personUrl}#person` } },
      person,
      { '@type': 'ItemList', itemListElement: items },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: publicAbsoluteUrl(origin.value, '/') },
          { '@type': 'ListItem', position: 2, name: 'Tin tức', item: publicAbsoluteUrl(origin.value, '/tin-tuc') },
          { '@type': 'ListItem', position: 3, name: author.value.name, item: personUrl },
        ],
      },
    ],
  })
})

useHead(() => ({
  script: authorJsonLd.value ? [{ key: 'news-author-jsonld', type: 'application/ld+json', innerHTML: authorJsonLd.value }] : [],
}))
</script>

<template>
  <div class="news-page">
    <div class="news-container">
      <nav class="news-breadcrumb" aria-label="Điều hướng">
        <NuxtLink to="/">Trang chủ</NuxtLink>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 5 7 7-7 7" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <NuxtLink to="/tin-tuc">Tin tức</NuxtLink>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 5 7 7-7 7" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span aria-current="page">{{ author?.name || 'Tác giả' }}</span>
      </nav>

      <header v-if="author" class="news-author-profile">
        <div class="news-author-profile-avatar">
          <NuxtImg v-if="author.avatar" :src="author.avatar" :alt="author.name" width="96" height="96" />
          <span v-else aria-hidden="true">{{ initials }}</span>
        </div>
        <div class="news-author-profile-copy">
          <span class="news-page-kicker">Tác giả</span>
          <h1>{{ author.name }}</h1>
          <p v-if="author.job_title" class="news-author-profile-role">{{ author.job_title }}</p>
          <p v-if="author.bio" class="news-author-profile-bio">{{ author.bio }}</p>
          <ul v-if="author.same_as?.length" class="news-author-profile-links">
            <li v-for="link in author.same_as" :key="link"><a :href="link" target="_blank" rel="noopener me">{{ link.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '') }}</a></li>
          </ul>
        </div>
        <span v-if="author.posts_count" class="news-page-count">{{ author.posts_count }} bài viết</span>
      </header>

      <section aria-label="Bài viết của tác giả">
        <h2 class="news-author-section-title">Bài viết của {{ author?.name || 'tác giả' }}</h2>
        <div class="news-latest-grid">
          <NewsArticleCard v-for="article in articles" :key="article.id" :article="article" variant="latest" />
        </div>
        <p v-if="!articles.length" class="news-inline-empty">Tác giả chưa có bài viết nào.</p>
        <nav v-if="lastPage > 1" class="news-category-pagination" aria-label="Phân trang bài viết của tác giả">
          <NuxtLink v-if="pageNumber > 1" :to="{ path: authorPath, query: pageNumber - 1 > 1 ? { page: pageNumber - 1 } : {} }">Trang trước</NuxtLink>
          <span>Trang {{ data?.meta?.current_page || pageNumber }} / {{ lastPage }}</span>
          <NuxtLink v-if="pageNumber < lastPage" :to="{ path: authorPath, query: { page: pageNumber + 1 } }">Trang sau</NuxtLink>
        </nav>
      </section>
    </div>
  </div>
</template>

<style scoped>
.news-author-profile { display: flex; align-items: flex-start; gap: 18px; margin: 4px 0 18px; padding: 18px; background: #fff; border: 1px solid #e3e8f0; border-radius: 8px; }
.news-author-profile-avatar { display: grid; width: 96px; height: 96px; flex: 0 0 96px; place-items: center; overflow: hidden; color: #fff; background: linear-gradient(135deg, var(--pc-primary-dark), var(--pc-primary)); border-radius: 50%; font-size: 34px; font-weight: 800; }
.news-author-profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.news-author-profile-copy { min-width: 0; flex: 1; }
.news-author-profile-copy h1 { margin: 2px 0 4px; color: var(--pc-text); font-size: 28px; font-weight: 850; line-height: 1.15; }
.news-author-profile-role { margin: 0 0 6px; color: var(--pc-primary); font-size: 13px; font-weight: 700; }
.news-author-profile-bio { margin: 0; color: var(--pc-muted); font-size: 13px; line-height: 1.6; white-space: pre-line; }
.news-author-profile-links { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 10px 0 0; padding: 0; list-style: none; font-size: 12px; }
.news-author-profile-links a { color: var(--pc-primary); text-decoration: none; }
.news-author-profile-links a:hover { text-decoration: underline; }
.news-author-section-title { margin: 0 0 12px; color: var(--pc-text); font-size: 18px; font-weight: 800; }
@media (max-width: 640px) {
  .news-author-profile { flex-direction: column; align-items: center; text-align: center; }
  .news-author-profile-links { justify-content: center; }
}
</style>
