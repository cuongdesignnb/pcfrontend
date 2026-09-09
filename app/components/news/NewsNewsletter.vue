<script setup lang="ts">
const { siteName } = useSettings()
const { email, status, message, subscribe } = useNewsletterSubscription()
</script>

<template>
  <section class="news-sidebar-card news-newsletter" aria-labelledby="news-newsletter-title">
    <div class="news-sidebar-heading">
      <h2 id="news-newsletter-title">
        <span class="news-sidebar-heading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.6" />
            <path d="m4 7 8 6 8-6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        Đăng ký nhận tin công nghệ
      </h2>
    </div>
    <p>Nhận thông tin mới nhất về sản phẩm, khuyến mãi và bài viết công nghệ hay từ {{ siteName }}.</p>
    <form class="news-newsletter-form" @submit.prevent="subscribe">
      <label class="sr-only" for="news-newsletter-email">Email nhận tin</label>
      <input id="news-newsletter-email" v-model="email" type="email" required maxlength="255" placeholder="Nhập email của bạn">
      <button type="submit" :disabled="status === 'loading'">{{ status === 'loading' ? '...' : 'Đăng ký' }}</button>
    </form>
    <p v-if="message" class="news-form-message" :class="status === 'error' ? 'is-error' : 'is-success'" role="status">{{ message }}</p>
  </section>
</template>
