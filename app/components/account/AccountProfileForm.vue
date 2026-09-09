<script setup lang="ts">
const auth = useAuth()
const accountUser = computed(() => auth.user.value)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({
  name: '',
  phone: '',
  date_of_birth: '',
  gender: '' as '' | 'male' | 'female' | 'other' | 'prefer_not_to_say',
})

const applyUser = (user: NonNullable<typeof auth.user.value>) => {
  form.name = user.name
  form.phone = user.phone || ''
  form.date_of_birth = user.date_of_birth || ''
  form.gender = user.gender || ''
}

const loadProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const user = await auth.fetchUser()
    if (user) applyUser(user)
  } catch {
    error.value = 'Không thể tải thông tin tài khoản.'
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const response = await auth.authFetch<{ user: NonNullable<typeof auth.user.value> }>(`${useRuntimeConfig().public.apiBase}/user/profile`, {
      method: 'PUT',
      body: {
        name: form.name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
      },
    })
    if (response.user) applyUser(response.user)
    // Refresh the auth source of truth so the shell/header reflects the saved profile immediately.
    const freshUser = await auth.fetchUser()
    if (freshUser) applyUser(freshUser)
    success.value = 'Thông tin tài khoản đã được cập nhật.'
  } catch {
    error.value = 'Không thể cập nhật thông tin. Vui lòng kiểm tra lại dữ liệu.'
  } finally {
    saving.value = false
  }
}

onMounted(() => { void loadProfile() })
</script>

<template>
  <div v-if="loading" class="account-loading-card">Đang tải thông tin…</div>
  <div v-else class="account-form-card">
    <div v-if="success" class="account-success-note">{{ success }}</div>
    <div v-if="error" class="account-error-card account-error-card--inline"><CartIcon name="help" size="18" />{{ error }}</div>
    <div class="account-form-grid">
      <div class="account-form-field"><label for="account-name">Họ và tên</label><input id="account-name" v-model="form.name" type="text" autocomplete="name"></div>
      <div class="account-form-field"><label for="account-email">Email</label><input id="account-email" :value="accountUser?.email || ''" type="email" readonly autocomplete="email"></div>
      <div class="account-form-field"><label for="account-phone">Số điện thoại</label><input id="account-phone" v-model="form.phone" type="tel" autocomplete="tel"></div>
      <div class="account-form-field"><label for="account-birth">Ngày sinh</label><input id="account-birth" v-model="form.date_of_birth" type="date" autocomplete="bday"></div>
    <div class="account-form-field"><label for="account-gender">Giới tính</label><select id="account-gender" v-model="form.gender"><option value="">Chưa cập nhật</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option><option value="prefer_not_to_say">Không muốn khai báo</option></select></div>
    </div>
    <div class="account-form-actions"><button type="button" class="account-primary-button" :disabled="saving" @click="saveProfile">{{ saving ? 'Đang lưu…' : 'Lưu thay đổi' }}</button></div>
  </div>
</template>
