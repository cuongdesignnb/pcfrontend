<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'

defineProps<{ products: ProductCard[] }>()
</script>

<template>
  <section v-if="products.length" class="cart-product-section">
    <div class="cart-product-heading"><div><h2><CartIcon name="shield" size="21" /> Phụ kiện bảo vệ &amp; dịch vụ nên mua cùng</h2><p>Chăm sóc trọn vẹn cho bộ máy của bạn</p></div><NuxtLink to="/products">Xem tất cả <CartIcon name="arrow-right" size="14" /></NuxtLink></div>
    <div class="cart-product-track cart-product-track--accessories">
      <ProductCard v-for="product in products" :key="product.id" :product="product" compact show-action />
    </div>
  </section>
</template>
