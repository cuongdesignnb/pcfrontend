<script setup lang="ts">
import type { AccountAddress } from '~/types/account'

interface LocationOption { name: string; code: string; fullname: string }

definePageMeta({ middleware: 'auth', ssr: false })

const config = useRuntimeConfig()
const auth = useAuth()
const { siteName } = useSettings()
const addresses = ref<AccountAddress[]>([])
const provinces = ref<LocationOption[]>([])
const wards = ref<LocationOption[]>([])
const loading = ref(true)
const saving = ref(false)
const editingId = ref<number | null>(null)
const error = ref('')
const success = ref('')
const form = reactive({ label: '', full_name: '', phone: '', province_code: '', ward_code: '', district: '', street: '', is_default: false })
let suppressLocationWatch = false

const resetForm = () => {
  editingId.value = null
  Object.assign(form, { label: '', full_name: '', phone: '', province_code: '', ward_code: '', district: '', street: '', is_default: false })
  wards.value = []
}

const loadProvinces = async () => {
  provinces.value = await $fetch<LocationOption[]>(`${config.public.apiBase}/locations/provinces`)
}

const loadWards = async (provinceCode: string) => {
  wards.value = provinceCode ? await $fetch<LocationOption[]>(`${config.public.apiBase}/locations/provinces/${encodeURIComponent(provinceCode)}/wards`) : []
}

watch(() => form.province_code, async (code, oldCode) => {
  if (code === oldCode || suppressLocationWatch) return
  form.ward_code = ''
  try { await loadWards(code) } catch { wards.value = [] }
})

const loadAddresses = async () => {
  const response = await auth.authFetch<{ addresses: AccountAddress[] }>(`${config.public.apiBase}/account/addresses`)
  addresses.value = response.addresses
}

const load = async () => {
  loading.value = true
  error.value = ''
  try { await Promise.all([loadProvinces(), loadAddresses()]) } catch { error.value = 'Không thể tải danh sách địa chỉ.' } finally { loading.value = false }
}

const editAddress = async (address: AccountAddress) => {
  editingId.value = address.id
  suppressLocationWatch = true
  Object.assign(form, { label: address.label || '', full_name: address.full_name, phone: address.phone, province_code: address.province_code || '', ward_code: address.ward_code || '', district: address.district || '', street: address.street, is_default: address.is_default })
  try { await loadWards(form.province_code) } catch { wards.value = [] } finally { suppressLocationWatch = false }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const saveAddress = async () => {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const url = editingId.value ? `${config.public.apiBase}/account/addresses/${editingId.value}` : `${config.public.apiBase}/account/addresses`
    await auth.authFetch(url, { method: editingId.value ? 'PATCH' : 'POST', body: { ...form } })
    await loadAddresses()
    success.value = editingId.value ? 'Địa chỉ đã được cập nhật.' : 'Địa chỉ mới đã được thêm.'
    resetForm()
  } catch { error.value = 'Không thể lưu địa chỉ. Vui lòng chọn đúng tỉnh và xã/phường.' } finally { saving.value = false }
}

const removeAddress = async (address: AccountAddress) => {
  try { await auth.authFetch(`${config.public.apiBase}/account/addresses/${address.id}`, { method: 'DELETE' }); await loadAddresses(); if (editingId.value === address.id) resetForm() } catch { error.value = 'Không thể xóa địa chỉ này.' }
}

onMounted(() => { void load() })
useSeoMeta({ title: () => `Địa chỉ nhận hàng - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Địa chỉ nhận hàng</h1><p>Quản lý địa chỉ dùng cho các đơn hàng sau này.</p></div></div>
    <div v-if="loading" class="account-loading-card">Đang tải địa chỉ…</div>
    <template v-else>
      <div v-if="success" class="account-success-note">{{ success }}</div><div v-if="error" class="account-error-card account-error-card--inline"><CartIcon name="help" size="18" />{{ error }}</div>
      <section class="account-form-card"><div class="account-dashboard-card-heading"><h2><CartIcon name="location" size="19" /> {{ editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới' }}</h2><button v-if="editingId" type="button" class="account-secondary-button" @click="resetForm">Hủy chỉnh sửa</button></div><div class="account-form-grid"><div class="account-form-field"><label for="address-label">Nhãn địa chỉ</label><input id="address-label" v-model="form.label" type="text" placeholder="Nhà riêng, Công ty…"></div><div class="account-form-field"><label for="address-name">Người nhận</label><input id="address-name" v-model="form.full_name" type="text" autocomplete="name"></div><div class="account-form-field"><label for="address-phone">Số điện thoại</label><input id="address-phone" v-model="form.phone" type="tel" autocomplete="tel"></div><div class="account-form-field"><label for="address-province">Tỉnh/thành phố</label><select id="address-province" v-model="form.province_code"><option value="">Chọn tỉnh/thành phố</option><option v-for="province in provinces" :key="province.code" :value="province.code">{{ province.fullname || province.name }}</option></select></div><div class="account-form-field"><label for="address-ward">Xã/phường</label><select id="address-ward" v-model="form.ward_code" :disabled="!form.province_code || !wards.length"><option value="">{{ form.province_code ? 'Chọn xã/phường' : 'Chọn tỉnh trước' }}</option><option v-for="ward in wards" :key="ward.code" :value="ward.code">{{ ward.fullname || ward.name }}</option></select></div><div class="account-form-field"><label for="address-district">Quận/huyện (tùy chọn)</label><input id="address-district" v-model="form.district" type="text" placeholder="Có thể bỏ trống"></div><div class="account-form-field account-form-field--wide"><label for="address-street">Địa chỉ chi tiết</label><input id="address-street" v-model="form.street" type="text" placeholder="Số nhà, tên đường, tòa nhà…" autocomplete="street-address"></div></div><label class="account-checkbox-field"><input v-model="form.is_default" type="checkbox"><span>Đặt làm địa chỉ mặc định</span></label><div class="account-form-actions"><button type="button" class="account-primary-button" :disabled="saving" @click="saveAddress">{{ saving ? 'Đang lưu…' : (editingId ? 'Lưu địa chỉ' : 'Thêm địa chỉ') }}</button></div></section>
      <section class="account-list-card"><div class="account-dashboard-card-heading"><h2>Địa chỉ đã lưu</h2><span>{{ addresses.length }} địa chỉ</span></div><div v-if="!addresses.length" class="account-empty-state account-empty-state--small"><CartIcon name="location" size="28" /><p>Bạn chưa lưu địa chỉ nào.</p></div><div v-else class="account-address-list"><article v-for="address in addresses" :key="address.id" class="account-address-row" :class="{ 'is-default': address.is_default }"><div class="account-address-copy"><strong>{{ address.label || 'Địa chỉ nhận hàng' }} <span v-if="address.is_default" class="account-address-badge">Mặc định</span></strong><span>{{ address.full_name }} · {{ address.phone }}</span><span>{{ address.full_address }}</span></div><div class="account-row-actions"><button type="button" @click="editAddress(address)">Chỉnh sửa</button><button type="button" @click="removeAddress(address)">Xóa</button></div></article></div></section>
    </template>
  </AccountShell>
</template>
