<script setup lang="ts">
const { siteName, formatMoney } = useSettings()
const {
  response,
  items,
  initialLoading,
  hasError,
  loading: cartLoading,
  allSelected,
  selectedLineCount,
  canCheckout,
  busyItemIds,
  removingItemIds,
  pendingQuantities,
  bulkBusy,
  start,
  refresh,
  queueQuantity,
  toggleSelected,
  selectAll,
  removeItem,
  removeSelected,
  clearAll,
  confirmationOpen,
  confirmationTitle,
  confirmationDescription,
  cancelConfirmation,
  confirmConfirmation,
  checkout,
} = useCartPage()

useSeoMeta({
  title: () => `Giỏ hàng - ${siteName.value}`,
  description: () => `Giỏ hàng của ${siteName.value}`,
})

const refreshRestoredCart = (event: PageTransitionEvent) => {
  if (event.persisted) void refresh()
}

onMounted(() => {
  void start()
  window.addEventListener('pageshow', refreshRestoredCart)
})

onBeforeUnmount(() => window.removeEventListener('pageshow', refreshRestoredCart))
</script>

<template>
  <div class="cart-page">
    <div class="pc-container cart-container">
      <CartBreadcrumb />

      <header class="cart-page-heading">
        <h1>Giỏ hàng <span>({{ response.summary.item_count }} sản phẩm)</span></h1>
        <p v-if="response.summary.selected_item_count !== response.summary.item_count">Đang chọn {{ response.summary.selected_item_count }}/{{ response.summary.item_count }} sản phẩm</p>
      </header>

      <CartSkeleton v-if="initialLoading" />

      <section v-else-if="hasError" class="cart-error" role="alert">
        <CartIcon name="help" size="34" />
        <h2>Không thể tải giỏ hàng</h2>
        <p>Vui lòng kiểm tra kết nối rồi thử lại.</p>
        <button type="button" class="cart-primary-button" @click="start">Thử lại <CartIcon name="refresh" size="16" /></button>
      </section>

      <template v-else-if="!items.length">
        <CartEmptyState />
        <CartRecommendations :products="response.recommendations" />
      </template>

      <template v-else>
        <div class="cart-layout">
          <main class="cart-main-content">
            <CartItemList
              :items="items"
              :item-count="response.summary.item_count"
              :all-selected="allSelected"
              :selected-line-count="selectedLineCount"
              :busy-item-ids="busyItemIds"
              :removing-item-ids="removingItemIds"
              :pending-quantities="pendingQuantities"
              :bulk-busy="bulkBusy"
              @select-all="selectAll"
              @remove-selected="removeSelected"
              @update:quantity="queueQuantity"
              @update:selected="toggleSelected"
              @remove="removeItem"
            />

            <CartShippingProgress :summary="response.summary" />
            <CartAccessories :products="response.accessories" />
            <CartRecommendations :products="response.recommendations" />

            <div class="cart-bottom-actions">
              <NuxtLink to="/" class="cart-continue-link"><CartIcon name="arrow-left" size="15" /> Tiếp tục mua sắm</NuxtLink>
              <div class="cart-bottom-actions-right">
                <button type="button" class="cart-clear-link" :disabled="bulkBusy || cartLoading" @click="refresh"><CartIcon name="refresh" size="15" /> Cập nhật giỏ hàng</button>
                <button type="button" class="cart-clear-link" :disabled="bulkBusy" @click="clearAll"><CartIcon name="trash" size="15" /> Xóa toàn bộ giỏ hàng</button>
              </div>
            </div>
          </main>

          <CartSummary
            :summary="response.summary"
            :benefits="response.benefits"
            :payment-methods="response.payment_methods"
            :support="response.support"
            :coupon="response.coupon"
            :disabled="!canCheckout"
            :loading="bulkBusy || cartLoading"
            @checkout="checkout"
          />
        </div>
      </template>
    </div>

    <div v-if="items.length" class="cart-mobile-checkout">
      <span><small>Tổng cộng</small><strong>{{ formatMoney(response.summary.payable_before_shipping) }}</strong></span>
      <button type="button" :disabled="!canCheckout || bulkBusy || cartLoading" @click="checkout">Thanh toán <CartIcon name="arrow-right" size="16" /></button>
    </div>

    <UModal
      v-model:open="confirmationOpen"
      :title="confirmationTitle"
      :description="confirmationDescription"
      :dismissible="false"
    >
      <template #footer="{ close }">
        <div class="cart-confirm-actions">
          <button type="button" class="cart-confirm-cancel" @click="cancelConfirmation(); close()">Hủy</button>
          <button type="button" class="cart-confirm-submit" @click="confirmConfirmation(); close()">Xác nhận xóa</button>
        </div>
      </template>
    </UModal>
  </div>
</template>
