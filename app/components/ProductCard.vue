<script setup lang="ts">
import type { ProductCard as ProductCardData } from '~/types/product-detail'

const props = withDefaults(defineProps<{
  product: ProductCardData
  variant?: 'default' | 'homepage' | 'compact' | 'category'
  compact?: boolean
  showAction?: boolean
}>(), {
  variant: 'default',
  compact: false,
  showAction: false,
})

const { formatMoney } = useSettings()
const wishlist = useWishlist()
const cart = useCart()
const toast = useToast()
const addingToCart = ref(false)
const togglingWishlist = ref(false)

const cardVariant = computed(() => props.compact ? 'compact' : props.variant)
const isCompact = computed(() => cardVariant.value === 'compact')
const isHomepage = computed(() => cardVariant.value === 'homepage')
const isCategory = computed(() => cardVariant.value === 'category')
const showProductAction = computed(() => isCategory.value || props.showAction)
const discountPercent = computed(() => {
  const price = Number(props.product.pricing.price)
  const salePrice = props.product.pricing.sale_price
  if (salePrice === null || price <= 0 || salePrice <= 0 || salePrice >= price) return 0
  return Math.round((1 - salePrice / price) * 100)
})
const isWishlisted = computed(() => wishlist.ids.value.includes(props.product.id))
const ratingScore = computed(() => Math.round(Number(props.product.rating?.average || 0)))
const productUrl = computed(() => props.product.category?.slug
  ? `/${props.product.category.slug}/${props.product.slug}`
  : `/products/${props.product.slug}`)
const categoryActionLabel = computed(() => {
  if (props.product.has_variants) return 'Chọn phiên bản'
  if (!props.product.inventory.purchasable) return props.product.inventory.availability_label
  return addingToCart.value ? 'Đang thêm…' : 'Thêm vào giỏ'
})
const categoryActionDisabled = computed(() => addingToCart.value || (!props.product.has_variants && !props.product.inventory.purchasable))

async function toggleWishlist() {
  if (togglingWishlist.value) return
  togglingWishlist.value = true
  try {
    await wishlist.ready()
    const wasWishlisted = isWishlisted.value
    const selected = await wishlist.toggle(props.product.id)
    toast.add(selected
      ? { title: wasWishlisted ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích', description: props.product.name, color: 'success' }
      : { title: 'Không thể cập nhật yêu thích', description: 'Vui lòng thử lại sau.', color: 'error' })
  } finally {
    togglingWishlist.value = false
  }
}

function formatSoldCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.0', '')}k`
  }
  return String(value)
}

async function handleCategoryAction(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (props.product.has_variants) {
    await navigateTo(productUrl.value)
    return
  }
  if (categoryActionDisabled.value) return

  addingToCart.value = true
  try {
    const success = await cart.addItem(props.product.id, 1)
    toast.add(success
      ? { title: 'Đã thêm vào giỏ hàng', description: props.product.name, color: 'success' }
      : { title: 'Không thể thêm vào giỏ', description: 'Vui lòng thử lại sau.', color: 'error' })
  } finally {
    addingToCart.value = false
  }
}
</script>

<template>
  <article class="product-card" :class="[`product-card--${cardVariant}`, { 'product-card--wishlisted': isWishlisted }]">
    <NuxtLink :to="productUrl" class="product-card-link">
      <div class="product-card-image">
        <span v-if="discountPercent > 0" class="product-card-discount">-{{ discountPercent }}%</span>
        <NuxtImg
          v-if="product.images?.[0]?.url"
          :src="product.images[0].url"
          :alt="product.images[0].alt || product.name"
          width="240"
          height="240"
          sizes="(max-width: 640px) 45vw, 220px"
          loading="lazy"
          class="product-card-image-asset"
        />
        <span v-else class="product-card-image-fallback" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor">
            <rect x="7" y="10" width="34" height="24" rx="3" stroke-width="2" />
            <path stroke-linecap="round" stroke-width="2" d="M17 40h14M24 34v6" />
          </svg>
        </span>
      </div>

      <span v-if="product.brand?.name && !isCompact" class="product-card-brand">{{ product.brand.name }}</span>
      <h3 class="product-card-name">{{ product.name }}</h3>

      <div class="product-card-pricing">
        <strong>{{ product.pricing.display_price > 0 ? formatMoney(product.pricing.display_price) : 'Liên hệ' }}</strong>
        <span v-if="discountPercent > 0" class="product-card-old-price">{{ formatMoney(product.pricing.price) }}</span>
      </div>

      <div v-if="product.rating?.count || (product.sold_count ?? 0) > 0" class="product-card-meta">
        <span v-if="product.rating?.count" class="product-card-rating">
          <span class="product-card-rating-stars" aria-hidden="true">
            <svg v-for="star in 5" :key="star" :class="{ 'is-filled': star <= ratingScore }" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.7 2.57 5.2 5.74.83-4.16 4.06.98 5.72L12 16.81l-5.13 2.7.98-5.72L3.7 9.73l5.73-.83L12 3.7Z" /></svg>
          </span>
          {{ product.rating.average?.toFixed(1) }} ({{ product.rating.count }})
        </span>
        <span v-if="(product.sold_count ?? 0) > 0">Đã bán {{ formatSoldCount(product.sold_count ?? 0) }}</span>
      </div>
      <p v-if="!isCompact && !isHomepage" class="product-card-availability" :class="product.inventory.purchasable ? 'is-available' : ''">
        <span class="product-card-availability-dot" aria-hidden="true" />
        {{ product.inventory.availability_label }}
      </p>
    </NuxtLink>

    <button
      type="button"
      class="product-card-wishlist"
      :class="{ 'is-active': isWishlisted }"
      :disabled="togglingWishlist"
      :aria-busy="togglingWishlist"
      :aria-label="isWishlisted ? `Bỏ ${product.name} khỏi yêu thích` : `Thêm ${product.name} vào yêu thích`"
      :aria-pressed="isWishlisted"
      @click="toggleWishlist"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
      </svg>
    </button>

    <button
      v-if="showProductAction"
      type="button"
      class="product-card-category-action product-card-compact-action"
      :disabled="categoryActionDisabled"
      @click="handleCategoryAction"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 4h2l1.4 10.2a2 2 0 0 0 2 1.8h8.8a2 2 0 0 0 1.9-1.4L21 7H6" />
        <circle cx="9" cy="20" r="1.2" stroke-width="1.5" />
        <circle cx="18" cy="20" r="1.2" stroke-width="1.5" />
      </svg>
      <span>{{ categoryActionLabel }}</span>
    </button>
  </article>
</template>
