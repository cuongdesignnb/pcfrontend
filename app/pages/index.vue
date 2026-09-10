<script setup lang="ts">
import { publicAbsoluteUrl, serializeJsonLd } from '~/composables/useSeoDocument'

const { data: homepage } = await useHomepage()
const {
  siteName,
  siteLogo,
  siteHotline,
  socialFacebook,
  socialYoutube,
  socialTiktok,
  socialZalo,
  socialMessenger,
  socialInstagram,
  seoTitle,
  seoDescription,
  seoKeywords,
  seoOgImage,
  heroAutoplay,
  heroInterval,
} = useSettings()

const payload = computed(() => homepage.value)

const { origin, canonicalUrl } = useSeoDocument(() => ({
  title: seoTitle.value || siteName.value,
  description: seoDescription.value,
  path: '/',
  image: seoOgImage.value || siteLogo.value,
  robots: 'index,follow',
}))

useSeoMeta({ keywords: () => seoKeywords.value })

useHead(() => {
  if (!canonicalUrl.value) return {}
  const logo = publicAbsoluteUrl(origin.value, siteLogo.value || seoOgImage.value)
  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    name: siteName.value,
    url: canonicalUrl.value,
    logo: logo ? { '@type': 'ImageObject', url: logo } : undefined,
  }
  const sameAs = [
    socialFacebook.value,
    socialYoutube.value,
    socialTiktok.value,
    socialZalo.value,
    socialMessenger.value,
    socialInstagram.value,
  ].filter(Boolean)
  if (sameAs.length) organization.sameAs = sameAs
  if (siteHotline.value) {
    organization.contactPoint = {
      '@type': 'ContactPoint',
      telephone: siteHotline.value,
      contactType: 'customer service',
      areaServed: 'VN',
      availableLanguage: 'vi',
    }
  }
  const website = {
    '@type': 'WebSite',
    name: siteName.value,
    url: canonicalUrl.value,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin.value}/san-pham?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  return { script: [{ key: 'homepage-jsonld', type: 'application/ld+json', innerHTML: serializeJsonLd({ '@context': 'https://schema.org', '@graph': [organization, website] }) }] }
})
</script>

<template>
  <div class="homepage">
    <HomeHero
      :hero-banners="payload.hero_banners"
      :sidebar-banners="payload.sidebar_banners"
      :category-sidebar="payload.category_sidebar"
      :autoplay="heroAutoplay"
      :interval="heroInterval"
    />
    <HomeServiceStrip />
    <HomeFeaturedCategories :categories="payload.featured_categories" />
    <HomeFlashSale
      :enabled="payload.flash_sale.enabled"
      :ends-at="payload.flash_sale.ends_at"
      :products="payload.flash_sale.products"
    />
    <HomeTabbedProducts :best-sellers="payload.best_sellers" />
    <HomeCategorySections :sections="payload.category_sections ?? []" />
    <HomePcBuilderBanner :banner="payload.pc_builder_banner" />
    <HomeFeatureColumns
      :combo-banners="payload.combo_banners"
      :setup-banners="payload.setup_banners"
      :accessories="payload.featured_accessories"
    />
    <HomeNews :posts="payload.posts" />
    <HomeTestimonials :testimonials="payload.testimonials" />
  </div>
</template>
