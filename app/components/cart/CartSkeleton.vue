<template>
  <div class="cart-skeleton" aria-label="Đang tải giỏ hàng" aria-busy="true">
    <div class="cart-skeleton-main">
      <div class="cart-skeleton-line cart-skeleton-line--wide" />
      <div v-for="item in 3" :key="item" class="cart-skeleton-row">
        <span class="cart-skeleton-box" />
        <span class="cart-skeleton-copy" />
        <span class="cart-skeleton-price" />
      </div>
    </div>
    <div class="cart-skeleton-summary">
      <span class="cart-skeleton-line" />
      <span v-for="item in 4" :key="item" class="cart-skeleton-line" />
      <span class="cart-skeleton-button" />
    </div>
  </div>
</template>
