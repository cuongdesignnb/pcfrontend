<script setup lang="ts">
import type { CartBenefit } from '~/types/cart'
import type { CheckoutLine, CheckoutPaymentMethod, CheckoutQuote } from '~/types/checkout'

const props = defineProps<{
  quote: CheckoutQuote | null
  lines: CheckoutLine[]
  paymentMethods: CheckoutPaymentMethod[]
  formatMoney: (amount: number) => string
  benefits: CartBenefit[]
  support: { hotline: string; hours: string }
  loading?: boolean
  submitting?: boolean
  disabled?: boolean
  mode: 'cart' | 'buy_now'
}>()

const totalQuantity = computed(() => props.quote?.summary.total_quantity ?? props.lines.reduce((sum, item) => sum + item.quantity, 0))
const summary = computed(() => props.quote?.summary ?? null)
const availablePaymentBadges = computed(() => props.paymentMethods.filter(method => method.available).map(method => method.code))
const availableBenefits = computed(() => props.benefits.filter(item => item.title.trim() || item.description.trim()).slice(0, 4))
</script>

<template>
  <aside class="checkout-summary-column">
    <section class="checkout-summary-card">
      <header class="checkout-summary-heading">
        <h2><CartIcon name="receipt" size="19" /> Đơn hàng của bạn <span>({{ totalQuantity }} sản phẩm)</span></h2>
        <NuxtLink :to="mode === 'buy_now' ? '/san-pham' : '/gio-hang'">Chỉnh sửa</NuxtLink>
      </header>

      <div class="checkout-summary-items" :class="{ 'is-loading': loading }">
        <div v-for="item in lines" :key="item.key" class="checkout-summary-item">
          <div class="checkout-summary-image">
            <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy">
            <CartIcon v-else name="package" size="22" />
          </div>
          <div class="checkout-summary-item-copy">
            <strong>{{ item.name }}</strong>
            <small v-if="item.variant_name">{{ item.variant_name }}</small>
            <small>Số lượng: {{ item.quantity }}</small>
          </div>
          <strong class="checkout-summary-item-price">{{ formatMoney(item.line_total) }}</strong>
        </div>
        <p v-if="!lines.length" class="checkout-summary-empty">Chưa có sản phẩm được chọn.</p>
      </div>

      <div class="checkout-coupon-card">
        <div class="checkout-inline-title"><CartIcon name="ticket" size="18" /><strong>Mã giảm giá</strong></div>
        <p>Chương trình mã giảm giá chưa khả dụng cho checkout này.</p>
      </div>

      <dl class="checkout-summary-totals">
        <div><dt>Tạm tính</dt><dd>{{ summary ? formatMoney(summary.subtotal) : '—' }}</dd></div>
        <div><dt>Giảm giá</dt><dd :class="{ 'is-discount': summary?.coupon_discount }">{{ summary ? (summary.coupon_discount ? `- ${formatMoney(summary.coupon_discount)}` : 'Chưa áp dụng') : '—' }}</dd></div>
        <div><dt>Phí vận chuyển</dt><dd :class="{ 'is-discount': summary?.shipping_fee === 0 }">{{ summary?.shipping_fee === null || !summary ? '—' : (summary.shipping_fee === 0 ? 'Miễn phí' : formatMoney(summary.shipping_fee)) }}</dd></div>
      </dl>

      <div class="checkout-summary-total">
        <span>Tổng cộng <small v-if="summary?.tax_label">({{ summary.tax_label }})</small></span>
        <strong>{{ summary?.total === null || !summary ? '—' : formatMoney(summary.total) }}</strong>
      </div>

      <button
        type="submit"
        form="checkout-form"
        class="checkout-order-button"
        :disabled="disabled || loading || submitting"
      >
        <span v-if="submitting" class="checkout-spinner" aria-hidden="true" />
        {{ submitting ? 'Đang ghi nhận…' : 'Đặt hàng' }}
        <CartIcon v-if="!submitting" name="arrow-right" size="17" />
      </button>

      <p class="checkout-terms">Bằng việc đặt hàng, bạn xác nhận thông tin giao nhận là chính xác và đồng ý với chính sách mua hàng của PC Center.</p>

      <div v-if="availablePaymentBadges.length" class="checkout-payment-badges">
        <strong>Phương thức đang khả dụng</strong>
        <div><span v-for="method in availablePaymentBadges" :key="method">{{ method === 'cod' ? 'COD' : 'SePay' }}</span></div>
      </div>
    </section>

    <section v-if="availableBenefits.length" class="checkout-summary-card checkout-benefits-card">
      <h2 class="checkout-trust-title"><CartIcon name="shield" size="19" /> Quyền lợi mua hàng</h2>
      <div class="checkout-trust-list">
        <div v-for="benefit in availableBenefits" :key="benefit.key" class="checkout-trust-item">
          <span><CartIcon :name="benefit.icon" size="21" /></span>
          <p><strong>{{ benefit.title }}</strong><small>{{ benefit.description }}</small></p>
        </div>
      </div>
    </section>

    <section v-if="support.hotline || support.hours" class="checkout-summary-card checkout-support-card">
      <h2 class="checkout-trust-title"><CartIcon name="headset" size="19" /> Hỗ trợ checkout</h2>
      <p v-if="support.hours" class="checkout-trust-copy">{{ support.hours }}</p>
      <a v-if="support.hotline" :href="`tel:${support.hotline.replace(/\s/g, '')}`" class="checkout-support-link"><CartIcon name="headset" size="15" /> {{ support.hotline }}</a>
    </section>
  </aside>
</template>
