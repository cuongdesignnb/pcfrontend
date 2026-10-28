<script setup lang="ts">
import { serializeJsonLd } from '~/composables/useSeoDocument'
import { normalizeSeoTitle } from '~/utils/seoIdentity'

const { data: homepage } = await useHomepage()
const {
  getString,
  siteName,
  siteLogo,
  seoTitle,
  seoDescription,
  seoKeywords,
  seoOgImage,
  heroAutoplay,
  heroInterval,
} = useSettings()

const payload = computed(() => homepage.value)
// One fixed H1 the shop writes in Cài đặt → SEO; banner titles are h2.
const homepageHeading = computed(() => getString('homepage_h1').trim())

const { origin, canonicalUrl } = useSeoDocument(() => ({
  title: normalizeSeoTitle(seoTitle.value || siteName.value),
  description: seoDescription.value,
  path: '/',
  image: seoOgImage.value || siteLogo.value,
  robots: 'index,follow',
}))

useSeoMeta({ keywords: () => seoKeywords.value })

const business = useBusinessSchema(origin)

useHead(() => {
  if (!canonicalUrl.value || !business.value) return {}
  const website = {
    '@type': 'WebSite',
    '@id': `${canonicalUrl.value}#website`,
    name: siteName.value,
    url: canonicalUrl.value,
    publisher: { '@id': business.value['@id'] },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin.value}/san-pham?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  return { script: [{ key: 'homepage-jsonld', type: 'application/ld+json', innerHTML: serializeJsonLd({ '@context': 'https://schema.org', '@graph': [business.value, website] }) }] }
})
</script>

<template>
  <div class="homepage">
    <h1 :class="homepageHeading ? 'home-page-heading' : 'sr-only'">{{ homepageHeading || normalizeSeoTitle(seoTitle || siteName) }}</h1>
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
