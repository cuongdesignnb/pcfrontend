<script setup lang="ts">
import type { MenuItemData } from '~/types/menu'
import { toSocialHref, toTelHref, type SocialNetwork } from '~/utils/contactLinks'
import { categoryUrl, storefrontPath } from '~/utils/urls'

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
  mapEmbedUrl,
  mapDirectionsUrl,
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
  if (item.type === 'category' && item.category?.slug) return categoryUrl(item.category)

  return storefrontPath(item.url)
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

// Fanpage & YouTube column: the Facebook Page Plugin of the configured page
// and a card linking to the configured YouTube channel.
const facebookPageUrl = computed(() => {
  const href = toSocialHref(socialFacebook.value, 'facebook')
  return /^https:\/\/(?:www\.|m\.|web\.)?facebook\.com\/[^/?#]+/i.test(href) ? href : ''
})
const facebookPluginSrc = computed(() => facebookPageUrl.value
  ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookPageUrl.value)}&tabs=&width=340&height=130&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`
  : '')
const youtubeHref = computed(() => toSocialHref(socialYoutube.value, 'youtube'))
const youtubeHandle = computed(() => youtubeHref.value.match(/youtube\.com\/(@[^/?#]+)/i)?.[1] ?? '')

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
        <NuxtLink to="/" class="site-footer-logo" :class="{ 'is-on-light': !siteLogoWhite && siteLogo }">
          <img v-if="siteLogoWhite || siteLogo" :src="siteLogoWhite || siteLogo" :alt="siteName">
          <span v-else class="site-footer-logo-fallback">{{ siteName }}</span>
        </NuxtLink>
        <p>{{ siteDescription || siteTagline }}</p>
        <ul class="site-footer-contact">
          <li v-if="siteAddress">{{ siteAddress }}</li>
          <li v-if="siteHotline && hotlineHref">Hotline: <a :href="hotlineHref">{{ siteHotline }}</a></li>
          <li v-if="siteEmail"><a :href="`mailto:${siteEmail}`">{{ siteEmail }}</a></li>
          <li v-if="businessHours">{{ businessHours }}</li>
        </ul>
        <div v-if="socialLinks.length" class="site-footer-socials" aria-label="Mạng xã hội">
          <a v-for="link in socialLinks" :key="link.key" :href="link.href" target="_blank" rel="noopener noreferrer" :aria-label="link.label">
            {{ link.mark }}
          </a>
        </div>
      </section>

      <div class="site-footer-links">
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
        <section v-if="paymentMethods.length">
          <h3>THANH TOÁN</h3>
          <div class="site-footer-payments">
            <span v-for="method in paymentMethods" :key="method.label" :title="method.detail">{{ method.label }}</span>
          </div>
        </section>
      </div>

      <section v-if="mapEmbedUrl" class="site-footer-map">
        <h3>BẢN ĐỒ CỬA HÀNG</h3>
        <iframe :src="mapEmbedUrl" :title="`Bản đồ ${siteName}`" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen />
        <a v-if="mapDirectionsUrl" :href="mapDirectionsUrl" target="_blank" rel="noopener noreferrer">Chỉ đường trên Google Maps <span aria-hidden="true">›</span></a>
      </section>

      <section v-if="facebookPluginSrc || youtubeHref" class="site-footer-social-embeds">
        <h3>FANPAGE &amp; YOUTUBE</h3>
        <iframe
          v-if="facebookPluginSrc"
          :src="facebookPluginSrc"
          title="Fanpage Facebook"
          class="site-footer-fanpage"
          loading="lazy"
          scrolling="no"
          allow="encrypted-media"
        />
        <a v-if="youtubeHref" :href="youtubeHref" target="_blank" rel="noopener noreferrer" class="site-footer-youtube">
          <span class="site-footer-youtube-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 7.5v9l7.5-4.5z" /></svg></span>
          <span><strong>Kênh YouTube {{ siteName }}</strong><small>{{ youtubeHandle || 'Xem video mới nhất' }}</small></span>
        </a>
        <FooterNewsletter />
      </section>
      <FooterNewsletter v-else />
    </div>

    <div class="pc-container site-footer-bottom">
      <span>© {{ year }} {{ siteName }}. All rights reserved.</span>
    </div>

    <a v-if="chatLink" :href="chatLink.href" target="_blank" rel="noopener noreferrer" class="site-chat-button">
      <span aria-hidden="true">{{ chatLink.mark }}</span> {{ chatLink.label }}
    </a>
  </footer>
</template>
