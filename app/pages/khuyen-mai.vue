<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import type { ProductCard } from '~/types/product-detail'
import { getErrorStatusCode } from '~/utils/errors'

interface ProductListResponse {
  data: ProductCard[]
  meta?: { current_page: number; last_page: number; total: number }
}

interface NewsListingResponse {
  posts: NewsArticle[]
}

const config = useRuntimeConfig()
const route = useRoute()
const { siteName } = useSettings()

const pageNumber = computed(() => {
  const value = Number(route.query.page || 1)
  return Number.isInteger(value) && value > 0 ? value : 1
})

// Products whose sale price is below the regular price, biggest discount first.
const { data, status, error } = await useFetch<ProductListResponse>(`${config.public.apiBase}/products`, {
  key: () => `promotions:${pageNumber.value}`,
  query: computed(() => ({ on_sale: 1, per_page: 24, page: pageNumber.value })),
  default: () => ({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
})

if (error.value) {
  const statusCode = getErrorStatusCode(error.value, 503)
  throw createError({ statusCode: statusCode === 404 ? 404 : 503, statusMessage: 'Không thể tải sản phẩm khuyến mãi.' })
}

// Articles in the "Khuyến mãi" news category, when the shop writes any.
const { data: postData } = await useFetch<NewsListingResponse>(`${config.public.apiBase}/blog`, {
  key: 'promotions-posts',
  query: { category: 'khuyen-mai' },
  default: () => ({ posts: [] }),
})

const products = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? products.value.length)
const currentPage = computed(() => data.value?.meta?.current_page ?? 1)
const lastPage = computed(() => data.value?.meta?.last_page ?? 1)
const posts = computed(() => (pageNumber.value === 1 ? postData.value?.posts ?? [] : []).slice(0, 4))

useSeoDocument(() => ({
  title: `Khuyến mãi - ${siteName.value}`,
  description: `Laptop, linh kiện và phụ kiện đang giảm giá tại ${siteName.value}.`,
  path: pageNumber.value > 1 ? `/khuyen-mai?page=${pageNumber.value}` : '/khuyen-mai',
  robots: Object.keys(route.query).some(key => key !== 'page') ? 'noindex,follow' : 'index,follow',
}))
</script>

<template>
  <div class="product-directory-page">
    <div class="pc-container">
      <nav class="directory-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Trang chủ</NuxtLink><span aria-hidden="true">/</span><span>Khuyến mãi</span>
      </nav>
      <div class="directory-heading">
        <div><span class="directory-kicker">{{ siteName }}</span><h1>Khuyến mãi</h1><p>{{ total }} sản phẩm đang giảm giá</p></div>
        <NuxtLink to="/san-pham" class="directory-heading-link">Xem tất cả sản phẩm <span aria-hidden="true">›</span></NuxtLink>
      </div>

      <section v-if="posts.length" class="promo-posts" aria-label="Tin khuyến mãi">
        <NewsArticleCard v-for="post in posts" :key="post.id" :article="post" />
      </section>

      <div v-if="status === 'pending'" class="product-directory-grid"><div v-for="index in 8" :key="index" class="product-directory-skeleton" /></div>
      <div v-else-if="products.length" class="product-directory-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" variant="homepage" /></div>
      <nav v-if="lastPage > 1" class="home-section-heading" aria-label="Phân trang sản phẩm khuyến mãi">
        <NuxtLink v-if="currentPage > 1" :to="{ path: '/khuyen-mai', query: { page: currentPage - 1 } }">Trang trước</NuxtLink>
        <span>Trang {{ currentPage }} / {{ lastPage }}</span>
        <NuxtLink v-if="currentPage < lastPage" :to="{ path: '/khuyen-mai', query: { page: currentPage + 1 } }">Trang sau</NuxtLink>
      </nav>
      <div v-if="status !== 'pending' && !products.length" class="directory-empty"><h2>Chưa có sản phẩm khuyến mãi</h2><p>Các chương trình giảm giá mới sẽ được cập nhật tại đây.</p><NuxtLink to="/san-pham" class="button button-primary">Xem sản phẩm</NuxtLink></div>
    </div>
  </div>
</template>
