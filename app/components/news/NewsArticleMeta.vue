<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { formatNewsDate, formatViewCount } from '~/utils/news'

defineProps<{
  article: NewsArticle
}>()
</script>

<template>
  <div class="news-article-meta">
    <span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke-width="1.6" />
        <path d="M7 3v4M17 3v4M3 10h18" stroke-width="1.6" stroke-linecap="round" />
      </svg>
      {{ formatNewsDate(article.published_at) }}
    </span>
    <span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" stroke-width="1.6" stroke-linejoin="round" />
        <circle cx="12" cy="12" r="2.5" stroke-width="1.6" />
      </svg>
      {{ formatViewCount(article.view_count) }}
    </span>
  </div>
</template>
