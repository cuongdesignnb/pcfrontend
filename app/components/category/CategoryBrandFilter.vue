<script setup lang="ts">
import type { CategoryListingBrand } from '~/types/category-listing'

const props = defineProps<{
  brands: CategoryListingBrand[]
  selected: string[]
}>()

const emit = defineEmits<{ toggle: [brandSlug: string] }>()
const search = ref('')
const showAll = ref(false)

const matchingBrands = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return props.brands
  return props.brands.filter(brand => brand.name.toLocaleLowerCase().includes(query))
})
const visibleBrands = computed(() => search.value.trim() || showAll.value
  ? matchingBrands.value
  : matchingBrands.value.slice(0, 8))
</script>

<template>
  <section v-if="brands.length" class="category-filter-section">
    <h2 class="category-filter-title">Hãng sản xuất</h2>
    <label class="category-filter-search">
      <span class="sr-only">Tìm hãng sản xuất</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="10.8" cy="10.8" r="6.8" stroke-width="1.7" /><path stroke-linecap="round" stroke-width="1.7" d="m16 16 4.4 4.4" /></svg>
      <input v-model="search" type="search" placeholder="Tìm hãng...">
    </label>
    <div class="category-filter-options category-filter-options--brands">
      <label v-for="brand in visibleBrands" :key="brand.id" class="category-filter-option">
        <input type="checkbox" :checked="selected.includes(brand.slug)" :aria-label="`Hãng ${brand.name}`" @change="emit('toggle', brand.slug)">
        <span class="category-checkbox" aria-hidden="true" />
        <span class="category-filter-option-label">{{ brand.name }}</span>
        <small v-if="brand.products_count !== undefined">({{ brand.products_count }})</small>
      </label>
      <p v-if="!visibleBrands.length" class="category-filter-empty">Không có hãng phù hợp.</p>
    </div>
    <button v-if="matchingBrands.length > 8 && !search.trim()" type="button" class="category-filter-more" @click="showAll = !showAll">
      {{ showAll ? 'Thu gọn' : 'Xem thêm' }}
      <svg :class="{ 'is-expanded': showAll }" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m6 9 6 6 6-6" /></svg>
    </button>
  </section>
</template>
