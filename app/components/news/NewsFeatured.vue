<script setup lang="ts">
import type { NewsArticle } from '~/types/news'

defineProps<{
  articles: NewsArticle[]
}>()
</script>

<template>
  <section class="news-featured" aria-labelledby="news-featured-title">
    <NewsSectionHeader title="Bài viết nổi bật" to="/tin-tuc" />
    <div id="news-featured-title" class="news-featured-grid">
      <NewsArticleCard v-for="article in articles" :key="article.id" :article="article" variant="featured" />
    </div>
    <p v-if="!articles.length" class="news-inline-empty">Chưa có bài viết nổi bật.</p>
  </section>
</template>
