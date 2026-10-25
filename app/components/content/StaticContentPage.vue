<script setup lang="ts">
import type { PublicPage } from '~/types/public-page'
import { serializeJsonLd, useSeoDocument } from '~/composables/useSeoDocument'

const props = defineProps<{ page: PublicPage }>()
const { siteName } = useSettings()
const title = computed(() => props.page.meta_title?.trim()
  || [props.page.title, siteName.value?.trim()].filter(Boolean).join(' - '))
const description = computed(() => props.page.meta_description?.trim()
  || props.page.body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 160))
const { canonicalUrl } = useSeoDocument(() => ({
  title: title.value, description: description.value,
  path: props.page.canonical_path, type: 'website',
}))

useHead(() => ({
  script: [{
    key: 'static-page-jsonld', type: 'application/ld+json',
    innerHTML: serializeJsonLd({
      '@context': 'https://schema.org', '@type': 'WebPage',
      name: props.page.title,
      ...(canonicalUrl.value ? { url: canonicalUrl.value } : {}),
      ...(description.value ? { description: description.value } : {}),
      ...(props.page.updated_at && !Number.isNaN(Date.parse(props.page.updated_at))
        ? { dateModified: props.page.updated_at } : {}),
    }),
  }],
}))
</script>

<template>
  <main class="static-page">
    <nav class="static-page-breadcrumb" aria-label="Điều hướng trang">
      <NuxtLink to="/">Trang chủ</NuxtLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ page.title }}</span>
    </nav>
    <article class="static-page-article">
      <h1>{{ page.title }}</h1>
      <!-- The public Pages API sanitizes CMS HTML before it reaches v-html. -->
      <div class="static-page-body" v-html="page.body" />
    </article>
  </main>
</template>

<style scoped>
.static-page { max-width: 1180px; margin: 0 auto; padding: 24px 20px 56px; color: #172c55; }
.static-page-breadcrumb { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 22px; font-size: 14px; overflow-wrap: anywhere; }
.static-page-breadcrumb a { color: #1261db; }
.static-page-article { padding: 32px; border: 1px solid #e1e7ef; border-radius: 12px; background: #fff; }
.static-page h1 { margin: 0 0 26px; font-size: clamp(24px, 3vw, 34px); line-height: 1.3; font-weight: 700; overflow-wrap: anywhere; }
.static-page-body { font-size: 16px; line-height: 1.8; overflow-wrap: anywhere; }
.static-page-body :deep(p), .static-page-body :deep(ul), .static-page-body :deep(ol), .static-page-body :deep(figure) { margin: 0 0 16px; }
.static-page-body :deep(h2), .static-page-body :deep(h3), .static-page-body :deep(h4) { margin: 24px 0 12px; font-weight: 700; line-height: 1.4; }
.static-page-body :deep(h2) { font-size: 24px; }
.static-page-body :deep(h3) { font-size: 20px; }
.static-page-body :deep(a) { color: #1261db; text-decoration: underline; }
.static-page-body :deep(ul) { list-style: disc; padding-left: 24px; }
.static-page-body :deep(ol) { list-style: decimal; padding-left: 24px; }
.static-page-body :deep(img), .static-page-body :deep(iframe) { max-width: 100%; }
.static-page-body :deep(img) { height: auto; }
.static-page-body :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 20px 0; }
.static-page-body :deep(th), .static-page-body :deep(td) { padding: 10px 14px; border: 1px solid #dde4ed; text-align: left; }
.static-page-body :deep(pre) { max-width: 100%; overflow-x: auto; }
.static-page-body :deep(blockquote) { margin: 18px 0; padding: 10px 20px; border-left: 3px solid #1261db; background: #f5f8ff; }
@media (max-width: 640px) { .static-page { padding: 16px 12px 32px; } .static-page-article { padding: 20px 16px; } }
</style>
