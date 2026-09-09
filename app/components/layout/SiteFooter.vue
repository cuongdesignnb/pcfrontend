<script setup lang="ts">
import type { MenuItemData } from '~/types/menu'
import { toSocialHref, toTelHref, type SocialNetwork } from '~/utils/contactLinks'

interface MenuResponse {
  menu?: { id: number; name: string; slug: string }
  items?: MenuItemData[]
}

const {
  siteLogo,
  siteLogoWhite,
  siteName,
  siteTagline,
  siteDescription,
  siteHotline,
  siteEmail,
  siteAddress,
  businessHours,
  socialFacebook,
  socialYoutube,
  socialTiktok,
  socialZalo,
  socialMessenger,
  socialInstagram,
  getString,
  getBoolean,
} = useSettings()

const config = useRuntimeConfig()
const { data: footerMenuData } = await useFetch<MenuResponse>(`${config.public.apiBase}/menus/footer`, {
  default: () => ({ menu: { id: 0, name: '', slug: '' }, items: [] }),
  key: 'storefront-footer-menu',
})

const year = new Date().getFullYear()

const footerItems = computed(() => footerMenuData.value?.items ?? [])
const footerColumns = computed(() => {
  const items = footerItems.value
  if (!items.length) return []

  if (items.some(item => item.children?.length)) {
    return items.map(item => ({
      id: item.id,
      title: item.title,
      links: item.children?.length ? item.children : [item],
    }))
  }

  return [{ id: 'footer-links', title: 'Liên kết', links: items }]
})

function resolveFooterUrl(item: MenuItemData): string {
  if (item.type === 'category' && item.category?.slug) return `/categories/${item.category.slug}`

  const replacements: Record<string, string> = {
    '/configurator': '/cau-hinh',
    '/blog': '/tin-tuc',
    '/about': '/gioi-thieu',
    '/contact': '/lien-he',
    '/warranty': '/bao-hanh',
    '/shipping': '/van-chuyen',
  }
  const path = item.url?.trim() || '/'
  return replacements[path] || path
}

const socialLinks = computed(() => [
  { key: 'facebook' as SocialNetwork, label: 'Facebook', value: socialFacebook.value, mark: 'F' },
  { key: 'youtube' as SocialNetwork, label: 'YouTube', value: socialYoutube.value, mark: 'Y' },
  { key: 'tiktok' as SocialNetwork, label: 'TikTok', value: socialTiktok.value, mark: 'T' },
  { key: 'zalo' as SocialNetwork, label: 'Zalo', value: socialZalo.value, mark: 'Z' },
  { key: 'messenger' as SocialNetwork, label: 'Messenger', value: socialMessenger.value, mark: 'M' },
  { key: 'instagram' as SocialNetwork, label: 'Instagram', value: socialInstagram.value, mark: 'I' },
].map(link => ({ ...link, href: toSocialHref(link.value, link.key) })).filter(link => link.href))

const paymentMethods = computed(() => {
  const methods: { label: string; detail: string }[] = []
  const bankName = getString('payment_bank_name')
  if (bankName) methods.push({ label: 'SePay / VietQR', detail: bankName })
  if (getBoolean('payment_cod_enabled', true)) methods.push({ label: 'COD', detail: 'Thanh toán khi nhận hàng' })
  return methods
})

const hotlineHref = computed(() => toTelHref(siteHotline.value))
const chatLink = computed(() => {
  const link = socialLinks.value.find(item => item.key === 'zalo' || item.key === 'messenger' || item.key === 'facebook')
  if (!link) return null

  return {
    href: link.href,
    label: link.key === 'zalo' ? 'Chat Zalo' : link.key === 'messenger' ? 'Chat Messenger' : 'Nhắn tin Facebook',
    mark: link.mark,
  }
})
</script>

<template>
  <footer class="site-footer">
    <div class="pc-container site-footer-grid">
      <section class="site-footer-about">
        <NuxtLink to="/" class="site-footer-logo">
          <img v-if="siteLogoWhite || siteLogo" :src="siteLogoWhite || siteLogo" :alt="siteName">
          <span v-else class="site-footer-logo-fallback">{{ siteName }}</span>
        </NuxtLink>
        <p>{{ siteDescription || siteTagline }}</p>
        <div v-if="socialLinks.length" class="site-footer-socials" aria-label="Mạng xã hội">
          <a v-for="link in socialLinks" :key="link.key" :href="link.href" target="_blank" rel="noopener noreferrer" :aria-label="link.label">
            {{ link.mark }}
          </a>
        </div>
        <div v-if="(siteHotline && hotlineHref) || siteEmail" class="site-footer-contact">
          <a v-if="siteHotline && hotlineHref" :href="hotlineHref">{{ siteHotline }}</a>
          <a v-if="siteEmail" :href="`mailto:${siteEmail}`">{{ siteEmail }}</a>
        </div>
      </section>

      <section v-for="column in footerColumns" :key="column.id">
        <h3>{{ column.title }}</h3>
        <ul>
          <li v-for="link in column.links" :key="link.id">
            <NuxtLink
              :to="resolveFooterUrl(link)"
              :target="link.target === '_blank' ? '_blank' : undefined"
              :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section>
        <h3>THANH TOÁN</h3>
        <div class="site-footer-payments">
          <span v-for="method in paymentMethods" :key="method.label" :title="method.detail">{{ method.label }}</span>
        </div>
        <p v-if="siteAddress" class="site-footer-address">{{ siteAddress }}</p>
        <p v-if="businessHours" class="site-footer-hours">{{ businessHours }}</p>
      </section>

      <FooterNewsletter />
    </div>

    <div class="pc-container site-footer-bottom">
      <span>© {{ year }} {{ siteName }}. All rights reserved.</span>
      <span v-if="siteHotline">Hotline: {{ siteHotline }}</span>
    </div>

    <a v-if="chatLink" :href="chatLink.href" target="_blank" rel="noopener noreferrer" class="site-chat-button">
      <span aria-hidden="true">{{ chatLink.mark }}</span> {{ chatLink.label }}
    </a>
  </footer>
</template>
