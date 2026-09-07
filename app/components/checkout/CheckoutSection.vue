<script setup lang="ts">
defineProps<{
  number: number
  title: string
  icon: string
  description?: string
}>()
</script>

<template>
  <section class="checkout-section">
    <header class="checkout-section-heading">
      <span class="checkout-section-number">{{ number }}</span>
      <CartIcon :name="icon" size="19" />
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
    </header>
    <div class="checkout-section-body">
      <slot />
    </div>
  </section>
</template>
