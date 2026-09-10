<script setup lang="ts">
import { getErrorStatusCode, hasErrorStatusCode } from '~/utils/errors'

const config = useRuntimeConfig()
const route = useRoute()
const rawSlug = route.params.slug
const slug = Array.isArray(rawSlug) ? String(rawSlug[0] || '') : String(rawSlug || '')

try {
  const data = await $fetch<{ category?: { canonical_path?: string; slug?: string } }>(`${config.public.apiBase}/categories/${encodeURIComponent(slug)}`)
  const target = data.category?.canonical_path || (data.category?.slug ? `/${data.category.slug}` : null)
  if (!target) throw createError({ statusCode: 404, message: 'Danh mục chưa có URL công khai' })
  await navigateTo({ path: target, query: route.query }, { redirectCode: 301 })
} catch (error: unknown) {
  if (hasErrorStatusCode(error)) throw error
  const statusCode = getErrorStatusCode(error)
  throw createError({ statusCode: statusCode === 404 ? 404 : 503, message: statusCode === 404 ? 'Danh mục không tồn tại' : 'Không thể xác thực URL danh mục' })
}
</script>
