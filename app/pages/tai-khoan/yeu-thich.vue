<script setup lang="ts">
import type { ProductCard } from '~/types/product-detail'

definePageMeta({ middleware: 'auth', ssr: false })

const config = useRuntimeConfig()
const auth = useAuth()
const wishlist = useWishlist()
const { siteName } = useSettings()
const products = ref<ProductCard[]>([])
const loading = ref(true)
const error = ref('')

const loadProducts = async () => {
  loading.value = true
  error.value = ''
  await wishlist.ready()
  const ids = [...wishlist.ids.value]
  if (!ids.length) {
    products.value = []
    loading.value = false
    return
  }
  try {
    const response = await auth.authFetch<{ products: ProductCard[] }>(`${config.public.apiBase}/products/cards`, { method: 'POST', body: { ids } })
    const byId = new Map(response.products.map(product => [product.id, product]))
    products.value = ids.map(id => byId.get(id)).filter((product): product is ProductCard => Boolean(product))
  } catch {
    error.value = 'Không thể tải danh sách yêu thích.'
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadProducts() })
watch(() => wishlist.ids.value.slice(), () => { void loadProducts() })
useSeoMeta({ title: () => `Sản phẩm yêu thích - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Sản phẩm yêu thích</h1><p>Những sản phẩm bạn đã lưu để xem lại hoặc mua sau.</p></div><NuxtLink to="/categories" class="account-dashboard-shop-link">Khám phá sản phẩm <CartIcon name="arrow-right" size="16" /></NuxtLink></div>
    <div v-if="loading" class="account-loading-card">Đang tải sản phẩm yêu thích…</div>
    <div v-else-if="error" class="account-error-card"><CartIcon name="help" size="22" /><span>{{ error }}</span><button type="button" @click="loadProducts">Thử lại</button></div>
    <section v-else class="account-list-card"><div v-if="!products.length" class="account-empty-state"><CartIcon name="heart" size="30" /><h3>Danh sách yêu thích đang trống</h3><p>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại lựa chọn của bạn.</p><NuxtLink to="/categories" class="account-outline-button">Khám phá sản phẩm</NuxtLink></div><div v-else class="account-full-wishlist-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" variant="category" /></div></section>
  </AccountShell>
</template>
