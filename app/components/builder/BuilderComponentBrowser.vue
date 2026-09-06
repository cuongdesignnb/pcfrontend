<script setup lang="ts">
import type { BuilderComponentType, BuilderFilterOptions, BuilderFiltersState, BuilderProductOption, BuilderSort } from '~/types/pc-builder'

const props = defineProps<{
  componentTypes: BuilderComponentType[]
  activeTypeSlug: string | null
  options: BuilderProductOption[]
  selectedProductId?: number
  filterOptions: BuilderFilterOptions
  filters: BuilderFiltersState
  sort: BuilderSort
  loading: boolean
  total: number
  currentPage: number
  lastPage: number
}>()

const emit = defineEmits<{
  selectType: [slug: string]
  selectProduct: [option: BuilderProductOption]
  openProduct: [option: BuilderProductOption]
  'update:filters': [filters: BuilderFiltersState]
  'update:sort': [sort: BuilderSort]
  page: [page: number]
}>()

const activeType = computed(() => props.componentTypes.find(type => type.slug === props.activeTypeSlug))
</script>

<template>
<section id="builder-component-browser" class="builder-panel builder-browser" aria-labelledby="builder-browser-title">
  <div class="builder-panel-heading builder-browser-heading">
    <div>
      <h2 id="builder-browser-title">Chọn linh kiện</h2>
      <p v-if="activeType">{{ activeType.name }} · {{ total }} sản phẩm</p>
    </div>
    <NuxtLink v-if="activeType" :to="`/categories/${activeType.slug}`">Xem tất cả {{ activeType.name }} <span aria-hidden="true">→</span></NuxtLink>
  </div>
  <BuilderComponentTabs :component-types="componentTypes" :active-type-slug="activeTypeSlug" @select="emit('selectType', $event)" />
  <BuilderFilters :filters="filters" :filter-options="filterOptions" :sort="sort" @update:filters="emit('update:filters', $event)" @update:sort="emit('update:sort', $event)" />
  <BuilderProductGrid :options="options" :selected-product-id="selectedProductId" :loading="loading" @select="emit('selectProduct', $event)" @open="emit('openProduct', $event)" />
  <div v-if="lastPage > 1" class="builder-pagination" aria-label="Phân trang sản phẩm">
    <button type="button" :disabled="currentPage <= 1" aria-label="Trang trước" @click="emit('page', currentPage - 1)">‹</button>
    <button v-for="page in Math.min(lastPage, 5)" :key="page" type="button" :class="{ 'is-active': currentPage === page }" @click="emit('page', page)">{{ page }}</button>
    <button type="button" :disabled="currentPage >= lastPage" aria-label="Trang sau" @click="emit('page', currentPage + 1)">›</button>
  </div>
</section>
</template>
