<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'
import { getErrorStatusCode } from '~/utils/errors'

interface ProductListResponse {
  data: ProductCard[]
  meta?: { current_page: number; last_page: number; total: number }
}

const config = useRuntimeConfig()
const route = useRoute()
const { siteName } = useSettings()

function queryString(key: string): string | undefined {
  const value = route.query[key]
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

const params = computed(() => ({
  search: queryString('search'),
  category: queryString('category'),
  brand: queryString('brand'),
  component_type: queryString('component_type'),
  min_price: queryString('min_price'),
  max_price: queryString('max_price'),
  per_page: 24,
  page: queryString('page') || 1,
  sort: 'created_at',
  order: 'desc',
}))

const { data, status, error } = await useFetch<ProductListResponse>(`${config.public.apiBase}/products`, {
  params,
  watch: [params],
  default: () => ({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
})

if (error.value) {
  const statusCode = getErrorStatusCode(error.value, 503)
  throw createError({ statusCode: statusCode === 404 ? 404 : 503, statusMessage: 'Không thể tải danh sách sản phẩm.' })
}

const products = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? products.value.length)
const title = computed(() => {
  const search = queryString('search')
  const category = queryString('category')
  if (search) return `Tìm kiếm: ${search}`
  if (category) return `Sản phẩm ${category.replaceAll('-', ' ')}`
  return 'Tất cả sản phẩm'
})
const hasVariantQuery = computed(() => ['search', 'category', 'brand', 'component_type', 'min_price', 'max_price', 'sort', 'order'].some(key => Boolean(queryString(key))))
const pageNumber = computed(() => Math.max(1, Number(queryString('page') || 1) || 1))
const canonicalPath = computed(() => pageNumber.value > 1 && !hasVariantQuery.value ? `/san-pham?page=${pageNumber.value}` : '/san-pham')

useSeoDocument(() => ({
  title: `${title.value} - ${siteName.value}`,
  description: `Danh sách sản phẩm PC, laptop và linh kiện tại ${siteName.value}.`,
  path: canonicalPath.value,
  robots: hasVariantQuery.value ? 'noindex,follow' : 'index,follow',
}))
</script>

<template>
  <div class="product-directory-page">
    <div class="pc-container">
      <nav class="directory-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Trang chủ</NuxtLink><span aria-hidden="true">/</span><span>{{ title }}</span>
      </nav>
      <div class="directory-heading">
        <div><span class="directory-kicker">{{ siteName }}</span><h1>{{ title }}</h1><p>{{ total }} sản phẩm phù hợp</p></div>
        <NuxtLink to="/danh-muc" class="directory-heading-link">Xem danh mục <span aria-hidden="true">›</span></NuxtLink>
      </div>
      <div v-if="status === 'pending'" class="product-directory-grid"><div v-for="index in 8" :key="index" class="product-directory-skeleton" /></div>
      <div v-else-if="products.length" class="product-directory-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" variant="homepage" /></div>
      <nav v-if="(data?.meta?.last_page ?? 1) > 1" class="home-section-heading" aria-label="Phân trang sản phẩm">
        <NuxtLink v-if="(data?.meta?.current_page ?? 1) > 1" :to="{ path: '/san-pham', query: { ...route.query, page: (data?.meta?.current_page ?? 1) - 1 } }">Trang trước</NuxtLink>
        <span>Trang {{ data?.meta?.current_page }} / {{ data?.meta?.last_page }}</span>
        <NuxtLink v-if="(data?.meta?.current_page ?? 1) < (data?.meta?.last_page ?? 1)" :to="{ path: '/san-pham', query: { ...route.query, page: (data?.meta?.current_page ?? 1) + 1 } }">Trang sau</NuxtLink>
      </nav>
      <div v-if="status !== 'pending' && !products.length" class="directory-empty"><h2>Không tìm thấy sản phẩm</h2><p>Thử tìm kiếm với từ khóa khác hoặc xem toàn bộ danh mục.</p><NuxtLink to="/danh-muc" class="button button-primary">Xem danh mục</NuxtLink></div>
    </div>
  </div>
</template>
