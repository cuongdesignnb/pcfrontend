<script setup lang="ts">
import type { AccountSavedBuild } from '~/types/account'

definePageMeta({ middleware: 'auth', ssr: false })

const config = useRuntimeConfig()
const auth = useAuth()
const { siteName } = useSettings()
const builds = ref<AccountSavedBuild[]>([])
const loading = ref(true)
const error = ref('')
const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'
const partsLabel = (build: AccountSavedBuild) => build.parts.map(part => part.product.name).join(' · ')

const loadBuilds = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await auth.authFetch<{ builds: AccountSavedBuild[] }>(`${config.public.apiBase}/account/saved-builds`)
    builds.value = response.builds
  } catch {
    error.value = 'Không thể tải cấu hình đã lưu.'
  } finally {
    loading.value = false
  }
}

const removeBuild = async (build: AccountSavedBuild) => {
  try {
    await auth.authFetch(`${config.public.apiBase}/builder/saved/${build.id}`, { method: 'DELETE' })
    builds.value = builds.value.filter(item => item.id !== build.id)
  } catch {
    error.value = 'Không thể xóa cấu hình này.'
  }
}

onMounted(() => { void loadBuilds() })
useSeoMeta({ title: () => `Cấu hình đã lưu - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Cấu hình PC đã lưu</h1><p>Tiếp tục hoàn thiện các cấu hình đã được lưu từ PC Builder.</p></div><NuxtLink to="/cau-hinh" class="account-dashboard-shop-link">Tạo cấu hình mới <CartIcon name="arrow-right" size="16" /></NuxtLink></div>
    <div v-if="loading" class="account-loading-card">Đang tải cấu hình…</div>
    <div v-else-if="error" class="account-error-card"><CartIcon name="help" size="22" /><span>{{ error }}</span><button type="button" @click="loadBuilds">Thử lại</button></div>
    <section v-else class="account-list-card">
      <div v-if="!builds.length" class="account-empty-state"><CartIcon name="settings" size="30" /><h3>Bạn chưa lưu cấu hình nào</h3><p>Chọn linh kiện và lưu lại cấu hình yêu thích của bạn.</p><NuxtLink to="/cau-hinh" class="account-outline-button">Mở PC Builder</NuxtLink></div>
      <div v-else class="account-saved-build-grid">
        <article v-for="build in builds" :key="build.id" class="account-saved-build-card"><div class="account-saved-build-preview"><NuxtImg v-for="image in build.preview_images" :key="image" :src="image" :alt="build.name" width="110" height="92" /><CartIcon v-if="!build.preview_images.length" name="settings" size="31" /></div><div class="account-saved-build-body"><div class="account-dashboard-card-heading"><h2>{{ build.name }}</h2><button type="button" class="account-icon-delete" aria-label="Xóa cấu hình" @click="removeBuild(build)"><CartIcon name="trash" size="16" /></button></div><p>{{ partsLabel(build) || 'Các linh kiện hiện tại không còn đủ thông tin.' }}</p><strong>{{ formatMoney(build.total_price) }}</strong><small>{{ build.total_tdp }}W · Lưu ngày {{ formatDate(build.created_at) }}</small><NuxtLink :to="`/cau-hinh?saved_build=${build.id}`" class="account-primary-button">Tiếp tục cấu hình <CartIcon name="arrow-right" size="15" /></NuxtLink></div></article>
      </div>
    </section>
  </AccountShell>
</template>
