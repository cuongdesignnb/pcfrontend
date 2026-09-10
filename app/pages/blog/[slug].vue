<script setup lang="ts">
import { getErrorStatusCode, hasErrorStatusCode } from '~/utils/errors'

interface LegacyBlogResponse {
  post?: {
    seo?: {
      canonical_path?: string | null
    }
  } | null
}

const config = useRuntimeConfig()
const route = useRoute()
const rawSlug = route.params.slug
const slug = Array.isArray(rawSlug) ? String(rawSlug[0] || '') : String(rawSlug || '')

if (!slug) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bài viết.' })
}

try {
  const data = await $fetch<LegacyBlogResponse>(`${config.public.apiBase}/blog/${encodeURIComponent(slug)}`)
  const target = data.post?.seo?.canonical_path
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Bài viết chưa có URL công khai.' })
  }

  await navigateTo({ path: target, query: route.query }, { redirectCode: 301 })
} catch (error: unknown) {
  if (hasErrorStatusCode(error)) throw error

  const statusCode = getErrorStatusCode(error)
  throw createError({
    statusCode: statusCode === 404 ? 404 : 503,
    statusMessage: statusCode === 404 ? 'Bài viết không tồn tại.' : 'Không thể xác thực URL bài viết.',
  })
}
</script>
