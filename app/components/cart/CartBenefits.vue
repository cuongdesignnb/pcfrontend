<script setup lang="ts">
import type { CartBenefit } from '~/types/cart'

defineProps<{ benefits: CartBenefit[] }>()
</script>

<template>
  <section v-if="benefits.length" class="cart-benefits" aria-label="Quyền lợi mua hàng">
    <div v-for="benefit in benefits" :key="benefit.key" class="cart-benefit">
      <span class="cart-benefit-icon"><CartIcon :name="benefit.icon" size="24" /></span>
      <span><strong>{{ benefit.title }}</strong><small>{{ benefit.description }}</small></span>
    </div>
  </section>
</template>
