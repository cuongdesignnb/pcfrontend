<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { formatViewCount, newsArticleUrl } from '~/utils/news'

defineProps<{
  articles: NewsArticle[]
}>()
</script>

<template>
  <section v-if="articles.length" class="news-detail-sidebar-card news-detail-trending" aria-labelledby="news-detail-trending-title">
    <div class="news-detail-sidebar-heading"><h2 id="news-detail-trending-title"><span class="news-detail-sidebar-icon is-hot" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13.5 2.8c.7 3.6-1.3 5.2-2.7 6.8-1.2 1.4-1.6 2.5-1.1 4.2.4 1.3 1.4 2.1 2.7 2.1 2.1 0 3.5-1.8 3.3-4.2 3 2.2 4.2 5.1 3.2 7.3-1.1 2.5-3.8 3.9-6.9 3.9-4.9 0-8-3.1-8-7.5 0-3.4 1.9-5.8 4.4-8.2-.1 2.2.7 3.5 1.7 4.3-.1-3 1.6-5.9 3.4-7.8Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></span>Xu hướng đọc nhiều</h2><NuxtLink to="/tin-tuc">Xem tất cả <span aria-hidden="true">→</span></NuxtLink></div>
    <div class="news-detail-trending-list">
      <NuxtLink v-for="(article, index) in articles.slice(0, 5)" :key="article.id" :to="newsArticleUrl(article)" class="news-detail-trending-item">
        <span class="news-detail-trending-rank" :class="{ 'is-top': index === 0 }">{{ index + 1 }}</span>
        <span class="news-detail-trending-image"><NuxtImg v-if="article.featured_image" :src="article.featured_image" :alt="article.title" width="160" height="104" loading="lazy" sizes="80px" /><svg v-else aria-hidden="true" viewBox="0 0 48 36" fill="none" stroke="currentColor"><rect x="4" y="5" width="40" height="26" rx="2" stroke-width="1.6" /><path d="m8 26 9-9 6 6 5-6 10 9" stroke-width="1.6" stroke-linejoin="round" /></svg></span>
        <span class="news-detail-trending-copy"><strong>{{ article.title }}</strong><small><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" stroke-width="1.6" stroke-linejoin="round" /><circle cx="12" cy="12" r="2.5" stroke-width="1.6" /></svg>{{ formatViewCount(article.view_count) }}</small></span>
      </NuxtLink>
    </div>
  </section>
</template>
