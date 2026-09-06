<script setup lang="ts">
import type { CategoryListingBanner } from '~/types/category-listing'

const props = defineProps<{ banner: CategoryListingBanner | null }>()
const ctaLabel = computed(() => props.banner?.metadata?.cta_label || '')
</script>

<template>
  <section v-if="banner" class="category-promo-banner" aria-label="Khuyến mãi danh mục">
    <component :is="banner.link ? 'NuxtLink' : 'div'" :to="banner.link || undefined" class="category-promo-banner-inner">
      <NuxtImg v-if="banner.image" :src="banner.image" :alt="banner.title" width="1200" height="150" sizes="(max-width: 767px) 100vw, 1200px" loading="lazy" />
      <div class="category-promo-banner-overlay" />
      <div class="category-promo-banner-copy">
        <span v-if="banner.badge">{{ banner.badge }}</span>
        <strong>{{ banner.title }}</strong>
        <small v-if="banner.description">{{ banner.description }}</small>
        <em v-if="ctaLabel">{{ ctaLabel }} <span aria-hidden="true">→</span></em>
      </div>
    </component>
  </section>
</template>
