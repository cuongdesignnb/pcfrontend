<script setup lang="ts">
import type { MenuItemData } from '~/types/menu'
import { toTelHref } from '~/utils/contactLinks'

interface MenuResponse {
  menu?: { id: number; name: string; slug: string }
  items?: MenuItemData[]
}

const config = useRuntimeConfig()
const cart = useCart()
const mobileOpen = ref(false)
const { siteAddress, siteHotline, businessHours } = useSettings()
const hotlineHref = computed(() => toTelHref(siteHotline.value))

// Admin → Menu: "Header" is the red bar, "Sidebar" the "Danh mục sản phẩm"
// dropdown. Both fall back to the product categories until a menu exists.
const emptyMenu = () => ({ menu: { id: 0, name: '', slug: '' }, items: [] })
const [{ data: headerMenu }, { data: categoryMenu }] = await Promise.all([
  useFetch<MenuResponse>(`${config.public.apiBase}/menus/header`, { default: emptyMenu, key: 'storefront-header-menu' }),
  useFetch<MenuResponse>(`${config.public.apiBase}/menus/sidebar`, { default: emptyMenu, key: 'storefront-category-menu' }),
])

const items = computed(() => headerMenu.value?.items ?? [])
const categoryItems = computed(() => categoryMenu.value?.items ?? [])

onMounted(() => {
  void cart.fetchCart()
})
</script>

<template>
  <header class="site-header sticky top-0 z-50 bg-white">
    <div v-if="siteAddress || businessHours || siteHotline" class="header-topbar hidden lg:block">
      <div class="pc-container header-topbar-inner">
        <span>
          <template v-if="siteAddress">{{ siteAddress }}</template>
          <template v-if="siteAddress && businessHours"> · </template>
          <template v-if="businessHours">{{ businessHours }}</template>
        </span>
        <a v-if="siteHotline && hotlineHref" :href="hotlineHref">Hotline mua hàng: <strong>{{ siteHotline }}</strong></a>
      </div>
    </div>

    <HeaderMainRow @open-mobile-menu="mobileOpen = true" />

    <div class="header-navigation-shell hidden lg:block">
      <div class="pc-container flex min-h-11 items-stretch">
        <HeaderCategoryMenu :items="categoryItems" />
        <HeaderNavigation :items="items" />
      </div>
    </div>

    <HeaderMobileDrawer :open="mobileOpen" :items="items" @close="mobileOpen = false" />
  </header>
</template>
