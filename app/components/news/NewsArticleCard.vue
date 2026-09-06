<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { newsArticleUrl, newsBadgeTone } from '~/utils/news'

const props = withDefaults(defineProps<{
  article: NewsArticle
  variant?: 'featured' | 'latest'
}>(), {
  variant: 'featured',
})

const badgeTone = computed(() => newsBadgeTone(props.article.category?.slug))
</script>

<template>
  <NuxtLink :to="newsArticleUrl(article)" class="news-article-card" :class="`news-article-card--${variant}`">
    <div class="news-article-card-media">
      <NuxtImg
        v-if="article.featured_image"
        :src="article.featured_image"
        :alt="article.title"
        class="news-article-card-image"
        width="720"
        height="405"
        loading="lazy"
        sizes="sm:100vw md:50vw lg:33vw"
      />
      <div v-else class="news-image-fallback" aria-hidden="true">
        <svg viewBox="0 0 64 48" fill="none" stroke="currentColor">
          <rect x="6" y="7" width="52" height="34" rx="3" stroke-width="2" />
          <path d="m12 34 11-11 8 7 7-8 14 12" stroke-width="2" stroke-linejoin="round" />
          <circle cx="21" cy="17" r="3" stroke-width="2" />
        </svg>
      </div>
      <span class="news-badge" :class="`news-badge--${badgeTone}`">{{ article.category?.name || 'Tin công nghệ' }}</span>
    </div>
    <div class="news-article-card-body">
      <h3>{{ article.title }}</h3>
      <p v-if="article.excerpt">{{ article.excerpt }}</p>
      <NewsArticleMeta :article="article" />
    </div>
  </NuxtLink>
</template>
