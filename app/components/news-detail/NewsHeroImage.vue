<script setup lang="ts">
import type { NewsDetailPost } from '~/types/news-detail'

const props = defineProps<{
  post: NewsDetailPost
}>()
</script>

<template>
  <figure class="news-detail-hero">
    <NuxtImg
      v-if="post.featured_image"
      :src="post.featured_image"
      :alt="post.title"
      width="1280"
      height="520"
      loading="eager"
      fetchpriority="high"
      preload
      sizes="sm:100vw md:100vw lg:calc(100vw - 390px)"
    />
    <div v-else class="news-detail-hero-empty" role="img" aria-label="Ảnh bài viết chưa được cập nhật">
      <svg aria-hidden="true" viewBox="0 0 96 64" fill="none" stroke="currentColor"><rect x="7" y="7" width="82" height="50" rx="5" stroke-width="2" /><path d="m15 48 19-18 13 12 10-11 24 17" stroke-width="2" stroke-linejoin="round" /><circle cx="30" cy="21" r="5" stroke-width="2" /></svg>
      <span>Ảnh bài viết chưa được cập nhật</span>
    </div>
  </figure>
</template>
