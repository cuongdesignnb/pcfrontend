<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'
import { categoryUrl } from '~/utils/urls'

const props = defineProps<{
  products: ProductCard[]
  categorySlug: string
}>()
</script>

<template>
  <section v-if="products.length" class="category-recommendations" aria-labelledby="category-recommendations-title">
    <div class="category-section-heading">
      <h2 id="category-recommendations-title">Sản phẩm gợi ý cho bạn</h2>
      <NuxtLink :to="categoryUrl({ slug: categorySlug })">Xem tất cả <span aria-hidden="true">→</span></NuxtLink>
    </div>
    <div class="category-recommendation-track">
      <ProductCard v-for="product in props.products" :key="product.id" :product="product" compact />
    </div>
  </section>
</template>
