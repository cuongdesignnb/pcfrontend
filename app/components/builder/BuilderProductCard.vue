<script setup lang="ts">
import type { BuilderProductOption } from '~/types/pc-builder'
import { productUrl } from '~/utils/urls'

const props = defineProps<{ option: BuilderProductOption; selected: boolean }>()
const emit = defineEmits<{ select: [product: BuilderProductOption]; open: [product: BuilderProductOption] }>()
const wishlist = useWishlist()
const toast = useToast()
const product = computed(() => props.option.product)
const wished = wishlist.has(product.value.id)
const togglingWishlist = ref(false)
const actionLabel = computed(() => product.value.has_variants ? 'Chọn phiên bản' : props.option.is_compatible ? 'Chọn linh kiện' : 'Không tương thích')
const selectProduct = () => {
  if (!props.option.is_compatible || product.value.has_variants) {
    if (product.value.has_variants) emit('open', props.option)
    return
  }
  emit('select', props.option)
}
const resolvedProductUrl = computed(() => productUrl(product.value))
const toggleWishlist = async () => {
  if (togglingWishlist.value) return
  togglingWishlist.value = true
  try {
    await wishlist.ready()
    const wasWished = wished.value
    const success = await wishlist.toggle(product.value.id)
    toast.add(success
      ? { title: wasWished ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích', description: product.value.name, color: 'success' }
      : { title: 'Không thể cập nhật yêu thích', description: 'Vui lòng thử lại sau.', color: 'error' })
  } finally {
    togglingWishlist.value = false
  }
}
</script>

<template>
<article class="builder-product-card" :class="{ 'is-selected': selected, 'is-incompatible': !option.is_compatible }">
  <span v-if="selected" class="builder-selected-badge">Đang chọn</span>
  <button type="button" class="builder-wishlist" :disabled="togglingWishlist" :aria-busy="togglingWishlist" :aria-label="wished ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'" @click="toggleWishlist">
    <svg viewBox="0 0 24 24" :fill="wished ? 'currentColor' : 'none'" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.8 2.7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
  </button>
  <NuxtLink v-if="resolvedProductUrl" :to="resolvedProductUrl" class="builder-product-image" :aria-label="product.name">
    <NuxtImg v-if="product.image?.url" :src="product.image.url" :alt="product.image.alt || product.name" width="210" height="150" loading="lazy" />
    <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.4" /><path d="m7 15 3-3 2 2 2-3 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
  </NuxtLink>
  <span v-else class="builder-product-image" :aria-label="product.name">
    <NuxtImg v-if="product.image?.url" :src="product.image.url" :alt="product.image.alt || product.name" width="210" height="150" loading="lazy" />
    <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.4" /><path d="m7 15 3-3 2 2 2-3 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
  </span>
  <div class="builder-product-body">
    <NuxtLink v-if="resolvedProductUrl" :to="resolvedProductUrl" class="builder-product-name">{{ product.name }}</NuxtLink>
    <span v-else class="builder-product-name">{{ product.name }}</span>
    <p class="builder-product-specs">{{ product.specifications.slice(0, 2).map(spec => `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`).join(' · ') || product.brand?.name }}</p>
    <div class="builder-product-price">
      <strong>{{ new Intl.NumberFormat('vi-VN').format(product.pricing.display_price) }}đ</strong>
      <del v-if="product.pricing.sale_price !== null && product.pricing.sale_price < product.pricing.price">{{ new Intl.NumberFormat('vi-VN').format(product.pricing.price) }}đ</del>
    </div>
    <div class="builder-product-meta">
      <span v-if="product.rating.average !== null"><span class="builder-rating-mark" aria-hidden="true">★</span> {{ product.rating.average }} ({{ product.rating.count }})</span>
      <span>{{ product.sold_count ? `Đã bán ${product.sold_count}` : product.inventory.availability_label }}</span>
    </div>
    <p v-if="!option.is_compatible && option.issues[0]" class="builder-product-issue">{{ option.issues[0].message }}</p>
    <button type="button" class="builder-product-action" :disabled="!option.is_compatible && !product.has_variants" :aria-pressed="selected" @click="selectProduct">
      <svg v-if="!product.has_variants && option.is_compatible" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14l-1 12H6L5 7Zm3 0a4 4 0 0 1 8 0M9 11v4m6-4v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {{ actionLabel }}
    </button>
  </div>
</article>
</template>
