<script setup lang="ts">
import type { CartBenefit, CartCoupon, CartPaymentMethod, CartSummary as CartSummaryData } from '~/types/cart'

const props = withDefaults(defineProps<{
  summary: CartSummaryData
  coupon?: CartCoupon | null
  benefits: CartBenefit[]
  paymentMethods: CartPaymentMethod[]
  support: { hotline: string; hours: string }
  disabled?: boolean
  loading?: boolean
}>(), {
  disabled: false,
  loading: false,
})

const emit = defineEmits<{ checkout: [] }>()
const { formatMoney } = useSettings()
const sideBenefits = computed(() => props.benefits.filter(item => item.title.trim() || item.description.trim()).slice(0, 4))
</script>

<template>
  <aside class="cart-summary-column">
    <section class="cart-summary-card">
      <h2><CartIcon name="receipt" size="22" /> Tóm tắt đơn hàng</h2>
      <dl class="cart-summary-lines">
        <div><dt>Tạm tính ({{ summary.selected_item_count }} sản phẩm)</dt><dd>{{ formatMoney(summary.subtotal) }}</dd></div>
        <div v-if="summary.product_discount > 0"><dt>Giảm giá sản phẩm</dt><dd class="is-discount">-{{ formatMoney(summary.product_discount) }}</dd></div>
        <div><dt>Mã giảm giá</dt><dd v-if="coupon" class="is-discount">-{{ formatMoney(coupon.discount) }}</dd><dd v-else>Chưa áp dụng</dd></div>
        <div><dt>Phí vận chuyển</dt><dd>Tính ở bước thanh toán</dd></div>
      </dl>
      <div class="cart-summary-total"><span>Tổng cộng <small>(đã bao gồm VAT nếu có)</small></span><strong>{{ formatMoney(summary.payable_before_shipping) }}</strong></div>
      <button type="button" class="cart-checkout-button" :disabled="disabled || loading" @click="emit('checkout')">
        {{ loading ? 'Đang chuẩn bị…' : 'Tiến hành thanh toán' }} <CartIcon name="arrow-right" size="18" />
      </button>
      <p class="cart-safe-payment"><CartIcon name="lock" size="14" /> Thanh toán an toàn, bảo mật</p>

      <div class="cart-summary-benefits">
        <div v-for="benefit in sideBenefits" :key="benefit.key" class="cart-summary-benefit">
          <span><CartIcon :name="benefit.icon" size="24" /></span>
          <p><strong>{{ benefit.title }}</strong><small>{{ benefit.description }}</small></p>
        </div>
      </div>

      <div v-if="paymentMethods.length" class="cart-payment-methods">
        <strong>Chúng tôi chấp nhận thanh toán</strong>
        <div><span v-for="method in paymentMethods" :key="method.key" :title="method.provider">{{ method.label }}</span></div>
      </div>
    </section>

    <section v-if="support.hotline" class="cart-support-card">
      <span><CartIcon name="headset" size="28" /></span>
      <div><strong>Bạn cần hỗ trợ?</strong><small>Liên hệ ngay với chúng tôi để được tư vấn</small><a :href="`tel:${support.hotline.replace(/\s/g, '')}`"><CartIcon name="headset" size="14" /> {{ support.hotline }}</a></div>
    </section>
  </aside>
</template>
