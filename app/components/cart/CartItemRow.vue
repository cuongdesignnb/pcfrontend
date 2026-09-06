<script setup lang="ts">
import type { CartItem } from '~/types/cart'

const props = withDefaults(defineProps<{
  item: CartItem
  pendingQuantity?: number | null
  busy?: boolean
  removing?: boolean
}>(), {
  pendingQuantity: null,
  busy: false,
  removing: false,
})

const emit = defineEmits<{
  'update:quantity': [quantity: number]
  'update:selected': [selected: boolean]
  remove: []
}>()

const { formatMoney } = useSettings()
const wishlist = useWishlist()

const quantity = computed(() => props.pendingQuantity ?? props.item.quantity)
const productPath = computed(() => {
  const product = props.item.product
  return product?.category?.slug ? `/${product.category.slug}/${product.slug}` : `/products/${product?.slug || ''}`
})
const variantText = computed(() => props.item.variant?.name || '')
const variantAttributes = computed(() => Object.entries(props.item.variant?.attributes || {}).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== ''))
const canIncrease = computed(() => props.item.inventory.purchasable && props.item.inventory.max_quantity > quantity.value)
const availabilityClass = computed(() => props.item.inventory.purchasable ? 'is-available' : 'is-unavailable')
const lineTotal = computed(() => props.pendingQuantity === null
  ? props.item.pricing.line_total
  : props.item.pricing.unit_price * quantity.value)
const saveActionLabel = computed(() => {
  if (!props.item.selected) return 'Chọn mua lại'
  return props.item.variant_id ? 'Bỏ chọn mua' : 'Lưu để mua sau'
})

function changeQuantity(next: number) {
  const max = props.item.inventory.max_quantity
  if (next < 1 || next > max || !props.item.inventory.purchasable || props.busy) return
  emit('update:quantity', next)
}

function saveForLater() {
  if (props.item.variant_id || !props.item.product) {
    emit('update:selected', !props.item.selected)
    return
  }

  if (!wishlist.ids.value.includes(props.item.product.id)) {
    wishlist.toggle(props.item.product.id)
  }
  emit('remove')
}

function eventChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked
}
</script>

<template>
  <article class="cart-item-row" :class="{ 'is-unselected': !item.selected, 'is-busy': busy || removing }">
    <label class="cart-checkbox-wrap">
      <input
        type="checkbox"
        :checked="item.selected"
        :aria-label="`Chọn ${item.product?.name || 'sản phẩm'}`"
        :disabled="busy || removing"
        @change="emit('update:selected', eventChecked($event))"
      >
      <span class="cart-checkbox" aria-hidden="true"><CartIcon v-if="item.selected" name="check" size="14" /></span>
    </label>

    <NuxtLink :to="productPath" class="cart-item-image">
      <NuxtImg
        v-if="item.product?.images?.[0]?.url"
        :src="item.product.images[0].url"
        :alt="item.product.images[0].alt || item.product.name"
        width="140"
        height="140"
        sizes="100px"
        loading="lazy"
        class="cart-item-image-asset"
      />
      <CartIcon v-else name="tag" size="33" />
    </NuxtLink>

    <div class="cart-item-copy">
      <NuxtLink :to="productPath" class="cart-item-name">{{ item.product?.name || 'Sản phẩm không còn tồn tại' }}</NuxtLink>
      <p v-if="variantText" class="cart-item-variant">Phiên bản: {{ variantText }}</p>
      <p v-for="[key, value] in variantAttributes" :key="key" class="cart-item-variant">{{ key }}: {{ value }}</p>
      <p class="cart-item-availability" :class="availabilityClass">
        <span class="cart-status-dot" aria-hidden="true" />
        {{ item.inventory.availability_label }}
      </p>
      <p v-if="!item.inventory.purchasable" class="cart-item-inventory-warning">Sản phẩm này chưa thể thanh toán. Vui lòng bỏ chọn hoặc xóa khỏi giỏ.</p>
      <div class="cart-item-price-line">
        <strong>{{ formatMoney(item.pricing.unit_price) }}</strong>
        <span v-if="item.pricing.original_unit_price > item.pricing.unit_price">{{ formatMoney(item.pricing.original_unit_price) }}</span>
        <em v-if="item.pricing.discount_percent > 0">-{{ item.pricing.discount_percent }}%</em>
      </div>
      <p v-if="item.price_changed" class="cart-item-price-warning">Giá sản phẩm đã được cập nhật và sẽ được xác nhận lại khi thanh toán.</p>
    </div>

    <div class="cart-item-controls">
      <div class="cart-quantity-control" :aria-label="`Số lượng ${item.product?.name || ''}`">
        <button type="button" aria-label="Giảm số lượng" :disabled="quantity <= 1 || busy" @click="changeQuantity(quantity - 1)"><CartIcon name="minus" size="15" /></button>
        <span aria-live="polite">{{ quantity }}</span>
        <button type="button" aria-label="Tăng số lượng" :disabled="!canIncrease || busy" @click="changeQuantity(quantity + 1)"><CartIcon name="plus" size="15" /></button>
      </div>
      <div class="cart-item-actions">
        <button type="button" class="cart-save-button" :class="{ 'is-saved': !item.selected }" :disabled="busy || removing" @click="saveForLater">
          <CartIcon name="heart" size="15" />
          {{ saveActionLabel }}
        </button>
        <button type="button" class="cart-remove-button" :disabled="busy || removing" @click="emit('remove')">
          <CartIcon name="trash" size="15" /> Xóa
        </button>
      </div>
    </div>

    <strong class="cart-item-total">{{ formatMoney(lineTotal) }}</strong>
  </article>
</template>
