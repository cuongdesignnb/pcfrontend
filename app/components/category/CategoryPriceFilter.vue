<script setup lang="ts">
import type { CategoryListingPricePreset } from '~/types/category-listing'

const props = defineProps<{
  min: number | undefined
  max: number | undefined
  range: { min: number; max: number }
  presets: readonly CategoryListingPricePreset[]
}>()

const emit = defineEmits<{
  apply: [min: number | undefined, max: number | undefined]
}>()

const localMin = ref<number | undefined>(props.min)
const localMax = ref<number | undefined>(props.max)

watch(() => [props.min, props.max], () => {
  localMin.value = props.min
  localMax.value = props.max
})

const activePreset = computed(() => props.presets.find(preset => normalizeBoundary(preset.min) === props.min && normalizeBoundary(preset.max) === props.max)?.key)

function submit() {
  emit('apply', normalize(localMin.value), normalize(localMax.value))
}

function choose(preset: CategoryListingPricePreset) {
  const min = preset.min === null ? undefined : preset.min
  const max = preset.max === null ? undefined : preset.max
  localMin.value = min
  localMax.value = max
  emit('apply', min, max)
}

function normalize(value: number | undefined): number | undefined {
  if (value === undefined || value === null || !Number.isFinite(value) || value < 0) return undefined
  return Math.round(value)
}

function normalizeBoundary(value: number | null | undefined): number | undefined {
  return value === null || value === undefined ? undefined : value
}
</script>

<template>
  <section class="category-filter-section">
    <h2 class="category-filter-title">Khoảng giá</h2>
    <div class="category-filter-options category-filter-options--price">
      <button v-for="preset in presets" :key="preset.key" type="button" class="category-price-option" :class="{ 'is-active': activePreset === preset.key }" @click="choose(preset)">
        <span class="category-radio" aria-hidden="true" />
        <span>{{ preset.label }}</span>
      </button>
    </div>
    <div class="category-price-inputs" :class="{ 'is-visible': !presets.length }">
      <label><span class="sr-only">Giá từ</span><input v-model.number="localMin" type="number" min="0" :placeholder="range.min ? `${range.min.toLocaleString('vi-VN')}đ` : 'Từ'" @keyup.enter="submit"></label>
      <span aria-hidden="true">-</span>
      <label><span class="sr-only">Giá đến</span><input v-model.number="localMax" type="number" min="0" :placeholder="range.max ? `${range.max.toLocaleString('vi-VN')}đ` : 'Đến'" @keyup.enter="submit"></label>
      <button type="button" aria-label="Áp dụng khoảng giá" @click="submit">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m9 5 7 7-7 7" /></svg>
      </button>
    </div>
  </section>
</template>
