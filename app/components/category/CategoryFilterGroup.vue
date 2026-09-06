<script setup lang="ts">
import type { CategoryListingFilterGroup } from '~/types/category-listing'

const props = defineProps<{
  group: CategoryListingFilterGroup
  selected: string[]
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: [valueSlug: string]
  toggleCollapse: []
}>()
</script>

<template>
  <section class="category-filter-section">
    <button type="button" class="category-filter-heading" :aria-expanded="!collapsed" @click="emit('toggleCollapse')">
      <span>{{ group.name }}</span>
      <svg :class="{ 'is-collapsed': collapsed }" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m6 9 6 6 6-6" /></svg>
    </button>
    <div v-show="!collapsed" class="category-filter-options">
      <label v-for="value in group.values" :key="value.slug" class="category-filter-option">
        <input
          type="checkbox"
          :checked="selected.includes(value.slug)"
          :aria-label="`${group.name}: ${value.label}`"
          @change="emit('toggle', value.slug)"
        >
        <span class="category-checkbox" aria-hidden="true" />
        <span class="category-filter-option-label">{{ value.label }}</span>
        <small>({{ value.count }})</small>
      </label>
    </div>
  </section>
</template>
