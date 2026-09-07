<script setup lang="ts">
withDefaults(defineProps<{ current?: number }>(), { current: 2 })
</script>

<template>
  <ol class="checkout-progress" aria-label="Tiến trình thanh toán">
    <li :class="{ 'is-done': current > 1, 'is-current': current === 1 }">
      <span class="checkout-progress-dot"><CartIcon :name="current > 1 ? 'check' : 'cart'" size="15" /></span>
      <span>Giỏ hàng</span>
    </li>
    <li class="checkout-progress-line" aria-hidden="true" />
    <li :class="{ 'is-current': current === 2 }">
      <span class="checkout-progress-dot">2</span>
      <span>Thanh toán</span>
    </li>
    <li class="checkout-progress-line" aria-hidden="true" />
    <li :class="{ 'is-current': current === 3 }">
      <span class="checkout-progress-dot">3</span>
      <span>Hoàn tất</span>
    </li>
  </ol>
</template>
