<script setup lang="ts">
import type { CategoryActiveFilter } from '~/types/category-listing'

const props = defineProps<{ filters: CategoryActiveFilter[] }>()
const emit = defineEmits<{
  remove: [id: string]
  clear: []
}>()
</script>

<template>
  <div v-if="props.filters.length" class="category-active-filters" aria-label="Bộ lọc đang chọn">
    <span v-for="filter in props.filters" :key="filter.id" class="category-filter-chip">
      {{ filter.label }}
      <button type="button" :aria-label="`Bỏ bộ lọc ${filter.label}`" @click="emit('remove', filter.id)">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-width="1.8" d="m7 7 10 10M17 7 7 17" /></svg>
      </button>
    </span>
    <button type="button" class="category-active-filters-clear" @click="emit('clear')">Xóa tất cả</button>
  </div>
</template>
