<script setup lang="ts">
import type { AccountOrderSummary, AccountSavedBuild, AccountUser } from '~/types/account'

definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const router = useRouter()
const auth = useAuth()
const { siteName } = useSettings()
const account = useAccountDashboard()
const dashboard = computed(() => account.data.value)

const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}₫`
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'
const formatGender = (value: AccountUser['gender']) => {
  const labels: Record<Exclude<AccountUser['gender'], null>, string> = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
    prefer_not_to_say: 'Không muốn khai báo',
  }

  return value ? labels[value] : 'Chưa cập nhật'
}
const buildPartsLabel = (build: AccountSavedBuild) => build.parts.map(part => part.product.name).join(' · ')
const orderStatusClass = (order: AccountOrderSummary) => `is-${order.display_status.code}`

const loadDashboard = async () => {
  const response = await account.load()
  if (!response && !auth.isAuthenticated.value) {
    await router.replace({ path: '/dang-nhap', query: { redirect: '/tai-khoan' } })
  }
}

onMounted(() => { void loadDashboard() })

useSeoMeta({
  title: () => `Tài khoản của tôi - ${siteName.value}`,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AccountShell>
    <div class="account-dashboard-heading">
      <div>
        <span class="account-eyebrow">{{ siteName }}</span>
        <h1>Tài khoản của tôi</h1>
        <p>Quản lý thông tin cá nhân, đơn hàng và các tiện ích của bạn tại {{ siteName }}.</p>
      </div>
      <NuxtLink to="/categories" class="account-dashboard-shop-link">Tiếp tục mua sắm <CartIcon name="arrow-right" size="16" /></NuxtLink>
    </div>

    <div v-if="account.loading" class="account-loading-card" role="status">Đang tải dữ liệu tài khoản…</div>
    <div v-else-if="account.error" class="account-error-card" role="alert">
      <CartIcon name="help" size="22" /><span>{{ account.error }}</span><button type="button" @click="loadDashboard">Thử lại</button>
    </div>

    <template v-else-if="dashboard">
      <section class="account-profile-overview">
        <div class="account-greeting">
          <div class="account-greeting-avatar">
            <NuxtImg v-if="dashboard.user.avatar" :src="dashboard.user.avatar" :alt="dashboard.user.name" width="96" height="96" />
            <span v-else>{{ dashboard.user.name.charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <span class="account-greeting-label">Thành viên {{ siteName }}</span>
            <h2>Xin chào, {{ dashboard.user.name }}!</h2>
            <p>Cảm ơn bạn đã đồng hành cùng {{ siteName }}.</p>
            <small v-if="dashboard.user.default_address">Địa chỉ mặc định: {{ dashboard.user.default_address.full_address }}</small>
            <small v-else>Thêm địa chỉ để lần mua hàng sau được thuận tiện hơn.</small>
          </div>
        </div>
        <div class="account-stat-grid">
          <NuxtLink to="/tai-khoan/don-hang" class="account-stat-card">
            <span class="account-stat-icon is-blue"><CartIcon name="receipt" size="20" /></span>
            <strong>{{ dashboard.stats.orders }}</strong><small>Đơn hàng</small><em>Xem chi tiết <CartIcon name="arrow-right" size="13" /></em>
          </NuxtLink>
          <NuxtLink to="/tai-khoan/yeu-thich" class="account-stat-card">
            <span class="account-stat-icon is-pink"><CartIcon name="heart" size="20" /></span>
            <strong>{{ dashboard.stats.wishlist }}</strong><small>Sản phẩm yêu thích</small><em>Xem ngay <CartIcon name="arrow-right" size="13" /></em>
          </NuxtLink>
          <NuxtLink to="/tai-khoan/cau-hinh" class="account-stat-card">
            <span class="account-stat-icon is-orange"><CartIcon name="settings" size="20" /></span>
            <strong>{{ dashboard.stats.saved_builds }}</strong><small>Cấu hình đã lưu</small><em>Xem ngay <CartIcon name="arrow-right" size="13" /></em>
          </NuxtLink>
        </div>
      </section>

      <NuxtLink v-if="dashboard.banner" :to="dashboard.banner.link || '/categories'" class="account-dashboard-banner">
        <NuxtImg v-if="dashboard.banner.image" :src="dashboard.banner.image" :alt="dashboard.banner.title || siteName" width="1200" height="130" />
        <span v-if="dashboard.banner.badge" class="account-dashboard-banner-badge">{{ dashboard.banner.badge }}</span>
        <div v-if="!dashboard.banner.image" class="account-dashboard-banner-copy"><strong>{{ dashboard.banner.title }}</strong><small>{{ dashboard.banner.description }}</small></div>
      </NuxtLink>

      <section class="account-dashboard-card account-orders-card">
        <div class="account-dashboard-card-heading"><h2><CartIcon name="receipt" size="19" /> Đơn hàng gần đây</h2><NuxtLink to="/tai-khoan/don-hang">Xem tất cả <CartIcon name="arrow-right" size="14" /></NuxtLink></div>
        <div v-if="!dashboard.recent_orders.length" class="account-empty-state"><CartIcon name="receipt" size="30" /><h3>Bạn chưa có đơn hàng nào</h3><p>Đơn hàng sau khi đặt sẽ được cập nhật tại đây.</p><NuxtLink to="/categories" class="account-outline-button">Khám phá sản phẩm</NuxtLink></div>
        <div v-else class="account-order-table-wrap">
          <table class="account-order-table">
            <thead><tr><th>Mã đơn hàng</th><th>Ngày đặt</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              <tr v-for="order in dashboard.recent_orders" :key="order.id">
                <td><NuxtLink :to="`/tai-khoan/don-hang/${order.id}`">#{{ order.order_number }}</NuxtLink></td>
                <td>{{ formatDate(order.created_at) }}</td>
                <td class="account-order-product"><span class="account-product-thumb"><NuxtImg v-if="order.representative_item?.image?.url" :src="order.representative_item.image.url" :alt="order.representative_item.image.alt || order.representative_item.product_name" width="42" height="42" /><CartIcon v-else name="package" size="20" /></span><span>{{ order.representative_item?.product_name || 'Sản phẩm trong đơn' }}<small v-if="order.additional_item_count > 0"> + {{ order.additional_item_count }} sản phẩm khác</small></span></td>
                <td class="account-order-price">{{ formatMoney(order.total) }}</td>
                <td><span class="account-order-status" :class="orderStatusClass(order)"><i />{{ order.display_status.label }}</span></td>
                <td><NuxtLink :to="`/tai-khoan/don-hang/${order.id}`" class="account-small-outline">Xem chi tiết</NuxtLink></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="dashboard.recent_orders.length" class="account-order-cards">
          <article v-for="order in dashboard.recent_orders" :key="order.id" class="account-order-card">
            <div class="account-order-card-heading"><NuxtLink :to="`/tai-khoan/don-hang/${order.id}`">#{{ order.order_number }}</NuxtLink><span class="account-order-status" :class="orderStatusClass(order)"><i />{{ order.display_status.label }}</span></div>
            <div class="account-order-card-product"><span class="account-product-thumb"><NuxtImg v-if="order.representative_item?.image?.url" :src="order.representative_item.image.url" :alt="order.representative_item.image.alt || order.representative_item.product_name" width="48" height="48" /><CartIcon v-else name="package" size="21" /></span><span><strong>{{ order.representative_item?.product_name || 'Sản phẩm trong đơn' }}</strong><small>{{ order.items_count }} sản phẩm</small></span></div>
            <div class="account-order-card-meta"><span>Ngày đặt {{ formatDate(order.created_at) }}</span><strong class="account-order-price">{{ formatMoney(order.total) }}</strong></div>
            <NuxtLink :to="`/tai-khoan/don-hang/${order.id}`" class="account-small-outline">Xem chi tiết</NuxtLink>
          </article>
        </div>
      </section>

      <div class="account-dashboard-two-col">
        <section class="account-dashboard-card">
          <div class="account-dashboard-card-heading"><h2><CartIcon name="settings" size="19" /> Cấu hình PC đã lưu</h2><NuxtLink to="/tai-khoan/cau-hinh">Xem tất cả <CartIcon name="arrow-right" size="14" /></NuxtLink></div>
          <div v-if="!dashboard.saved_builds.length" class="account-empty-state account-empty-state--small"><CartIcon name="settings" size="27" /><p>Bạn chưa lưu cấu hình nào.</p><NuxtLink to="/cau-hinh" class="account-outline-button">Tạo cấu hình</NuxtLink></div>
          <div v-else class="account-build-list">
            <article v-for="build in dashboard.saved_builds" :key="build.id" class="account-build-row">
              <div class="account-build-preview"><NuxtImg v-for="image in build.preview_images.slice(0, 2)" :key="image" :src="image" :alt="build.name" width="58" height="58" /><CartIcon v-if="!build.preview_images.length" name="settings" size="25" /></div>
              <div class="account-build-copy"><strong>{{ build.name }}</strong><small>{{ buildPartsLabel(build) || 'Chưa có linh kiện hiện tại' }}</small><span>{{ formatMoney(build.total_price) }} · {{ build.total_tdp }}W</span></div>
              <NuxtLink :to="`/cau-hinh?saved_build=${build.id}`" class="account-small-outline">Tiếp tục</NuxtLink>
            </article>
          </div>
        </section>

        <section class="account-dashboard-card">
          <div class="account-dashboard-card-heading"><h2><CartIcon name="heart" size="19" /> Sản phẩm yêu thích</h2><NuxtLink to="/tai-khoan/yeu-thich">Xem tất cả <CartIcon name="arrow-right" size="14" /></NuxtLink></div>
          <div v-if="!dashboard.wishlist.length" class="account-empty-state account-empty-state--small"><CartIcon name="heart" size="27" /><p>Danh sách yêu thích đang trống.</p><NuxtLink to="/categories" class="account-outline-button">Khám phá sản phẩm</NuxtLink></div>
          <div v-else class="account-wishlist-grid"><ProductCard v-for="product in dashboard.wishlist" :key="product.id" :product="product" variant="compact" /></div>
        </section>
      </div>

      <section class="account-dashboard-card account-account-info">
        <div class="account-dashboard-card-heading"><h2><CartIcon name="user" size="19" /> Thông tin tài khoản</h2><NuxtLink to="/tai-khoan/ho-so" class="account-small-outline">Chỉnh sửa</NuxtLink></div>
        <div class="account-info-grid">
          <div><small>Họ và tên</small><strong>{{ dashboard.user.name }}</strong></div>
          <div><small>Số điện thoại</small><strong>{{ dashboard.user.phone || 'Chưa cập nhật' }}</strong></div>
          <div><small>Email</small><strong>{{ dashboard.user.email }}</strong></div>
          <div><small>Ngày sinh</small><strong>{{ formatDate(dashboard.user.date_of_birth) }}</strong></div>
          <div><small>Giới tính</small><strong>{{ formatGender(dashboard.user.gender) }}</strong></div>
          <div><small>Thành viên từ</small><strong>{{ formatDate(dashboard.user.created_at) }}</strong></div>
          <div><small>Tổng chi tiêu đã giao</small><strong class="is-red">{{ formatMoney(dashboard.stats.total_spent) }}</strong></div>
          <div><small>Chương trình thành viên</small><strong>Chưa áp dụng</strong></div>
        </div>
      </section>
    </template>
  </AccountShell>
</template>
