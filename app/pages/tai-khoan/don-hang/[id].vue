<script setup lang="ts">
import type { AccountOrderDetail } from '~/types/account'

definePageMeta({ middleware: 'auth', ssr: false })

const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuth()
const { siteName } = useSettings()
const order = ref<AccountOrderDetail | null>(null)
const loading = ref(true)
const error = ref('')
const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

const loadOrder = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await auth.authFetch<{ order: AccountOrderDetail }>(`${config.public.apiBase}/account/orders/${encodeURIComponent(String(route.params.id))}`)
    order.value = response.order
  } catch {
    error.value = 'Không tìm thấy đơn hàng hoặc đơn hàng không thuộc tài khoản này.'
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadOrder() })
useSeoMeta({ title: () => order.value ? `Đơn hàng #${order.value.order_number} - ${siteName.value}` : `Chi tiết đơn hàng - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Chi tiết đơn hàng</h1><p>Kiểm tra sản phẩm và thông tin giao nhận của đơn hàng.</p></div><NuxtLink to="/tai-khoan/don-hang" class="account-dashboard-shop-link">Quay lại đơn hàng</NuxtLink></div>
    <div v-if="loading" class="account-loading-card">Đang tải chi tiết đơn hàng…</div>
    <div v-else-if="error" class="account-error-card"><CartIcon name="help" size="22" /><span>{{ error }}</span><button type="button" @click="loadOrder">Thử lại</button></div>
    <template v-else-if="order">
      <section class="account-list-card">
        <div class="account-dashboard-card-heading"><h2><CartIcon name="receipt" size="19" /> #{{ order.order_number }}</h2><span class="account-order-status" :class="`is-${order.display_status.code}`"><i />{{ order.display_status.label }}</span></div>
        <p class="account-detail-note">Đặt ngày {{ formatDate(order.created_at) }} · {{ order.items_count }} sản phẩm</p>
        <div class="account-detail-items">
          <div v-for="item in order.items" :key="item.id" class="account-detail-item"><span class="account-product-thumb"><NuxtImg v-if="item.image?.url" :src="item.image.url" :alt="item.image.alt || item.product_name" width="56" height="56" /><CartIcon v-else name="package" size="23" /></span><div><strong>{{ item.product_name }}</strong><small v-if="item.variant_name">{{ item.variant_name }}</small><small>SL: {{ item.quantity }} · {{ item.sku }}</small></div><strong class="account-order-price">{{ formatMoney(item.total) }}</strong></div>
        </div>
        <div class="account-detail-total"><span>Tổng cộng</span><strong>{{ formatMoney(order.total) }}</strong></div>
      </section>
      <section class="account-list-card"><div class="account-dashboard-card-heading"><h2><CartIcon name="location" size="19" /> Thông tin giao nhận</h2></div><div class="account-detail-address"><strong>{{ order.shipping.name }}</strong><span>{{ order.shipping.phone }}{{ order.shipping.email ? ` · ${order.shipping.email}` : '' }}</span><span>{{ order.shipping.address }}{{ order.shipping.ward ? `, ${order.shipping.ward}` : '' }}{{ order.shipping.city ? `, ${order.shipping.city}` : '' }}</span></div></section>
    </template>
  </AccountShell>
</template>
