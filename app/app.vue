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

// Favicon from admin settings replaces the bundled /favicon.ico (same key)
// and doubles as the 180px touch icon for iOS home screens.
const faviconType = (href: string) => {
  const ext = href.split(/[?#]/)[0]?.split('.').pop()?.toLowerCase()
  return ({ webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', ico: 'image/x-icon', jpg: 'image/jpeg', jpeg: 'image/jpeg' } as Record<string, string>)[ext ?? '']
}
useHead({
  htmlAttrs: { lang: 'vi' },
  link: computed(() =>
    siteFavicon.value
      ? [
          { key: 'favicon', rel: 'icon', type: faviconType(siteFavicon.value), href: siteFavicon.value },
          { key: 'apple-touch-icon', rel: 'apple-touch-icon', sizes: '180x180', href: siteFavicon.value },
        ]
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
