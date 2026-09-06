<script setup lang="ts">
import type { BuilderFilterOptions, BuilderFiltersState, BuilderSort } from '~/types/pc-builder'

const props = defineProps<{
  filters: BuilderFiltersState
  filterOptions: BuilderFilterOptions
  sort: BuilderSort
}>()

const emit = defineEmits<{
  'update:filters': [filters: BuilderFiltersState]
  'update:sort': [sort: BuilderSort]
}>()

const specEntries = computed(() => Object.entries(props.filterOptions.specifications))
const update = <K extends keyof BuilderFiltersState>(key: K, value: BuilderFiltersState[K]) => emit('update:filters', { ...props.filters, [key]: value })
const toggleBrand = (id: number) => {
  const values = props.filters.brand_ids.includes(id)
    ? props.filters.brand_ids.filter(value => value !== id)
    : [...props.filters.brand_ids, id]
  update('brand_ids', values)
}
const toggleSpec = (key: string, value: string) => {
  const current = props.filters.specs[key] || []
  const values = current.includes(value) ? current.filter(item => item !== value) : [...current, value]
  const specs = { ...props.filters.specs }
  if (values.length) specs[key] = values
  else delete specs[key]
  update('specs', specs)
}
const updatePrice = (key: 'price_min' | 'price_max', event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  update(key, Number.isFinite(value) && value > 0 ? value : null)
}
</script>

<template>
<div class="builder-filters">
  <label class="builder-filter-search">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" /><path d="m16 16 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
    <input :value="filters.query" type="search" placeholder="Tìm sản phẩm" @input="update('query', ($event.target as HTMLInputElement).value)">
  </label>

  <details v-if="filterOptions.brands.length" class="builder-filter-group" open>
    <summary>Hãng sản xuất <span aria-hidden="true">⌃</span></summary>
    <label v-for="brand in filterOptions.brands" :key="brand.id" class="builder-check-option">
      <input type="checkbox" :checked="filters.brand_ids.includes(brand.id)" @change="toggleBrand(brand.id)">
      <span class="builder-checkbox" aria-hidden="true" />
      <span>{{ brand.name }}</span><small>({{ brand.count }})</small>
    </label>
  </details>

  <details v-for="[key, values] in specEntries" :key="key" class="builder-filter-group">
    <summary>{{ key }} <span aria-hidden="true">⌃</span></summary>
    <label v-for="value in values" :key="value" class="builder-check-option">
      <input type="checkbox" :checked="filters.specs[key]?.includes(value)" @change="toggleSpec(key, value)">
      <span class="builder-checkbox" aria-hidden="true" />
      <span>{{ value }}</span>
    </label>
  </details>

  <details class="builder-filter-group">
    <summary>Khoảng giá <span aria-hidden="true">⌃</span></summary>
    <div class="builder-price-inputs">
      <input :value="filters.price_min ?? ''" type="number" min="0" placeholder="Từ" @change="updatePrice('price_min', $event)">
      <span>–</span>
      <input :value="filters.price_max ?? ''" type="number" min="0" placeholder="Đến" @change="updatePrice('price_max', $event)">
    </div>
  </details>

  <label class="builder-switch-option">
    <input type="checkbox" :checked="filters.only_compatible" @change="update('only_compatible', ($event.target as HTMLInputElement).checked)">
    <span class="builder-switch" aria-hidden="true" />
    <span>Chỉ hiện sản phẩm tương thích</span>
  </label>
  <label class="builder-switch-option">
    <input type="checkbox" :checked="filters.on_sale" @change="update('on_sale', ($event.target as HTMLInputElement).checked)">
    <span class="builder-switch" aria-hidden="true" />
    <span>Chỉ hiện sản phẩm khuyến mãi</span>
  </label>

  <label class="builder-sort-control">Sắp xếp
    <select :value="sort" @change="emit('update:sort', ($event.target as HTMLSelectElement).value as BuilderSort)">
      <option value="compatibility">Tương thích trước</option>
      <option value="popular">Bán chạy nhất</option>
      <option value="rating">Đánh giá cao</option>
      <option value="price_asc">Giá thấp đến cao</option>
      <option value="price_desc">Giá cao đến thấp</option>
    </select>
  </label>
</div>
</template>
