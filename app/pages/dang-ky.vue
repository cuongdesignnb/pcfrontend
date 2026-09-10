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
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  terms_accepted: false,
})
const showPassword = ref(false)
const showConfirmation = ref(false)
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})
const redirectTarget = computed(() => getSafeRedirect(route.query.redirect))

const firstMessage = (value: unknown): string => {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

const readError = (caught: unknown): Record<string, string> => {
  if (!caught || typeof caught !== 'object') return { general: 'Đăng ký thất bại. Vui lòng thử lại.' }
  const payload = (caught as { data?: { message?: unknown; errors?: Record<string, unknown> } }).data
  const fieldErrors = Object.fromEntries(Object.entries(payload?.errors ?? {}).map(([key, value]) => [key, firstMessage(value)]).filter(([, value]) => value))
  if (!fieldErrors.general) fieldErrors.general = firstMessage(payload?.message) || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
  return fieldErrors
}

const register = async () => {
  errors.value = {}
  if (!form.terms_accepted) {
    errors.value.terms_accepted = 'Vui lòng đồng ý với điều khoản sử dụng và chính sách bảo mật.'
    return
  }
  if (form.password !== form.password_confirmation) {
    errors.value.password_confirmation = 'Mật khẩu xác nhận không khớp.'
    return
  }

  isSubmitting.value = true
  try {
    const response = await auth.register(form)
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

useSeoMeta({ title: `Đăng ký - ${siteName.value}` })
</script>

<template>
  <main class="auth-page auth-page--register">
    <div class="pc-container auth-container">
      <nav class="auth-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Trang chủ</NuxtLink><span>/</span><strong>Đăng ký</strong>
      </nav>

      <section class="auth-shell">
        <AuthPromoPanel />

        <div class="auth-form-panel">
          <div class="auth-form-heading">
            <span class="auth-eyebrow">PC CENTER MEMBER</span>
            <h1>Tạo tài khoản</h1>
            <p>Tham gia cộng đồng công nghệ cùng {{ siteName }}.</p>
          </div>

          <form class="auth-form auth-form--register" @submit.prevent="register">
            <div v-if="errors.general" class="auth-alert" role="alert">{{ errors.general }}</div>

            <div class="auth-field">
              <label for="register-name">Họ và tên</label>
              <div class="auth-input-wrap" :class="{ 'is-invalid': errors.name }">
                <CartIcon name="user" size="19" />
                <input id="register-name" v-model="form.name" type="text" autocomplete="name" placeholder="Nhập họ và tên" required :aria-invalid="Boolean(errors.name)">
              </div>
              <small v-if="errors.name" class="auth-field-error">{{ errors.name }}</small>
            </div>

            <div class="auth-field-row">
              <div class="auth-field">
                <label for="register-email">Email</label>
                <div class="auth-input-wrap" :class="{ 'is-invalid': errors.email }">
                  <CartIcon name="mail" size="19" />
                  <input id="register-email" v-model="form.email" type="email" autocomplete="email" placeholder="Email của bạn" required :aria-invalid="Boolean(errors.email)">
                </div>
                <small v-if="errors.email" class="auth-field-error">{{ errors.email }}</small>
              </div>
              <div class="auth-field">
                <label for="register-phone">Số điện thoại <em>(không bắt buộc)</em></label>
                <div class="auth-input-wrap" :class="{ 'is-invalid': errors.phone }">
                  <CartIcon name="phone" size="19" />
                  <input id="register-phone" v-model="form.phone" type="tel" autocomplete="tel" maxlength="20" placeholder="Số điện thoại">
                </div>
                <small v-if="errors.phone" class="auth-field-error">{{ errors.phone }}</small>
              </div>
            </div>

            <div class="auth-field-row">
              <div class="auth-field">
                <label for="register-password">Mật khẩu</label>
                <div class="auth-input-wrap" :class="{ 'is-invalid': errors.password }">
                  <CartIcon name="lock" size="19" />
                  <input id="register-password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Tối thiểu 8 ký tự" minlength="8" required :aria-invalid="Boolean(errors.password)">
                  <button type="button" class="auth-input-action" :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" @click="showPassword = !showPassword"><CartIcon :name="showPassword ? 'eye-off' : 'eye'" size="18" /></button>
                </div>
                <small v-if="errors.password" class="auth-field-error">{{ errors.password }}</small>
              </div>
              <div class="auth-field">
                <label for="register-password-confirmation">Xác nhận mật khẩu</label>
                <div class="auth-input-wrap" :class="{ 'is-invalid': errors.password_confirmation }">
                  <CartIcon name="lock" size="19" />
                  <input id="register-password-confirmation" v-model="form.password_confirmation" :type="showConfirmation ? 'text' : 'password'" autocomplete="new-password" placeholder="Nhập lại mật khẩu" minlength="8" required :aria-invalid="Boolean(errors.password_confirmation)">
                  <button type="button" class="auth-input-action" :aria-label="showConfirmation ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" @click="showConfirmation = !showConfirmation"><CartIcon :name="showConfirmation ? 'eye-off' : 'eye'" size="18" /></button>
                </div>
                <small v-if="errors.password_confirmation" class="auth-field-error">{{ errors.password_confirmation }}</small>
              </div>
            </div>

            <label class="auth-terms-label"><input v-model="form.terms_accepted" type="checkbox"><span class="auth-check-box" aria-hidden="true" /><span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của {{ siteName }}.</span></label>
            <small v-if="errors.terms_accepted" class="auth-field-error auth-terms-error">{{ errors.terms_accepted }}</small>

            <button type="submit" class="auth-submit-button" :disabled="isSubmitting">
              <span>{{ isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký ngay' }}</span><CartIcon name="arrow-right" size="19" />
            </button>
          </form>

          <p class="auth-switch">Đã có tài khoản? <NuxtLink :to="{ path: '/dang-nhap', query: route.query }">Đăng nhập</NuxtLink></p>
        </div>
      </section>

      <AuthTrustStrip />
      <p class="auth-quote">{{ siteName }} - Đồng hành cùng bạn trên hành trình chinh phục công nghệ</p>
    </div>
  </main>
</template>
