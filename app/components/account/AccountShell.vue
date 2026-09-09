<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { siteName } = useSettings()
const accountUser = computed(() => auth.user.value)

const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || ''
  return name ? name.charAt(0).toUpperCase() : '?'
})

const navigation = [
  { label: 'Hồ sơ', to: '/tai-khoan', icon: 'user', exact: true },
  { label: 'Đơn hàng', to: '/tai-khoan/don-hang', icon: 'receipt' },
  { label: 'Cấu hình đã lưu', to: '/tai-khoan/cau-hinh', icon: 'settings' },
  { label: 'Yêu thích', to: '/tai-khoan/yeu-thich', icon: 'heart' },
  { label: 'Địa chỉ', to: '/tai-khoan/dia-chi', icon: 'location' },
  { label: 'Bảo hành', to: '/tai-khoan/bao-hanh', icon: 'shield' },
]

const isActive = (to: string, exact = false) => exact ? route.path === to : route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <div class="account-page">
    <div class="pc-container account-shell-container">
      <nav class="account-shell-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Trang chủ</NuxtLink><span>/</span><strong>Tài khoản</strong>
      </nav>

      <div class="account-shell-layout">
        <aside class="account-shell-sidebar">
          <div class="account-shell-profile">
            <div class="account-shell-avatar">
              <NuxtImg v-if="accountUser?.avatar" :src="accountUser.avatar" :alt="accountUser.name" width="72" height="72" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="account-shell-profile-copy">
              <strong>{{ accountUser?.name || 'Tài khoản' }}</strong>
              <small>{{ accountUser?.email || siteName }}</small>
            </div>
          </div>

          <nav class="account-shell-nav" aria-label="Điều hướng tài khoản">
            <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ 'is-active': isActive(item.to, item.exact) }">
              <CartIcon :name="item.icon" size="18" /><span>{{ item.label }}</span>
            </NuxtLink>
            <button type="button" class="account-shell-logout" @click="auth.logout">
              <CartIcon name="logout" size="18" /><span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        <section class="account-shell-content">
          <slot />
        </section>
      </div>
    </div>
  </div>
</template>
