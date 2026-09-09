<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { formatNewsDate, formatViewCount, newsArticleUrl, newsBadgeTone } from '~/utils/news'

defineProps<{
  articles: NewsArticle[]
}>()
</script>

<template>
  <section v-if="articles.length" class="news-detail-related" aria-labelledby="news-detail-related-title">
    <div class="news-detail-related-heading"><h2 id="news-detail-related-title"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="3" width="16" height="18" rx="2" stroke-width="1.6" /><path d="M8 8h8M8 12h6M8 16h4" stroke-width="1.6" stroke-linecap="round" /></svg></span>Bài viết liên quan</h2><NuxtLink to="/tin-tuc">Xem tất cả <span aria-hidden="true">→</span></NuxtLink></div>
    <div class="news-detail-related-grid">
      <NuxtLink v-for="article in articles.slice(0, 4)" :key="article.id" :to="newsArticleUrl(article)" class="news-detail-related-card">
        <span class="news-detail-related-image"><NuxtImg v-if="article.featured_image" :src="article.featured_image" :alt="article.title" width="720" height="300" loading="lazy" sizes="sm:100vw md:50vw lg:25vw" /><svg v-else aria-hidden="true" viewBox="0 0 64 42" fill="none" stroke="currentColor"><rect x="5" y="5" width="54" height="32" rx="3" stroke-width="1.7" /><path d="m11 31 12-12 8 8 6-7 16 11" stroke-width="1.7" stroke-linejoin="round" /></svg><span class="news-detail-related-badge" :class="`is-${newsBadgeTone(article.category?.slug)}`">{{ article.category?.name || 'Tin tức' }}</span></span>
        <span class="news-detail-related-copy"><strong>{{ article.title }}</strong><small><span>{{ formatNewsDate(article.published_at) }}</span><span>{{ formatViewCount(article.view_count) }}</span></small></span>
      </NuxtLink>
    </div>
  </section>
</template>
