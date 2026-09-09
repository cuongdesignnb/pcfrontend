<script setup lang="ts">
const { siteName } = useSettings()
const { email, status, message, subscribe } = useNewsletterSubscription()
</script>

<template>
  <div class="footer-newsletter">
    <h3>ĐĂNG KÝ NHẬN TIN</h3>
    <p>Nhận thông tin ưu đãi mới nhất từ {{ siteName }}</p>
    <form class="footer-newsletter-form" @submit.prevent="subscribe">
      <label class="sr-only" for="footer-newsletter-email">Email nhận tin</label>
      <input id="footer-newsletter-email" v-model="email" type="email" required maxlength="255" placeholder="Nhập email của bạn">
      <button type="submit" :disabled="status === 'loading'">
        {{ status === 'loading' ? '...' : 'ĐĂNG KÝ' }}
      </button>
    </form>
    <p v-if="message" class="footer-newsletter-message" :class="status === 'error' ? 'is-error' : 'is-success'" role="status">
      {{ message }}
    </p>
  </div>
</template>
