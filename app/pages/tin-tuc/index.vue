<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const { siteName } = useSettings()
const { data: news, status, error } = await useNewsLanding()

const payload = computed(() => news.value)
const canonicalUrl = computed(() => {
  const category = typeof route.query.category === 'string' ? route.query.category : ''
  const base = `${String(config.public.siteUrl).replace(/\/$/, '')}/tin-tuc`
  return category ? `${base}?category=${encodeURIComponent(category)}` : base
})

useSeoMeta({
  title: () => `Tin tức công nghệ - ${siteName.value}`,
  description: () => `Tin tức công nghệ, đánh giá PC/Laptop, hướng dẫn build PC, gaming gear và thủ thuật mới nhất từ ${siteName.value}.`,
  ogTitle: () => `Tin tức công nghệ - ${siteName.value}`,
  ogDescription: () => `Tin tức công nghệ, đánh giá PC/Laptop, hướng dẫn build PC, gaming gear và thủ thuật mới nhất từ ${siteName.value}.`,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>

<template>
  <div class="news-page">
    <div class="news-container">
      <NewsBreadcrumb />
      <NewsPageHeader />
      <NewsLandingSkeleton v-if="status === 'pending'" />
      <template v-else>
        <NewsHero :articles="payload.hero" />
        <NewsCategoryTabs :categories="payload.categories" />
        <div v-if="error" class="news-error" role="status">
          Không thể tải nội dung tin tức lúc này. Vui lòng thử lại sau.
        </div>
        <template v-else>
          <div class="news-content-grid">
            <main class="news-main-column">
              <NewsFeatured :articles="payload.featured" />
              <NewsLatest :articles="payload.latest" />
            </main>
            <NewsSidebar
              :trending="payload.trending"
              :categories="payload.categories"
              :pc-builder="payload.pc_builder"
            />
          </div>
          <NewsTopicStrip :topics="payload.topics" />
        </template>
      </template>
    </div>
  </div>
</template>
