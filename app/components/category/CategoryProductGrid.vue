<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'

defineProps<{
  products: ProductCard[]
  loading?: boolean
}>()
</script>

<template>
  <div v-if="loading" class="category-product-grid category-product-grid--loading" aria-hidden="true">
    <div v-for="index in 8" :key="index" class="category-product-skeleton" />
  </div>
  <div v-else class="category-product-grid" aria-label="Danh sách sản phẩm">
    <ProductCard v-for="product in products" :key="product.id" :product="product" variant="category" />
  </div>
</template>
