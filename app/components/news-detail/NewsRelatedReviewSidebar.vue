<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { formatViewCount, newsArticleUrl, newsBadgeTone } from '~/utils/news'

defineProps<{
  articles: NewsArticle[]
}>()
</script>

<template>
  <section v-if="articles.length" class="news-detail-sidebar-card news-detail-reviews" aria-labelledby="news-detail-reviews-title">
    <div class="news-detail-sidebar-heading"><h2 id="news-detail-reviews-title"><span class="news-detail-sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="3" width="16" height="18" rx="2" stroke-width="1.6" /><path d="M8 8h8M8 12h6M8 16h4" stroke-width="1.6" stroke-linecap="round" /></svg></span>Bài đánh giá liên quan</h2><NuxtLink to="/tin-tuc">Xem tất cả <span aria-hidden="true">→</span></NuxtLink></div>
    <div class="news-detail-review-list">
      <NuxtLink v-for="article in articles.slice(0, 4)" :key="article.id" :to="newsArticleUrl(article)" class="news-detail-review-item">
        <span class="news-detail-review-image"><NuxtImg v-if="article.featured_image" :src="article.featured_image" :alt="article.title" width="160" height="100" loading="lazy" sizes="80px" /><svg v-else aria-hidden="true" viewBox="0 0 48 36" fill="none" stroke="currentColor"><rect x="4" y="5" width="40" height="26" rx="2" stroke-width="1.6" /><path d="m8 26 9-9 6 6 5-6 10 9" stroke-width="1.6" stroke-linejoin="round" /></svg><span class="news-detail-review-badge" :class="`is-${newsBadgeTone(article.category?.slug)}`">{{ article.category?.name || 'Review' }}</span></span>
        <span class="news-detail-review-copy"><strong>{{ article.title }}</strong><small><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" stroke-width="1.6" stroke-linejoin="round" /><circle cx="12" cy="12" r="2.5" stroke-width="1.6" /></svg>{{ formatViewCount(article.view_count) }}</small></span>
      </NuxtLink>
    </div>
  </section>
</template>
