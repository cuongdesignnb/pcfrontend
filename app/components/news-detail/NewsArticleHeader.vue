<script setup lang="ts">
import type { NewsDetailPost } from '~/types/news-detail'
import { newsCategoryUrl } from '~/utils/news'
import { newsBadgeTone } from '~/utils/news'

const props = defineProps<{
  post: NewsDetailPost
}>()

const badgeTone = computed(() => newsBadgeTone(props.post.category?.slug))
</script>

<template>
  <header class="news-detail-article-header">
    <NuxtLink v-if="post.category" :to="newsCategoryUrl(post.category)" class="news-detail-category-badge" :class="`is-${badgeTone}`">
      {{ post.category.name }}
    </NuxtLink>
    <h1>{{ post.title }}</h1>
    <p v-if="post.excerpt" class="news-detail-excerpt">{{ post.excerpt }}</p>
    <div class="news-detail-header-meta">
      <NewsAuthorMeta :post="post" />
      <NewsShareButtons :title="post.title" :slug="post.slug" :canonical-url="post.seo.canonical_url" />
    </div>
  </header>
</template>
