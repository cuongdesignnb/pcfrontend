<script setup lang="ts">
// Fetch site settings (logo, favicon, etc.) on app init
const { fetchSettings, siteFavicon, getString } = useSettings()
await fetchSettings()
useSiteTracking()

const route = useRoute()
const privateRoots = new Set([
  'api', 'admin', 'payment', 'payments', 'auth', 'dang-nhap', 'dang-ky',
  'quen-mat-khau', 'tai-khoan', 'gio-hang', 'thanh-toan', 'don-hang', 'yeu-thich', 'cau-hinh',
  'cart', 'checkout', 'orders', 'account', 'wishlist', 'configurator', 'tim-kiem', 'search',
])
const isPrivateRoute = computed(() => {
  const firstSegment = route.path.split('/').filter(Boolean)[0] || ''
  return privateRoots.has(firstSegment)
})

// Search Console "HTML tag" verification: the admin pastes either the
// content value or the whole <meta> tag; keep only a safe token.
const googleSiteVerification = computed(() => {
  const raw = getString('google_site_verification').trim()
  const value = raw.match(/content=["']([^"']+)["']/i)?.[1] ?? raw
  return /^[\w-]{10,100}$/.test(value) ? value : undefined
})

useSeoMeta({
  robots: () => isPrivateRoute.value ? 'noindex,nofollow' : undefined,
  googleSiteVerification: () => googleSiteVerification.value,
})

// Dynamic favicon from admin settings
useHead({
  htmlAttrs: { lang: 'vi' },
  link: computed(() =>
    siteFavicon.value
      ? [{ rel: 'icon', type: 'image/png', href: siteFavicon.value }]
      : []
  ),
})
</script>

<template>
  <UApp :toaster="{ position: 'top-right', expand: true }">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
