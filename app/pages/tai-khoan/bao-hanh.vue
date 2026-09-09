<script setup lang="ts">
import type { AccountWarranty } from '~/types/account'

definePageMeta({ middleware: 'auth', ssr: false })

const config = useRuntimeConfig()
const auth = useAuth()
const { siteName } = useSettings()
const warranties = ref<AccountWarranty[]>([])
const loading = ref(true)
const error = ref('')
const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

const load = async () => {
  loading.value = true
  error.value = ''
  try { const response = await auth.authFetch<{ warranties: AccountWarranty[] }>(`${config.public.apiBase}/account/warranties`); warranties.value = response.warranties } catch { error.value = 'Không thể tải thông tin bảo hành.' } finally { loading.value = false }
}

onMounted(() => { void load() })
useSeoMeta({ title: () => `Bảo hành của tôi - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Bảo hành của tôi</h1><p>Thông tin bảo hành được tính từ các sản phẩm đã giao thành công.</p></div></div>
    <div v-if="loading" class="account-loading-card">Đang tải thông tin bảo hành…</div>
    <div v-else-if="error" class="account-error-card"><CartIcon name="help" size="22" /><span>{{ error }}</span><button type="button" @click="load">Thử lại</button></div>
    <section v-else class="account-list-card"><div v-if="!warranties.length" class="account-empty-state"><CartIcon name="shield" size="31" /><h3>Chưa có dữ liệu bảo hành</h3><p>Thông tin sẽ xuất hiện sau khi đơn hàng của bạn được giao và sản phẩm có thời hạn bảo hành được xác nhận.</p><NuxtLink to="/lien-he" class="account-outline-button">Liên hệ hỗ trợ</NuxtLink></div><div v-else class="account-warranty-list"><article v-for="warranty in warranties" :key="warranty.id" class="account-warranty-row"><span class="account-product-thumb"><NuxtImg v-if="warranty.image?.url" :src="warranty.image.url" :alt="warranty.image.alt || warranty.product_name" width="58" height="58" /><CartIcon v-else name="package" size="22" /></span><div class="account-warranty-copy"><strong>{{ warranty.product_name }}</strong><span>Đơn hàng #{{ warranty.order_number }} · {{ warranty.warranty_months === null ? 'Thời hạn chưa xác định' : `${warranty.warranty_months} tháng` }}</span><span v-if="warranty.expires_at">Hiệu lực: {{ formatDate(warranty.purchased_at) }} — {{ formatDate(warranty.expires_at) }}</span><span v-else>Trạng thái bảo hành chưa xác định. Vui lòng liên hệ hỗ trợ.</span></div><span class="account-address-badge" :class="{ 'is-expired': warranty.status === 'expired', 'is-unknown': warranty.status === 'unknown' }">{{ warranty.status === 'active' ? 'Còn hiệu lực' : warranty.status === 'expired' ? 'Đã hết hạn' : 'Chưa xác định' }}</span></article></div></section>
  </AccountShell>
</template>
