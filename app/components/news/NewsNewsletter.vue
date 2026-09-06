<script setup lang="ts">
const config = useRuntimeConfig()
const { siteName } = useSettings()

const email = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const message = ref('')

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }

  return 'Không thể đăng ký lúc này. Vui lòng thử lại.'
}

async function subscribe() {
  status.value = 'loading'
  message.value = ''

  try {
    const response = await $fetch<{ message: string }>(`${config.public.apiBase}/newsletter/subscribe`, {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    status.value = 'success'
    message.value = response.message
    email.value = ''
  } catch (error: unknown) {
    status.value = 'error'
    message.value = errorMessage(error)
  }
}
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
