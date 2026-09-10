<script setup lang="ts">
const route = useRoute()
const { siteName } = useSettings()
const { data: news, status, error } = await useNewsLanding()

const payload = computed(() => news.value)
useSeoDocument(() => ({
  title: `Tin tức công nghệ - ${siteName.value}`,
  description: `Tin tức công nghệ, đánh giá PC/Laptop, hướng dẫn build PC, gaming gear và thủ thuật mới nhất từ ${siteName.value}.`,
  path: '/tin-tuc',
  robots: route.query.category ? 'noindex,follow' : 'index,follow',
}))
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
