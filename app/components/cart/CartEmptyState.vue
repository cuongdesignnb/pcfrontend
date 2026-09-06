<template>
  <section class="cart-empty" aria-live="polite">
    <div class="cart-empty-icon"><CartIcon name="tag" size="38" /></div>
    <h2>Giỏ hàng của bạn đang trống</h2>
    <p>Hãy chọn sản phẩm phù hợp để bắt đầu đơn hàng của bạn.</p>
    <NuxtLink to="/" class="cart-primary-button">Tiếp tục mua sắm <CartIcon name="arrow-right" size="16" /></NuxtLink>
  </section>
</template>
