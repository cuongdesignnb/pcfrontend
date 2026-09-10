<script setup lang="ts">
import type { NewsCategory } from '~/types/news'
import { newsCategoryUrl } from '~/utils/news'

defineProps<{
  categories: NewsCategory[]
}>()

</script>

<template>
  <section class="news-sidebar-card news-category-list" aria-labelledby="news-category-list-title">
    <div class="news-sidebar-heading">
      <h2 id="news-category-list-title">
        <span class="news-sidebar-heading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke-width="1.6" />
            <path d="M8 7h8M8 11h8M8 15h5" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
        Danh mục tin
      </h2>
    </div>
    <div v-if="categories.length" class="news-category-list-grid">
      <NuxtLink v-for="category in categories" :key="category.id" :to="newsCategoryUrl(category)">
        <span class="news-category-folder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </span>
        <span>{{ category.name }}</span>
        <small>({{ category.posts_count }})</small>
      </NuxtLink>
    </div>
    <p v-else class="news-inline-empty">Chưa có danh mục.</p>
  </section>
</template>
