<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'

defineProps<{ products: ProductCard[] }>()
</script>

<template>
  <div class="category-product-list" aria-label="Danh sách sản phẩm">
    <ProductCard v-for="product in products" :key="product.id" :product="product" variant="category" />
  </div>
</template>
