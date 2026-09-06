<script setup lang="ts">
import type { CategoryListingCategory, CategoryTrustItem } from '~/types/category-listing'

const props = defineProps<{
  category: CategoryListingCategory | null
  trustItems: CategoryTrustItem[]
}>()

const imageBroken = ref(false)

watch(() => props.category?.id, () => {
  imageBroken.value = false
})
</script>

<template>
  <section v-if="category" class="category-hero" aria-labelledby="category-title">
    <div class="category-hero-copy">
      <h1 id="category-title">{{ category.name }}</h1>
      <p v-if="category.description">{{ category.description }}</p>
      <div v-if="trustItems.length" class="category-hero-trust" aria-label="Thông tin dịch vụ">
        <div v-for="item in trustItems" :key="item.key" class="category-hero-trust-item">
          <span class="category-hero-trust-icon" aria-hidden="true">
            <svg v-if="item.icon === 'shield'" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linejoin="round" stroke-width="1.7" d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" /><path stroke-linecap="round" stroke-width="1.7" d="m8.5 12 2.2 2.2 4.8-5" /></svg>
            <svg v-else-if="item.icon === 'truck'" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linejoin="round" stroke-width="1.7" d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" stroke-width="1.7" /><circle cx="18" cy="18" r="2" stroke-width="1.7" /></svg>
            <svg v-else-if="item.icon === 'refresh'" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M20 5v5h-5M4 19v-5h5" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M6.1 9A7 7 0 0 1 18.6 6L20 10M4 14l1.4 4a7 7 0 0 0 12.5-3" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-width="1.7" d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 0 1-1v-4Z" /><path stroke-linecap="round" stroke-width="1.7" d="M17 19c0 1.1-1.3 2-3 2h-1" /></svg>
          </span>
          <span><strong>{{ item.title }}</strong><small>{{ item.text }}</small></span>
        </div>
      </div>
    </div>
    <div class="category-hero-art">
      <NuxtImg
        v-if="category.image && !imageBroken"
        :src="category.image"
        :alt="category.name"
        width="420"
        height="180"
        sizes="(max-width: 767px) 100vw, 420px"
        loading="eager"
        @error="imageBroken = true"
      />
      <img v-else-if="category.icon && !imageBroken" :src="category.icon" :alt="category.name" loading="eager" @error="imageBroken = true">
      <svg v-else aria-hidden="true" viewBox="0 0 280 150" fill="none" stroke="currentColor">
        <rect x="43" y="28" width="194" height="92" rx="8" stroke-width="4" />
        <path stroke-linecap="round" stroke-width="4" d="M82 139h116M140 120v19" />
        <path stroke-linecap="round" stroke-width="4" d="m70 50 22-12 20 13 25-20 31 24 19-11 31 24" />
      </svg>
    </div>
  </section>
  <div v-else class="category-hero category-skeleton" aria-hidden="true">
    <div class="category-skeleton-copy" />
    <div class="category-skeleton-art" />
  </div>
</template>
