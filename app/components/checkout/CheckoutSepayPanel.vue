<script setup lang="ts">
import type { CheckoutPaymentData } from '~/types/checkout'

const props = defineProps<{
  payment: CheckoutPaymentData
  formatMoney: (amount: number) => string
  verified?: boolean
  checking?: boolean
  copiedField?: string
}>()

const emit = defineEmits<{
  copy: [value: string, field: string]
  check: []
}>()
</script>

<template>
  <div class="checkout-sepay-panel" aria-live="polite">
    <div class="checkout-sepay-heading">
      <div><CartIcon name="qr" size="21" /><strong>{{ verified ? 'Thanh toán đã được xác nhận' : 'Hoàn tất thanh toán qua SePay' }}</strong></div>
      <span v-if="!verified" class="checkout-status-pill">Đang chờ xác nhận</span>
    </div>
    <template v-if="!verified">
      <div class="checkout-sepay-content">
        <div class="checkout-qr-frame"><img :src="payment.qr_url" :alt="`Mã QR thanh toán đơn ${payment.order_number}`"></div>
        <div class="checkout-sepay-details">
          <div><span>Số tiền</span><strong class="checkout-red">{{ formatMoney(payment.amount) }}</strong></div>
          <div><span>Ngân hàng</span><strong>{{ payment.bank_code }}</strong></div>
          <div><span>Số tài khoản</span><strong>{{ payment.bank_account }} <button type="button" @click="emit('copy', payment.bank_account, 'bank_account')">{{ copiedField === 'bank_account' ? 'Đã sao chép' : 'Sao chép' }}</button></strong></div>
          <div><span>Chủ tài khoản</span><strong>{{ payment.account_name }}</strong></div>
          <div><span>Nội dung chuyển khoản</span><strong>{{ payment.transfer_content }} <button type="button" @click="emit('copy', payment.transfer_content, 'transfer_content')">{{ copiedField === 'transfer_content' ? 'Đã sao chép' : 'Sao chép' }}</button></strong></div>
        </div>
      </div>
      <p class="checkout-sepay-note">Vui lòng chuyển đúng số tiền và nội dung. Hệ thống sẽ cập nhật khi nhận được xác nhận từ backend.</p>
      <button type="button" class="checkout-secondary-button" :disabled="checking" @click="emit('check')">
        <CartIcon name="refresh" size="15" /> {{ checking ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái' }}
      </button>
    </template>
    <p v-else class="checkout-sepay-success">Khoản thanh toán cho đơn {{ payment.order_number }} đã được backend xác nhận.</p>
  </div>
</template>
