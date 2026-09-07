<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  ssr: false,
})

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const cart = useCart()
const toast = useToast()
const { siteName } = useSettings()

const form = reactive({
  email: '',
  password: '',
  remember: false,
})
const showPassword = ref(false)
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})
const redirectTarget = computed(() => getSafeRedirect(route.query.redirect))
const isCheckoutIntent = computed(() => redirectTarget.value.startsWith('/thanh-toan'))

const firstMessage = (value: unknown): string => {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

const readError = (caught: unknown): Record<string, string> => {
  if (!caught || typeof caught !== 'object') return { general: 'Đăng nhập thất bại. Vui lòng thử lại.' }
  const payload = (caught as { data?: { message?: unknown; errors?: Record<string, unknown> } }).data
  const fieldErrors = Object.fromEntries(Object.entries(payload?.errors ?? {}).map(([key, value]) => [key, firstMessage(value)]).filter(([, value]) => value))
  if (!fieldErrors.general) fieldErrors.general = firstMessage(payload?.message) || fieldErrors.email || 'Đăng nhập thất bại. Vui lòng thử lại.'
  return fieldErrors
}

const login = async () => {
  errors.value = {}
  isSubmitting.value = true
  try {
    const response = await auth.login(form.email, form.password, form.remember)
    await cart.fetchCart()
    if (response.commerce?.cart_warnings?.length) {
      toast.add({
        title: 'Giỏ hàng đã được đồng bộ',
        description: 'Một số sản phẩm đã được điều chỉnh theo tồn kho hiện tại.',
        color: 'warning',
      })
    }
    await router.replace(redirectTarget.value)
  } catch (caught) {
    errors.value = readError(caught)
  } finally {
    isSubmitting.value = false
  }
}

useSeoMeta({ title: `Đăng nhập - ${siteName.value}` })
</script>

<template>
  <main class="auth-page">
    <div class="pc-container auth-container">
      <nav class="auth-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Trang chủ</NuxtLink><span>/</span><strong>Đăng nhập</strong>
      </nav>

      <section class="auth-shell">
        <AuthPromoPanel />

        <div class="auth-form-panel">
          <div class="auth-form-heading">
            <span class="auth-eyebrow">PC CENTER MEMBER</span>
            <h1>Đăng nhập</h1>
            <p>Chào mừng bạn quay trở lại {{ siteName }}.</p>
            <small v-if="isCheckoutIntent" class="auth-intent-note">Đăng nhập để tiếp tục thanh toán và đồng bộ giỏ hàng của bạn.</small>
          </div>

          <form class="auth-form" @submit.prevent="login">
            <div v-if="errors.general" class="auth-alert" role="alert">{{ errors.general }}</div>

            <div class="auth-field">
              <label for="login-email">Email</label>
              <div class="auth-input-wrap" :class="{ 'is-invalid': errors.email }">
                <CartIcon name="mail" size="19" />
                <input id="login-email" v-model="form.email" type="email" autocomplete="email" placeholder="Nhập địa chỉ email của bạn" required :aria-invalid="Boolean(errors.email)">
              </div>
              <small v-if="errors.email" class="auth-field-error">{{ errors.email }}</small>
            </div>

            <div class="auth-field">
              <label for="login-password">Mật khẩu</label>
              <div class="auth-input-wrap" :class="{ 'is-invalid': errors.password }">
                <CartIcon name="lock" size="19" />
                <input id="login-password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Nhập mật khẩu" minlength="8" required :aria-invalid="Boolean(errors.password)">
                <button type="button" class="auth-input-action" :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" @click="showPassword = !showPassword"><CartIcon :name="showPassword ? 'eye-off' : 'eye'" size="18" /></button>
              </div>
              <small v-if="errors.password" class="auth-field-error">{{ errors.password }}</small>
            </div>

            <div class="auth-form-options">
              <label class="auth-check-label"><input v-model="form.remember" type="checkbox"><span class="auth-check-box" aria-hidden="true" /> <span>Ghi nhớ đăng nhập</span></label>
              <NuxtLink to="/lien-he" class="auth-support-link">Cần hỗ trợ đăng nhập?</NuxtLink>
            </div>

            <button type="submit" class="auth-submit-button" :disabled="isSubmitting">
              <span>{{ isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập' }}</span><CartIcon name="arrow-right" size="19" />
            </button>
          </form>

          <p class="auth-switch">Chưa có tài khoản? <NuxtLink :to="{ path: '/dang-ky', query: route.query }">Đăng ký ngay</NuxtLink></p>
        </div>
      </section>

      <AuthTrustStrip />
      <p class="auth-quote">PC Center - Đồng hành cùng bạn trên hành trình chinh phục công nghệ</p>
    </div>
  </main>
</template>
