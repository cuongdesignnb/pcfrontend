<script setup lang="ts">
interface SearchProduct {
  id: number
  name: string
  slug: string
  price: number
  sale_price: number | null
  display_price?: number
  is_contact_price?: boolean
  image: string | null
  url: string
}

interface SearchPost {
  id: number
  title: string
  slug: string
  url: string
  category?: string | null
}

interface SearchResponse {
  products: SearchProduct[]
  posts: SearchPost[]
}

const config = useRuntimeConfig()
const { formatMoney } = useSettings()
const route = useRoute()
const inputId = useId()
let requestVersion = 0

const query = ref('')
const results = ref<SearchResponse>({ products: [], posts: [] })
const isOpen = ref(false)
const loading = ref(false)
const brokenProductImages = ref<Set<number>>(new Set())
let timer: ReturnType<typeof setTimeout> | null = null

const hasResults = computed(() => results.value.products.length > 0 || results.value.posts.length > 0)

function searchProductPricing(product: SearchProduct): {
  regularPrice: number
  salePrice: number | null
  displayPrice: number
  isContactPrice: boolean
} {
  let regularPrice = Number(product.price)
  if (!Number.isFinite(regularPrice) || regularPrice < 0) regularPrice = 0

  const apiDisplayPrice = Number(product.display_price)
  const hasApiDisplayPrice = Number.isFinite(apiDisplayPrice) && apiDisplayPrice > 0
  if (regularPrice <= 0 && hasApiDisplayPrice) regularPrice = apiDisplayPrice

  const rawSalePrice = product.sale_price === null ? null : Number(product.sale_price)
  const salePrice = rawSalePrice !== null
    && Number.isFinite(rawSalePrice)
    && rawSalePrice > 0
    && regularPrice > 0
    && rawSalePrice < regularPrice
    ? rawSalePrice
    : null
  const displayPrice = hasApiDisplayPrice ? apiDisplayPrice : (salePrice ?? regularPrice)

  return {
    regularPrice,
    salePrice,
    displayPrice,
    isContactPrice: product.is_contact_price === true || displayPrice <= 0,
  }
}

function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = null
}

function markProductImageBroken(productId: number) {
  const next = new Set(brokenProductImages.value)
  next.add(productId)
  brokenProductImages.value = next
}

watch(query, value => {
  const version = ++requestVersion
  clearTimer()
  if (value.trim().length < 2) {
    results.value = { products: [], posts: [] }
    isOpen.value = false
    loading.value = false
    return
  }

  loading.value = true
  timer = setTimeout(async () => {
    try {
      const response = await $fetch<SearchResponse>(`${config.public.apiBase}/search`, {
        params: { q: value.trim() },
      })
      if (version !== requestVersion) return
      results.value = response
      brokenProductImages.value = new Set()
      isOpen.value = true
    } catch {
      if (version !== requestVersion) return
      results.value = { products: [], posts: [] }
      brokenProductImages.value = new Set()
      isOpen.value = true
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }, 300)
})

function close(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) isOpen.value = false
}

function goToResult(url: string) {
  isOpen.value = false
  query.value = ''
  void navigateTo(url)
}

function submitSearch() {
  const value = query.value.trim()
  if (value.length >= 2) goToResult(`/products?search=${encodeURIComponent(value)}`)
}

watch(() => route.fullPath, () => {
  isOpen.value = false
  query.value = ''
})

onBeforeUnmount(clearTimer)
</script>

<template>
  <div class="search-box" @focusout="close" @keydown.esc="isOpen = false">
    <form class="search-box-form" @submit.prevent="submitSearch">
      <label class="sr-only" :for="inputId">Tìm kiếm sản phẩm</label>
      <input
        :id="inputId"
        v-model="query"
        type="search"
        autocomplete="off"
        placeholder="Bạn cần tìm sản phẩm gì hôm nay?"
        aria-label="Tìm kiếm sản phẩm"
        :aria-expanded="isOpen"
        @focus="query.trim().length >= 2 && (isOpen = true)"
      >
      <button type="submit" aria-label="Tìm kiếm">
        <svg v-if="!loading" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="6.5" stroke-width="1.7" />
          <path stroke-linecap="round" stroke-width="1.7" d="m16 16 4.5 4.5" />
        </svg>
        <svg v-else aria-hidden="true" class="search-box-spinner" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-opacity=".25" stroke-width="3" />
          <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </button>
    </form>

    <Transition name="search-dropdown">
      <div v-if="isOpen && (hasResults || (query.trim().length >= 2 && !loading))" class="search-box-dropdown">
        <div v-if="results.products.length">
          <div class="search-box-section-title">Sản phẩm</div>
          <button v-for="product in results.products" :key="`product-${product.id}`" type="button" class="search-result" @click="goToResult(product.url)">
            <span class="search-result-image">
              <img
                v-if="product.image && !brokenProductImages.has(product.id)"
                :src="product.image"
                :alt="product.name"
                loading="lazy"
                decoding="async"
                @error="markProductImageBroken(product.id)"
              >
              <svg v-else aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7m-9 4v10" /></svg>
            </span>
            <span class="search-result-copy">
              <strong>{{ product.name }}</strong>
              <span v-if="searchProductPricing(product).isContactPrice" class="search-result-contact-price">Liên hệ</span>
              <span v-else>
                <b v-if="searchProductPricing(product).salePrice !== null">{{ formatMoney(searchProductPricing(product).salePrice || 0) }}</b>
                <em :class="{ 'is-old': searchProductPricing(product).salePrice !== null }">{{ formatMoney(searchProductPricing(product).regularPrice) }}</em>
              </span>
            </span>
            <svg aria-hidden="true" class="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>

        <div v-if="results.posts.length" class="search-posts" :class="{ 'has-products': results.products.length }">
          <div class="search-box-section-title">Bài viết</div>
          <button v-for="post in results.posts" :key="`post-${post.id}`" type="button" class="search-result" @click="goToResult(post.url)">
            <span class="search-result-post-icon">▤</span>
            <span class="search-result-copy"><strong>{{ post.title }}</strong><small v-if="post.category">{{ post.category }}</small></span>
            <svg aria-hidden="true" class="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>

        <div v-if="!hasResults && query.trim().length >= 2 && !loading" class="search-empty">
          Không tìm thấy kết quả cho “{{ query }}”
        </div>
      </div>
    </Transition>
  </div>
</template>
