<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { formatNewsDate, formatViewCount, newsArticleUrl, newsBadgeTone } from '~/utils/news'

const props = defineProps<{
  article: NewsArticle
}>()

const badgeTone = computed(() => newsBadgeTone(props.article.category?.slug))
</script>

<template>
  <NuxtLink :to="newsArticleUrl(article)" class="news-hero-main">
    <NuxtImg
      v-if="article.featured_image"
      :src="article.featured_image"
      :alt="article.title"
      class="news-hero-image"
      width="1400"
      height="720"
      loading="eager"
      fetchpriority="high"
      preload
      sizes="sm:100vw lg:66vw"
    />
    <div v-else class="news-hero-fallback" aria-hidden="true">
      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor">
        <rect x="8" y="12" width="104" height="56" rx="5" stroke-width="3" />
        <path d="m18 58 24-23 17 15 13-15 29 23" stroke-width="3" stroke-linejoin="round" />
        <circle cx="37" cy="27" r="7" stroke-width="3" />
      </svg>
    </div>
    <span class="news-hero-overlay" aria-hidden="true" />
    <span class="news-hero-main-content">
      <span class="news-badge" :class="`news-badge--${badgeTone}`">{{ article.category?.name || 'Tin công nghệ' }}</span>
      <strong>{{ article.title }}</strong>
      <span v-if="article.excerpt" class="news-hero-excerpt">{{ article.excerpt }}</span>
      <span class="news-hero-meta-row">
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
      </span>
      <span class="news-hero-cta">Đọc ngay <span aria-hidden="true">→</span></span>
    </span>
  </NuxtLink>
</template>
