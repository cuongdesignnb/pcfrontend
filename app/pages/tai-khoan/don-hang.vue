<script setup lang="ts">
import type { AccountOrderSummary } from '~/types/account'

definePageMeta({ middleware: 'auth', ssr: false })

const config = useRuntimeConfig()
const auth = useAuth()
const { siteName } = useSettings()
const orders = ref<AccountOrderSummary[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(true)
const error = ref('')

const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'
const statusClass = (order: AccountOrderSummary) => `is-${order.display_status.code}`

const loadOrders = async (requestedPage = 1) => {
  loading.value = true
  error.value = ''
  try {
    const response = await auth.authFetch<{ orders: AccountOrderSummary[]; meta: { current_page: number; last_page: number } }>(`${config.public.apiBase}/account/orders?page=${requestedPage}`)
    orders.value = response.orders
    page.value = response.meta.current_page
    lastPage.value = response.meta.last_page
  } catch {
    error.value = 'Không thể tải danh sách đơn hàng.'
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadOrders() })
useSeoMeta({ title: () => `Đơn hàng của tôi - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Đơn hàng của tôi</h1><p>Theo dõi trạng thái và xem lại lịch sử mua hàng của bạn.</p></div><NuxtLink to="/categories" class="account-dashboard-shop-link">Tiếp tục mua sắm <CartIcon name="arrow-right" size="16" /></NuxtLink></div>
    <div v-if="loading" class="account-loading-card">Đang tải đơn hàng…</div>
    <div v-else-if="error" class="account-error-card"><CartIcon name="help" size="22" /><span>{{ error }}</span><button type="button" @click="loadOrders(page)">Thử lại</button></div>
    <section v-else class="account-list-card">
      <div v-if="!orders.length" class="account-empty-state"><CartIcon name="receipt" size="30" /><h3>Bạn chưa có đơn hàng nào</h3><p>Đơn hàng sau khi đặt sẽ được cập nhật tại đây.</p><NuxtLink to="/categories" class="account-outline-button">Khám phá sản phẩm</NuxtLink></div>
      <div v-else class="account-order-table-wrap">
        <table class="account-order-table">
          <thead><tr><th>Mã đơn hàng</th><th>Ngày đặt</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td><NuxtLink :to="`/tai-khoan/don-hang/${order.id}`">#{{ order.order_number }}</NuxtLink></td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td class="account-order-product"><span class="account-product-thumb"><NuxtImg v-if="order.representative_item?.image?.url" :src="order.representative_item.image.url" :alt="order.representative_item.image.alt || order.representative_item.product_name" width="42" height="42" /><CartIcon v-else name="package" size="20" /></span><span>{{ order.representative_item?.product_name || 'Sản phẩm trong đơn' }}<small>{{ order.items_count }} sản phẩm</small></span></td>
              <td class="account-order-price">{{ formatMoney(order.total) }}</td>
              <td><span class="account-order-status" :class="statusClass(order)"><i />{{ order.display_status.label }}</span></td>
              <td><NuxtLink :to="`/tai-khoan/don-hang/${order.id}`" class="account-small-outline">Xem chi tiết</NuxtLink></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="orders.length" class="account-order-cards">
        <article v-for="order in orders" :key="order.id" class="account-order-card">
          <div class="account-order-card-heading"><NuxtLink :to="`/tai-khoan/don-hang/${order.id}`">#{{ order.order_number }}</NuxtLink><span class="account-order-status" :class="statusClass(order)"><i />{{ order.display_status.label }}</span></div>
          <div class="account-order-card-product"><span class="account-product-thumb"><NuxtImg v-if="order.representative_item?.image?.url" :src="order.representative_item.image.url" :alt="order.representative_item.image.alt || order.representative_item.product_name" width="48" height="48" /><CartIcon v-else name="package" size="21" /></span><span><strong>{{ order.representative_item?.product_name || 'Sản phẩm trong đơn' }}</strong><small>{{ order.items_count }} sản phẩm</small></span></div>
          <div class="account-order-card-meta"><span>Ngày đặt {{ formatDate(order.created_at) }}</span><strong class="account-order-price">{{ formatMoney(order.total) }}</strong></div>
          <NuxtLink :to="`/tai-khoan/don-hang/${order.id}`" class="account-small-outline">Xem chi tiết</NuxtLink>
        </article>
      </div>
      <div v-if="lastPage > 1" class="account-pagination"><button type="button" :disabled="page <= 1" @click="loadOrders(page - 1)">‹</button><button v-for="number in lastPage" :key="number" type="button" :class="{ 'is-active': number === page }" @click="loadOrders(number)">{{ number }}</button><button type="button" :disabled="page >= lastPage" @click="loadOrders(page + 1)">›</button></div>
    </section>
  </AccountShell>
</template>
