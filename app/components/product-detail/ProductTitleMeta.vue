<script setup lang="ts">
import type { ProductDetail } from '~/types/product-detail'

const emit = defineEmits<{ reviews: [] }>()
const wishlist = useWishlist()
const toast = useToast()
const togglingWishlist = ref(false)
const props = defineProps<{ product: ProductDetail; sku: string }>()
const isWishlisted = computed(() => wishlist.ids.value.includes(props.product.id))

const toggleWishlist = async () => {
  if (togglingWishlist.value) return
  togglingWishlist.value = true
  try {
    await wishlist.ready()
    const wasWishlisted = isWishlisted.value
    const success = await wishlist.toggle(props.product.id)
    toast.add(success
      ? { title: wasWishlisted ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích', description: props.product.name, color: 'success' }
      : { title: 'Không thể cập nhật yêu thích', description: 'Vui lòng thử lại sau.', color: 'error' })
  } finally {
    togglingWishlist.value = false
  }
}
</script>

<template>
  <div class="pdp-title-meta">
    <span v-if="product.is_featured" class="inline-flex rounded bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">Bán chạy</span>
    <div class="mt-2 flex items-start justify-between gap-3">
      <h1 class="text-[20px] font-bold leading-[1.25] text-slate-900 lg:text-[22px]">{{ product.name }}</h1>
      <button
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        :class="{ 'border-red-200 bg-red-50 text-red-600': isWishlisted }"
        :disabled="togglingWishlist"
        :aria-busy="togglingWishlist"
        :aria-pressed="isWishlisted"
        :aria-label="isWishlisted ? `Bỏ ${product.name} khỏi yêu thích` : `Thêm ${product.name} vào yêu thích`"
        @click="toggleWishlist"
      >
        <CartIcon name="heart" size="18" />
      </button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <button v-if="product.rating.count" type="button" class="inline-flex items-center gap-1 text-amber-500 hover:text-amber-600" @click="emit('reviews')">
        <span aria-hidden="true">★★★★★</span><span class="font-semibold text-slate-800">{{ product.rating.average ?? '—' }}</span><span class="text-slate-500">({{ product.rating.count }} đánh giá)</span>
      </button>
      <span v-else class="text-slate-500">Chưa có đánh giá</span>
      <span v-if="product.sold_count > 0" class="text-slate-400">|</span>
      <span v-if="product.sold_count > 0" class="text-slate-500">Đã bán {{ product.sold_count.toLocaleString('vi-VN') }}</span>
      <span v-if="sku" class="text-slate-400">|</span>
      <span v-if="sku" class="text-slate-500">SKU: {{ sku }}</span>
    </div>
  </div>
</template>
