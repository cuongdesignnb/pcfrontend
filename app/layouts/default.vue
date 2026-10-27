<script setup lang="ts">
// Pages that already pin their own action bar to the bottom on mobile
// (product detail, cart, checkout, PC builder) opt out via page meta.
const route = useRoute()
const showMobileBottomBar = computed(() => route.meta.hideMobileBottomBar !== true)
</script>

<template>
  <div class="min-h-screen bg-white text-[var(--pc-text)]" :class="showMobileBottomBar ? 'has-mobile-bottom-bar' : 'has-page-action-bar'">
    <SiteHeader />
    <main class="min-h-[60vh]"><slot /></main>
    <SiteFooter />
    <MobileBottomBar v-if="showMobileBottomBar" />
    <DesktopContactDock />
  </div>
</template>
