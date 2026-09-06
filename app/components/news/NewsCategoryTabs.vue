<script setup lang="ts">
import type { NewsCategory } from '~/types/news'

const props = defineProps<{
  categories: NewsCategory[]
}>()

const route = useRoute()
const preferredSlugs = [
  'tin-tuc-cong-nghe',
  'review-san-pham',
  'huong-dan',
  'khuyen-mai',
  'huong-dan-build-pc',
  'laptop',
  'gaming-gear',
]
const activeSlug = computed(() => {
  const value = route.query.category
  return typeof value === 'string' ? value : ''
})
const visibleCategories = computed(() => {
  const preferred = preferredSlugs
    .map(slug => props.categories.find(category => category.slug === slug))
    .filter((category): category is NewsCategory => Boolean(category))
  const remaining = props.categories.filter(category => !preferredSlugs.includes(category.slug))

  return [...preferred, ...remaining].slice(0, 7)
})

function categoryLink(slug?: string) {
  return {
    path: '/tin-tuc',
    query: slug ? { category: slug } : {},
  }
}
</script>

<template>
  <nav class="news-category-tabs" aria-label="Lọc danh mục tin tức">
    <NuxtLink :to="categoryLink()" :class="{ 'is-active': !activeSlug }">Tất cả</NuxtLink>
    <NuxtLink
      v-for="category in visibleCategories"
      :key="category.id"
      :to="categoryLink(category.slug)"
      :class="{ 'is-active': activeSlug === category.slug }"
    >
      {{ category.name }}
    </NuxtLink>
  </nav>
</template>
