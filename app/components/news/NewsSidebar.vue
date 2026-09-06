<script setup lang="ts">
import type { NewsArticle, NewsBuilderBanner, NewsCategory } from '~/types/news'

defineProps<{
  trending: NewsArticle[]
  categories: NewsCategory[]
  pcBuilder: NewsBuilderBanner | null
}>()
</script>

<template>
  <aside class="news-sidebar">
    <NewsTrending :articles="trending" />
    <NewsNewsletter />
    <NewsPcBuilderPromo :banner="pcBuilder" />
    <NewsCategoryList :categories="categories" />
  </aside>
</template>
