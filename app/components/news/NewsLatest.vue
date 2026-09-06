<script setup lang="ts">
import type { NewsArticle } from '~/types/news'

defineProps<{
  articles: NewsArticle[]
}>()
</script>

<template>
  <section class="news-latest" aria-labelledby="news-latest-title">
    <NewsSectionHeader title="Mới nhất" icon="latest" to="/tin-tuc" />
    <div id="news-latest-title" class="news-latest-grid">
      <NewsArticleCard v-for="article in articles.slice(0, 8)" :key="article.id" :article="article" variant="latest" />
    </div>
    <p v-if="!articles.length" class="news-inline-empty">Chưa có bài viết mới.</p>
  </section>
</template>
