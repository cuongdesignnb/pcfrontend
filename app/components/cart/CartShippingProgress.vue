<script setup lang="ts">
import type { CartSummary } from '~/types/cart'

const props = defineProps<{ summary: CartSummary }>()
const { formatMoney } = useSettings()

const progress = computed(() => {
  const threshold = props.summary.shipping.free_threshold
  return threshold > 0 ? Math.min(100, Math.max(0, Math.round((props.summary.subtotal / threshold) * 100))) : 0
})
</script>

<template>
  <section v-if="summary.selected_item_count > 0 && summary.shipping.free_threshold > 0" class="cart-shipping-progress" aria-label="Tiến độ miễn phí vận chuyển">
    <div class="cart-shipping-icon"><CartIcon name="truck" size="25" /></div>
    <div class="cart-shipping-copy">
      <strong v-if="summary.shipping.eligible_for_free_shipping">Bạn đã đủ điều kiện miễn phí vận chuyển!</strong>
      <strong v-else>Mua thêm <b>{{ formatMoney(summary.shipping.amount_remaining_for_free_shipping) }}</b> để được miễn phí vận chuyển!</strong>
      <div class="cart-shipping-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
        <span :style="{ width: `${progress}%` }" />
      </div>
    </div>
    <div class="cart-shipping-totals">
      <span>Tổng hiện tại: <strong>{{ formatMoney(summary.payable_before_shipping) }}</strong></span>
      <small v-if="summary.shipping.free_threshold">Miễn phí vận chuyển từ {{ formatMoney(summary.shipping.free_threshold) }}</small>
    </div>
  </section>
</template>
