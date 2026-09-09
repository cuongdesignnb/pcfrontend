<script setup lang="ts">
const auth = useAuth()
const changingPassword = ref(false)
const passwordSuccess = ref('')
const passwordError = ref('')
const password = reactive({ current_password: '', new_password: '', new_password_confirmation: '' })

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  if (password.new_password !== password.new_password_confirmation) {
    passwordError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }
  changingPassword.value = true
  try {
    await auth.authFetch(`${useRuntimeConfig().public.apiBase}/user/password`, {
      method: 'PUT',
      body: {
        current_password: password.current_password,
        password: password.new_password,
        password_confirmation: password.new_password_confirmation,
      },
    })
    password.current_password = ''
    password.new_password = ''
    password.new_password_confirmation = ''
    passwordSuccess.value = 'Mật khẩu đã được thay đổi.'
  } catch {
    passwordError.value = 'Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại và độ dài mật khẩu mới.'
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <section class="account-form-card">
    <div class="account-dashboard-card-heading"><h2><CartIcon name="lock" size="19" /> Đổi mật khẩu</h2></div>
    <div v-if="passwordSuccess" class="account-success-note">{{ passwordSuccess }}</div>
    <div v-if="passwordError" class="account-error-card account-error-card--inline"><CartIcon name="help" size="18" />{{ passwordError }}</div>
    <div class="account-form-grid">
      <div class="account-form-field account-form-field--wide"><label for="current-password">Mật khẩu hiện tại</label><input id="current-password" v-model="password.current_password" type="password" autocomplete="current-password"></div>
      <div class="account-form-field"><label for="new-password">Mật khẩu mới</label><input id="new-password" v-model="password.new_password" type="password" autocomplete="new-password"></div>
      <div class="account-form-field"><label for="new-password-confirmation">Nhập lại mật khẩu mới</label><input id="new-password-confirmation" v-model="password.new_password_confirmation" type="password" autocomplete="new-password"></div>
    </div>
    <div class="account-form-actions"><button type="button" class="account-primary-button" :disabled="changingPassword" @click="changePassword">{{ changingPassword ? 'Đang cập nhật…' : 'Đổi mật khẩu' }}</button></div>
  </section>
</template>
