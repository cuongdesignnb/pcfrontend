<script setup lang="ts">
import type { NewsBuilderBanner } from '~/types/news'
import { storefrontPath } from '~/utils/urls'

defineProps<{
  banner: NewsBuilderBanner | null
}>()
</script>

<template>
  <section v-if="banner" class="news-detail-pc-builder">
    <NuxtImg v-if="banner.image" :src="banner.image" :alt="banner.title || 'PC Builder'" width="680" height="370" loading="lazy" sizes="sm:100vw lg:330px" class="news-detail-pc-builder-image" />
    <div class="news-detail-pc-builder-overlay" aria-hidden="true" />
    <div class="news-detail-pc-builder-copy">
      <span v-if="banner.badge" class="news-detail-pc-builder-badge">{{ banner.badge }}</span>
      <h2>{{ banner.title || 'PC Builder' }}</h2>
      <p v-if="banner.description">{{ banner.description }}</p>
      <NuxtLink :to="storefrontPath(banner.link || '/cau-hinh')">Khám phá PC Builder <span aria-hidden="true">→</span></NuxtLink>
    </div>
  </section>
</template>
