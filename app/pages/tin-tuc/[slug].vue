<script setup lang="ts">
import type { NewsDetailPost } from '~/types/news-detail'

const route = useRoute()
const config = useRuntimeConfig()
const { siteName, siteLogo } = useSettings()
const rawSlug = route.params.slug
const slug = Array.isArray(rawSlug) ? String(rawSlug[0] || '') : String(rawSlug || '')

if (!slug) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bài viết.' })
}

const { data, status, error, trackView } = await useNewsArticle(slug)
const post = computed<NewsDetailPost | null>(() => data.value?.post || null)
const detail = computed(() => data.value)

if (error.value) {
  const errorStatus = Number((error.value as { statusCode?: number; status?: number }).statusCode || (error.value as { status?: number }).status || 500)
  throw createError({
    statusCode: errorStatus === 404 ? 404 : 500,
    statusMessage: errorStatus === 404 ? 'Không tìm thấy bài viết.' : 'Không thể tải bài viết lúc này.',
  })
}

if (!post.value && status.value !== 'pending') {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bài viết.' })
}

const siteOrigin = computed(() => String(config.public.siteUrl || 'https://laptopplus.vn').replace(/\/$/, ''))
const canonicalUrl = computed(() => `${siteOrigin.value}/tin-tuc/${encodeURIComponent(post.value?.slug || slug)}`)

const absoluteUrl = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined

  try {
    return new URL(value, siteOrigin.value).toString()
  } catch {
    return undefined
  }
}

const articleJsonLd = computed(() => {
  if (!post.value) return ''

  const article = post.value
  const articleSchema: Record<string, unknown> = {
    '@type': 'Article',
    '@id': `${canonicalUrl.value}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl.value },
    headline: article.title,
    description: article.seo.description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Tác giả',
    },
    publisher: {
      '@type': 'Organization',
      name: siteName.value,
      logo: absoluteUrl(siteLogo.value) ? { '@type': 'ImageObject', url: absoluteUrl(siteLogo.value) } : undefined,
    },
    image: absoluteUrl(article.seo.image || article.featured_image),
    articleSection: article.category?.name || undefined,
  }

  const breadcrumbItems: Array<Record<string, unknown>> = [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${siteOrigin.value}/` },
    { '@type': 'ListItem', position: 2, name: 'Tin tức', item: `${siteOrigin.value}/tin-tuc` },
  ]
  if (article.category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: article.category.name,
      item: `${siteOrigin.value}/tin-tuc?category=${encodeURIComponent(article.category.slug)}`,
    })
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: article.title,
    item: canonicalUrl.value,
  })

  const graph = [
    { '@context': 'https://schema.org', ...articleSchema },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbItems },
  ]

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
})

useSeoMeta({
  title: () => post.value?.seo.title || post.value?.title || `Tin tức - ${siteName.value}`,
  description: () => post.value?.seo.description || post.value?.excerpt || undefined,
  ogTitle: () => post.value?.seo.title || post.value?.title || siteName.value,
  ogDescription: () => post.value?.seo.description || post.value?.excerpt || undefined,
  ogUrl: () => canonicalUrl.value,
  ogType: 'article',
  ogImage: () => absoluteUrl(post.value?.seo.image || post.value?.featured_image),
  twitterCard: 'summary_large_image',
  articlePublishedTime: () => post.value?.published_at || undefined,
  articleModifiedTime: () => post.value?.updated_at || post.value?.published_at || undefined,
})

useHead(() => {
  if (!post.value) return {}

  return {
    link: [{ rel: 'canonical', href: canonicalUrl.value }],
    script: [{ key: 'news-article-jsonld', type: 'application/ld+json', innerHTML: articleJsonLd.value }],
  }
})

onMounted(() => {
  void trackView()
})
</script>

<template>
  <div class="news-detail-page">
    <div class="news-detail-container">
      <NewsArticleSkeleton v-if="status === 'pending'" />
      <template v-else-if="post && detail">
        <NewsArticleBreadcrumb :post="post" />

        <div class="news-detail-layout">
          <main class="news-detail-main">
            <NewsArticleHeader :post="post" />
            <NewsHeroImage :post="post" />

            <div class="news-detail-content-intro" :class="{ 'has-toc': post.toc.length }">
              <NewsTableOfContents :items="post.toc" />
              <p v-if="post.excerpt" class="news-detail-lead">{{ post.excerpt }}</p>
            </div>

            <NewsArticleBody :html="post.body" />
          </main>

          <aside class="news-detail-sidebar" aria-label="Thông tin thêm về bài viết">
            <NewsTrendingSidebar :articles="detail.sidebar.trending" />
            <NewsRelatedReviewSidebar :articles="detail.sidebar.reviews" />
            <NewsNewsletterSidebar />
            <NewsPcBuilderSidebar :banner="detail.sidebar.pc_builder" />
          </aside>
        </div>

        <NewsRelatedArticles :articles="detail.related" />
      </template>
    </div>
  </div>
</template>
