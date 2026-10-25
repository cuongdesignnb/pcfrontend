<script setup lang="ts">
import { getErrorStatusCode } from '~/utils/errors'
import { parsePublicPage } from '~/utils/publicPages'

definePageMeta({ key: route => route.path })

const route = useRoute()
const config = useRuntimeConfig()
const slug = String(route.params.category || '')
const { data, error } = await useFetch<unknown>(
  `${config.public.apiBase}/pages/${encodeURIComponent(slug)}`,
  { key: `public-page:${route.path}`, watch: false },
)

if (error.value && getErrorStatusCode(error.value, 503) !== 404) {
  throw createError({ statusCode: 503, statusMessage: 'Không thể tải trang lúc này.' })
}
const page = error.value ? null : parsePublicPage(data.value)
if (!error.value && !page) {
  throw createError({ statusCode: 503, statusMessage: 'Dữ liệu trang không hợp lệ.' })
}
if (page && route.path !== page.canonical_path) {
  await navigateTo({ path: page.canonical_path, query: route.query }, { redirectCode: 301 })
}
</script>

<template>
  <StaticContentPage v-if="page" :page="page" />
  <CategoryListingPage v-else />
</template>
