<script setup lang="ts">
import type { MenuItemData } from '~/types/menu'
import { categoryUrl, storefrontPath } from '~/utils/urls'

// Top-level items of the admin "Header" menu, in the order set there.
defineProps<{ items: MenuItemData[] }>()

function resolveUrl(item: MenuItemData): string {
  if (item.type === 'category' && item.category?.slug) return categoryUrl(item.category)
  return storefrontPath(item.url)
}
</script>

<template>
  <nav class="header-navigation" aria-label="Điều hướng chính">
    <ul class="header-navigation-list">
      <li v-for="item in items" :key="item.id" class="header-navigation-item">
        <NuxtLink
          :to="resolveUrl(item)"
          :target="item.target === '_blank' ? '_blank' : undefined"
          :rel="item.target === '_blank' ? 'noopener noreferrer' : undefined"
          class="header-navigation-link"
          :class="item.css_class || undefined"
        >
          <span>{{ item.title }}</span>
          <span v-if="item.badge_text" class="header-nav-badge">{{ item.badge_text }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
