<script setup lang="ts">
import type { BuilderComponentType, BuilderIssue, BuilderProduct } from '~/types/pc-builder'

const props = defineProps<{
  type: BuilderComponentType
  product?: BuilderProduct
  issues?: BuilderIssue[]
  active?: boolean
}>()

const emit = defineEmits<{ change: []; remove: [] }>()
const importantSpecifications = computed(() => (props.product?.specifications || []).filter(spec => spec.value).slice(0, 2))
const error = computed(() => props.issues?.some(issue => issue.type === 'error'))
const warning = computed(() => props.issues?.some(issue => issue.type === 'warning'))
const price = computed(() => props.product?.pricing.display_price || 0)
</script>

<template>
<div class="builder-selected-row" :class="{ 'builder-selected-row--active': active, 'builder-selected-row--error': error }">
  <div class="builder-type-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.7" /><path d="M8 8h8v8H8zM2 9h2m-2 3h2m-2 3h2m16-6h2m-2 3h2m-2 3h2M9 2v2m3-2v2m3-2v2M9 20v2m3-2v2m3-2v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
  </div>
  <div class="builder-selected-type">
    <strong>{{ type.name }}<em v-if="type.is_required">*</em></strong>
  </div>

  <template v-if="product">
    <div class="builder-selected-image">
      <NuxtImg v-if="product.image?.url" :src="product.image.url" :alt="product.image.alt || product.name" width="58" height="52" loading="lazy" />
      <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5" /><path d="m7 15 3-3 2 2 2-3 3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </div>
    <div class="builder-selected-product">
      <strong>{{ product.brand?.name ? `${product.brand.name} ${product.name}` : product.name }}</strong>
      <small>{{ importantSpecifications.map(spec => `${spec.label}: ${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`).join(' · ') }}</small>
    </div>
    <div class="builder-selected-state" :class="{ 'is-warning': warning, 'is-error': error }">
      <svg v-if="!error" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <svg v-else viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" /></svg>
      <span>{{ error ? 'Lỗi' : warning ? 'Cần kiểm tra' : 'Tương thích' }}</span>
    </div>
    <strong class="builder-selected-price">{{ new Intl.NumberFormat('vi-VN').format(price) }}đ</strong>
    <button type="button" class="builder-outline-button builder-change-button" @click="emit('change')">Thay đổi</button>
    <button type="button" class="builder-icon-button" aria-label="Xóa linh kiện" @click="emit('remove')">
      <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
    </button>
  </template>

  <template v-else>
    <div class="builder-selected-empty">Chưa chọn linh kiện</div>
    <button type="button" class="builder-outline-button builder-select-button" @click="emit('change')">Chọn linh kiện</button>
  </template>
</div>
</template>
