<script setup lang="ts">
import { toSocialHref, toTelHref } from '~/utils/contactLinks'

const route = useRoute()
const { siteHotline, socialZalo } = useSettings()
const { itemCount } = useCart()

const telHref = computed(() => toTelHref(siteHotline.value))
const zaloHref = computed(() => toSocialHref(socialZalo.value, 'zalo'))
const cartCount = computed(() => Math.max(0, Number(itemCount.value) || 0))

const isActive = (path: string) => (path === '/' ? route.path === '/' : route.path.startsWith(path))
</script>

<template>
  <nav class="mobile-bottom-bar" aria-label="Điều hướng nhanh">
    <NuxtLink to="/" class="mobile-bottom-bar__item" :class="{ 'is-active': isActive('/') }" :aria-current="isActive('/') ? 'page' : undefined">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 11.5 12 4l9 7.5M5.5 9.5V20h5v-5.5h3V20h5V9.5" /></svg>
      <span>Trang chủ</span>
    </NuxtLink>
    <NuxtLink to="/danh-muc" class="mobile-bottom-bar__item" :class="{ 'is-active': isActive('/danh-muc') }" :aria-current="isActive('/danh-muc') ? 'page' : undefined">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>
      <span>Danh mục</span>
    </NuxtLink>
    <a v-if="telHref" :href="telHref" class="mobile-bottom-bar__item mobile-bottom-bar__item--call">
      <span class="mobile-bottom-bar__bubble">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M5 4h3.3l1.6 4.2-2.1 1.3a11 11 0 0 0 6.7 6.7l1.3-2.1L20 15.7V19a1.5 1.5 0 0 1-1.6 1.5C10.7 20 4 13.3 3.5 5.6A1.5 1.5 0 0 1 5 4Z" /></svg>
      </span>
      <span>Gọi ngay</span>
    </a>
    <a v-if="zaloHref" :href="zaloHref" target="_blank" rel="noopener noreferrer" class="mobile-bottom-bar__item">
      <span class="mobile-bottom-bar__zalo" aria-hidden="true">Zalo</span>
      <span>Chat Zalo</span>
    </a>
    <NuxtLink to="/gio-hang" class="mobile-bottom-bar__item" :class="{ 'is-active': isActive('/gio-hang') }" :aria-label="`Giỏ hàng, ${cartCount} sản phẩm`">
      <span class="mobile-bottom-bar__icon">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
        <span v-if="cartCount > 0" class="mobile-bottom-bar__badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </span>
      <span>Giỏ hàng</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.mobile-bottom-bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 45;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 14px rgba(15, 23, 42, .08);
}

/* Same breakpoint as the layout padding in main.css (lg = 1024px). */
@media (min-width: 1024px) {
  .mobile-bottom-bar {
    display: none;
  }
}

.mobile-bottom-bar__item {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  padding: 2px 0;
  color: #475569;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
}

.mobile-bottom-bar__item svg {
  width: 22px;
  height: 22px;
}

.mobile-bottom-bar__item.is-active {
  color: var(--pc-blue, #1264d8);
}

.mobile-bottom-bar__item--call {
  color: #dc2626;
}

.mobile-bottom-bar__bubble {
  display: grid;
  width: 42px;
  height: 42px;
  margin-top: -20px;
  place-items: center;
  color: #fff;
  background: #dc2626;
  border: 3px solid #fff;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, .35);
}

.mobile-bottom-bar__zalo {
  display: grid;
  width: 24px;
  height: 22px;
  place-items: center;
  color: #fff;
  background: #0068ff;
  border-radius: 6px;
  font-size: 8.5px;
  font-weight: 800;
}

.mobile-bottom-bar__icon {
  position: relative;
  display: inline-flex;
}

.mobile-bottom-bar__badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  color: #fff;
  background: #ef4444;
  border: 2px solid #fff;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  line-height: 13px;
}
</style>
