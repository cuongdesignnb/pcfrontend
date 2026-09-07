<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const router = useRouter()
const auth = useAuth()
const wishlist = useWishlist()
const user = computed(() => auth.user.value)
const recentOrders = ref<Array<Record<string, any>>>([])
const totalOrders = ref(0)
const savedBuildCount = ref(0)
const pageLoading = ref(true)
const pageError = ref('')

const initials = computed(() => {
  const name = user.value?.name?.trim() || ''
  return name ? name.charAt(0).toUpperCase() : '?'
})

const loadDashboard = async () => {
  pageLoading.value = true
  pageError.value = ''
  const currentUser = await auth.fetchUser()
  if (!currentUser) {
    await router.replace({ path: '/dang-nhap', query: { redirect: '/tai-khoan' } })
    return
  }

  try {
    const [ordersResponse, buildsResponse] = await Promise.all([
      auth.authFetch<{ orders?: Array<Record<string, any>>, meta?: { total?: number } }>(`${useRuntimeConfig().public.apiBase}/orders`),
      auth.authFetch<{ builds?: Array<Record<string, any>> }>(`${useRuntimeConfig().public.apiBase}/builder/saved`),
      wishlist.ready(),
    ])
    recentOrders.value = ordersResponse.orders ?? []
    totalOrders.value = Number(ordersResponse.meta?.total ?? recentOrders.value.length)
    savedBuildCount.value = buildsResponse.builds?.length ?? 0
  } catch {
    pageError.value = 'Không thể tải đầy đủ dữ liệu tài khoản. Vui lòng thử lại.'
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => { void loadDashboard() })

const getOrderStatusBadge = (status: string): { bg: string; text: string; label: string } => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã xác nhận' },
    processing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang xử lý' },
    shipping: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Đang giao' },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã giao' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' },
  }
  return badges[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Không rõ' }
}

const formatMoney = (value: unknown) => new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + '₫'

useSeoMeta({ title: 'Tài khoản - PC Shop', robots: 'noindex, nofollow' })
</script>

<template>
  <main class="account-page">
    <div class="pc-container account-container">
      <div class="account-layout">
        <aside class="account-sidebar">
          <div class="account-profile-card">
            <div class="account-avatar">{{ initials }}</div>
            <h1>{{ user?.name || 'Tài khoản' }}</h1>
            <p>{{ user?.email }}</p>
          </div>

          <nav class="account-nav" aria-label="Điều hướng tài khoản">
            <NuxtLink to="/tai-khoan" class="is-active"><CartIcon name="user" size="18" /><span>Tổng quan</span></NuxtLink>
            <a href="#orders"><CartIcon name="receipt" size="18" /><span>Đơn hàng</span></a>
            <NuxtLink to="/cau-hinh"><CartIcon name="settings" size="18" /><span>Cấu hình đã lưu</span></NuxtLink>
            <a href="#profile"><CartIcon name="user" size="18" /><span>Thông tin cá nhân</span></a>
            <a href="#security"><CartIcon name="lock" size="18" /><span>Bảo mật tài khoản</span></a>
            <button type="button" class="account-nav-logout" @click="auth.logout"><CartIcon name="logout" size="18" /><span>Đăng xuất</span></button>
          </nav>
        </aside>

        <section class="account-main">
          <div class="account-welcome">
            <div><span class="account-eyebrow">PC CENTER MEMBER</span><h2>Xin chào, {{ user?.name || 'bạn' }}!</h2><p>Quản lý tài khoản, theo dõi đơn hàng và lưu lại những lựa chọn công nghệ của bạn.</p></div>
            <NuxtLink to="/categories" class="account-primary-link">Tiếp tục mua sắm <CartIcon name="arrow-right" size="16" /></NuxtLink>
          </div>

          <div v-if="pageError" class="account-alert" role="alert">{{ pageError }} <button type="button" @click="loadDashboard">Thử lại</button></div>

          <div class="account-stats">
            <article><span class="account-stat-icon"><CartIcon name="receipt" size="21" /></span><div><strong>{{ pageLoading ? '—' : totalOrders }}</strong><small>Tổng đơn hàng</small></div></article>
            <article><span class="account-stat-icon"><CartIcon name="settings" size="21" /></span><div><strong>{{ pageLoading ? '—' : savedBuildCount }}</strong><small>Cấu hình đã lưu</small></div></article>
            <article><span class="account-stat-icon"><CartIcon name="heart" size="21" /></span><div><strong>{{ pageLoading ? '—' : wishlist.count }}</strong><small>Sản phẩm yêu thích</small></div></article>
          </div>

          <section id="orders" class="account-panel">
            <div class="account-panel-heading"><h2>Đơn hàng gần đây</h2><NuxtLink to="/tai-khoan#orders">Xem tất cả <CartIcon name="arrow-right" size="14" /></NuxtLink></div>
            <div v-if="pageLoading" class="account-loading">Đang tải dữ liệu tài khoản…</div>
            <div v-else-if="!recentOrders.length" class="account-empty"><CartIcon name="receipt" size="29" /><h3>Bạn chưa có đơn hàng nào</h3><p>Đơn hàng sau khi đặt sẽ được cập nhật tại đây.</p><NuxtLink to="/categories" class="account-outline-link">Khám phá sản phẩm</NuxtLink></div>
            <div v-else class="account-orders">
              <div v-for="order in recentOrders.slice(0, 5)" :key="order.id" class="account-order-row">
                <div><strong>{{ order.order_number }}</strong><small>{{ new Date(order.created_at).toLocaleDateString('vi-VN') }}</small></div>
                <div class="account-order-total"><strong>{{ formatMoney(order.total) }}</strong><span :class="[getOrderStatusBadge(order.order_status || order.status).bg, getOrderStatusBadge(order.order_status || order.status).text]">{{ getOrderStatusBadge(order.order_status || order.status).label }}</span></div>
              </div>
            </div>
          </section>

          <div class="account-detail-grid">
            <section id="profile" class="account-panel account-detail-panel"><div class="account-panel-heading"><h2>Thông tin cá nhân</h2><CartIcon name="user" size="18" /></div><p><strong>{{ user?.name }}</strong></p><p>{{ user?.email }}</p><p v-if="user?.phone">{{ user.phone }}</p><p v-else class="account-muted">Bạn chưa cập nhật số điện thoại.</p></section>
            <section id="security" class="account-panel account-detail-panel"><div class="account-panel-heading"><h2>Bảo mật tài khoản</h2><CartIcon name="lock" size="18" /></div><p>Phiên đăng nhập được bảo vệ bằng token có thời hạn và chỉ có thể truy cập dữ liệu của tài khoản này.</p><NuxtLink to="/lien-he" class="account-text-link">Cần hỗ trợ tài khoản?</NuxtLink></section>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
