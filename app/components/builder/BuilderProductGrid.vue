<script setup lang="ts">
import type { BuilderProductOption } from '~/types/pc-builder'

defineProps<{ options: BuilderProductOption[]; selectedProductId?: number; loading: boolean }>()
const emit = defineEmits<{ select: [option: BuilderProductOption]; open: [option: BuilderProductOption] }>()
</script>

<template>
<div class="builder-product-grid" aria-live="polite">
  <template v-if="loading">
    <div v-for="index in 6" :key="index" class="builder-product-skeleton" aria-hidden="true" />
  </template>
  <p v-else-if="!options.length" class="builder-product-empty">Không có sản phẩm phù hợp với bộ lọc hiện tại.</p>
  <template v-else>
    <BuilderProductCard
      v-for="option in options"
      :key="option.product.id"
      :option="option"
      :selected="selectedProductId === option.product.id"
      @select="emit('select', $event)"
      @open="emit('open', $event)"
    />
  </template>
</div>
</template>
