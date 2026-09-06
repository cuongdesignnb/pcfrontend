<script setup lang="ts">
import type { NewsTopic } from '~/types/news'

defineProps<{
  topics: NewsTopic[]
}>()

function topicLink(slug: string) {
  return { path: '/tin-tuc', query: { category: slug } }
}
</script>

<template>
  <section class="news-topic-strip" aria-labelledby="news-topic-title">
    <NewsSectionHeader title="Tin theo chủ đề" icon="tag" to="/tin-tuc" />
    <div id="news-topic-title" class="news-topic-grid">
      <NuxtLink v-for="topic in topics.slice(0, 5)" :key="topic.id" :to="topicLink(topic.slug)" class="news-topic-card">
        <span class="news-topic-copy">
          <strong>{{ topic.name }}</strong>
          <small>{{ topic.posts_count }} bài viết</small>
        </span>
        <span class="news-topic-image">
          <NuxtImg
            v-if="topic.image"
            :src="topic.image"
            :alt="topic.name"
            width="190"
            height="110"
            loading="lazy"
            sizes="sm:45vw md:20vw lg:18vw"
          />
          <svg v-else aria-hidden="true" viewBox="0 0 80 52" fill="none" stroke="currentColor">
            <rect x="5" y="10" width="70" height="34" rx="3" stroke-width="2" />
            <path d="m12 37 15-14 10 9 9-10 19 15" stroke-width="2" stroke-linejoin="round" />
          </svg>
        </span>
        <svg class="news-topic-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="m9 5 7 7-7 7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>
    </div>
    <p v-if="!topics.length" class="news-inline-empty">Chưa có chủ đề.</p>
  </section>
</template>
