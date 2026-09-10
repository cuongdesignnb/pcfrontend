<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'

defineProps<{ products: ProductCard[] }>()
</script>

<template>
  <section v-if="products.length" class="cart-product-section cart-product-section--recommendations">
    <div class="cart-product-heading"><h2>Sản phẩm gợi ý cho bạn</h2><NuxtLink to="/san-pham">Xem tất cả <CartIcon name="arrow-right" size="14" /></NuxtLink></div>
    <div class="cart-product-track">
      <ProductCard v-for="product in products" :key="product.id" :product="product" compact />
    </div>
  </section>
</template>
