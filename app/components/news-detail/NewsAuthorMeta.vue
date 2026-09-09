<script setup lang="ts">
import { formatNewsDate, formatViewCount } from '~/utils/news'
import type { NewsDetailPost } from '~/types/news-detail'

const props = defineProps<{
  post: NewsDetailPost
}>()

const initials = computed(() => {
  const name = props.post.author?.name?.trim() || 'Tác giả'
  return name.charAt(0).toUpperCase()
})
</script>

<template>
  <div class="news-detail-author-meta">
    <div class="news-detail-author-avatar">
      <NuxtImg v-if="post.author?.avatar" :src="post.author.avatar" :alt="post.author.name" width="44" height="44" loading="lazy" />
      <span v-else aria-hidden="true">{{ initials }}</span>
    </div>
    <div class="news-detail-author-copy">
      <strong>{{ post.author?.name || 'Tác giả' }}</strong>
      <small>Tác giả</small>
    </div>
    <div class="news-detail-meta-facts">
      <span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2" stroke-width="1.6" /><path d="M7 3v4M17 3v4M3 10h18" stroke-width="1.6" stroke-linecap="round" /></svg>
        {{ formatNewsDate(post.published_at) }}
      </span>
      <span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" stroke-width="1.6" stroke-linejoin="round" /><circle cx="12" cy="12" r="2.5" stroke-width="1.6" /></svg>
        {{ formatViewCount(post.view_count) }}
      </span>
    </div>
  </div>
</template>
