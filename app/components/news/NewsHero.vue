<script setup lang="ts">
import type { NewsArticle } from '~/types/news'

defineProps<{
  articles: NewsArticle[]
}>()
</script>

<template>
  <section class="news-hero" aria-label="Bài viết nổi bật">
    <template v-if="articles.length">
      <NewsHeroMain :article="articles[0]!" />
      <div class="news-hero-side">
        <NewsHeroSideCard v-for="article in articles.slice(1, 3)" :key="article.id" :article="article" />
      </div>
    </template>
    <div v-else class="news-hero-empty">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 5h16v14H4z" stroke-width="1.6" />
        <path d="m6.5 16 4-4 2.8 2.8 2.2-2.4 2 2.6M8 8.5h.01" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>Chương trình nổi bật đang được cập nhật</span>
    </div>
  </section>
</template>
