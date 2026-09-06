<script setup lang="ts">
import type {
  CategoryListingCategory,
  CategoryListingFilters,
  CategoryListingPricePreset,
} from '~/types/category-listing'

const props = defineProps<{
  category: CategoryListingCategory | null
  filters: CategoryListingFilters
  selectedBrands: string[]
  selectedSubCategory: string
  minPrice: number | undefined
  maxPrice: number | undefined
  inStock: boolean
  dynamicFilters: Record<string, string[]>
  specFilters: Record<string, string[]>
  collapsedGroups: Record<string, boolean>
  pricePresets: readonly CategoryListingPricePreset[]
}>()

const emit = defineEmits<{
  toggleBrand: [brandSlug: string]
  toggleSubCategory: [categorySlug: string]
  applyPrice: [min: number | undefined, max: number | undefined]
  toggleStock: []
  toggleDynamic: [filterSlug: string, valueSlug: string]
  toggleSpec: [filterKey: string, value: string]
  toggleGroup: [filterSlug: string]
  clear: []
}>()

function handlePriceApply(min: number | undefined, max: number | undefined) {
  emit('applyPrice', min, max)
}
</script>

<template>
  <aside class="category-filter-sidebar" aria-label="Bộ lọc tìm kiếm">
    <div class="category-filter-sidebar-header">
      <h2>Bộ lọc tìm kiếm</h2>
    </div>

    <section v-if="category?.children?.length" class="category-filter-section">
      <h2 class="category-filter-title category-filter-title--with-count">Danh mục con <small>{{ category.children.length }}</small></h2>
      <div class="category-filter-options">
        <label class="category-filter-option">
          <input type="checkbox" :checked="!selectedSubCategory" aria-label="Tất cả danh mục con" @change="emit('toggleSubCategory', '')">
          <span class="category-checkbox" aria-hidden="true" />
          <span class="category-filter-option-label">Tất cả</span>
        </label>
        <label v-for="child in category.children" :key="child.id" class="category-filter-option">
          <input type="checkbox" :checked="selectedSubCategory === child.slug" :aria-label="child.name" @change="emit('toggleSubCategory', child.slug)">
          <span class="category-checkbox" aria-hidden="true" />
          <span class="category-filter-option-label">{{ child.name }}</span>
          <small v-if="child.product_count !== undefined">({{ child.product_count }})</small>
        </label>
      </div>
    </section>

    <CategoryBrandFilter :brands="filters.brands" :selected="selectedBrands" @toggle="emit('toggleBrand', $event)" />

    <CategoryPriceFilter :min="minPrice" :max="maxPrice" :range="filters.price_range" :presets="pricePresets" @apply="handlePriceApply" />

    <section class="category-filter-section category-filter-stock">
      <label class="category-filter-option">
        <input type="checkbox" :checked="inStock" aria-label="Chỉ hiện sản phẩm còn hàng" @change="emit('toggleStock')">
        <span class="category-checkbox" aria-hidden="true" />
        <span class="category-filter-option-label">Còn hàng</span>
      </label>
    </section>

    <CategoryFilterGroup
      v-for="group in filters.groups"
      :key="group.id"
      :group="group"
      :selected="dynamicFilters[group.slug] || []"
      :collapsed="Boolean(collapsedGroups[group.slug])"
      @toggle="emit('toggleDynamic', group.slug, $event)"
      @toggle-collapse="emit('toggleGroup', group.slug)"
    />

    <section v-for="spec in filters.specs" :key="spec.key_id" class="category-filter-section">
      <button type="button" class="category-filter-heading" :aria-expanded="!collapsedGroups[`spec_${spec.key_id}`]" @click="emit('toggleGroup', `spec_${spec.key_id}`)">
        <span>{{ spec.label }}<small v-if="spec.unit"> ({{ spec.unit }})</small></span>
        <svg :class="{ 'is-collapsed': collapsedGroups[`spec_${spec.key_id}`] }" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m6 9 6 6 6-6" /></svg>
      </button>
      <div v-show="!collapsedGroups[`spec_${spec.key_id}`]" class="category-filter-options">
        <label v-for="value in spec.values" :key="value" class="category-filter-option">
          <input type="checkbox" :checked="(specFilters[`spec_${spec.key_id}`] || []).includes(value)" :aria-label="`${spec.label}: ${value}`" @change="emit('toggleSpec', `spec_${spec.key_id}`, value)">
          <span class="category-checkbox" aria-hidden="true" />
          <span class="category-filter-option-label">{{ value }}{{ spec.unit ? ` ${spec.unit}` : '' }}</span>
        </label>
      </div>
    </section>

    <button type="button" class="category-filter-clear" @click="emit('clear')">Xóa tất cả bộ lọc</button>
  </aside>
</template>
