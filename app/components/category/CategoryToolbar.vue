<script setup lang="ts">
interface SortOption {
  value: string
  label: string
}

const props = defineProps<{
  from: number
  to: number
  total: number
  sort: string
  viewMode: 'grid' | 'list'
  sortOptions: readonly SortOption[]
  activeFilterCount: number
  pending?: boolean
}>()

const emit = defineEmits<{
  openFilters: []
  updateSort: [sort: string]
  updateView: [view: 'grid' | 'list']
}>()
</script>

<template>
  <div id="category-toolbar" class="category-toolbar" :aria-busy="pending">
    <button type="button" class="category-mobile-filter-trigger" @click="emit('openFilters')">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-width="1.7" d="M4 6h16M7 12h10M10 18h4" /></svg>
      <span>Bộ lọc</span>
      <small v-if="activeFilterCount">{{ activeFilterCount }}</small>
    </button>
    <p class="category-result-count">
      <span v-if="total">Hiển thị {{ from }} - {{ to }} của {{ total }} sản phẩm</span>
      <span v-else>Không có sản phẩm</span>
    </p>
    <div class="category-toolbar-actions">
      <div class="category-view-toggle" role="group" aria-label="Kiểu hiển thị">
        <button type="button" :class="{ 'is-active': viewMode === 'grid' }" :aria-pressed="viewMode === 'grid'" aria-label="Hiển thị dạng lưới" @click="emit('updateView', 'grid')">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        </button>
        <button type="button" :class="{ 'is-active': viewMode === 'list' }" :aria-pressed="viewMode === 'list'" aria-label="Hiển thị dạng danh sách" @click="emit('updateView', 'list')">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="3" rx="1" /><rect x="4" y="10.5" width="16" height="3" rx="1" /><rect x="4" y="17" width="16" height="3" rx="1" /></svg>
        </button>
      </div>
      <label class="category-sort-select">
        <span>Sắp xếp theo</span>
        <select :value="sort" aria-label="Sắp xếp sản phẩm" @change="emit('updateSort', ($event.target as HTMLSelectElement).value)">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>
  </div>
</template>
