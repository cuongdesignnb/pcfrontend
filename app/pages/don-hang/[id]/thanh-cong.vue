<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()

const orderId = route.params.id as string
const order = ref<any>(null)
const loading = ref(true)
const accessDenied = ref(false)
const orderAccessToken = ref('')

const orderHeaders = () => orderAccessToken.value
  ? { 'X-Order-Access-Token': orderAccessToken.value }
  : {}

const refreshOrder = async () => {
  if (!orderAccessToken.value) {
    order.value = null
    accessDenied.value = true
    loading.value = false
    return
  }

  try {
    order.value = await $fetch<any>(
      `${config.public.apiBase}/orders/${orderId}`,
      { headers: orderHeaders() },
    )
    accessDenied.value = false
  } catch {
    order.value = null
    accessDenied.value = true
  } finally {
    loading.value = false
  }
}

const statusLabels: Record<string, string> = {
  pending: 'Đang ghi nhận đơn hàng',
  sending: 'Đang kiểm tra tồn kho',
  retrying: 'Đang chờ kết nối hệ thống kho',
  synced: 'Đơn hàng đã được xác nhận',
  rejected: 'Đơn hàng không thể xác nhận',
  failed: 'Đồng bộ gặp lỗi, vui lòng liên hệ',
  cancel_pending: 'Đang gửi yêu cầu hủy',
  cancelled: 'Đơn hàng đã được hủy',
  not_required: 'Đơn hàng đã được ghi nhận',
}

const integrationMessage = computed(
  () => statusLabels[order.value?.kiot_sync_status] || 'Đang ghi nhận đơn hàng',
)
const isWaiting = computed(() =>
  ['pending', 'sending', 'retrying', 'cancel_pending'].includes(
    order.value?.kiot_sync_status,
  ),
)
const integrationStatusClass = computed(() => {
  if (['synced', 'not_required'].includes(order.value?.kiot_sync_status)) {
    return 'bg-green-100 text-green-700'
  }
  if (['rejected', 'failed'].includes(order.value?.kiot_sync_status)) {
    return 'bg-red-100 text-red-700'
  }
  if (order.value?.kiot_sync_status === 'cancelled') {
    return 'bg-gray-100 text-gray-700'
  }
  return 'bg-yellow-100 text-yellow-700'
})

let statusInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  orderAccessToken.value =
    sessionStorage.getItem(`pc-order-access-token:${orderId}`) || ''
  await refreshOrder()

  if (orderAccessToken.value) {
    statusInterval = setInterval(async () => {
      if (isWaiting.value) {
        await refreshOrder()
      }
    }, 5000)
  }
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
  }
})

const cancelling = ref(false)
const cancelOrder = async () => {
  if (!order.value?.can_cancel || cancelling.value) return

  cancelling.value = true
  try {
    const response = await $fetch<any>(
      `${config.public.apiBase}/orders/${orderId}/cancel`,
      {
        method: 'POST',
        headers: orderHeaders(),
        body: { reason: 'Khách hàng yêu cầu hủy' },
      },
    )
    order.value = response.order
    toast.add({
      title: response.message || 'Yêu cầu hủy đã được ghi nhận',
      color: 'success',
    })
  } catch (error: any) {
    toast.add({
      title: 'Không thể hủy đơn hàng',
      description:
        error.data?.message || 'Vui lòng thử lại hoặc liên hệ hỗ trợ.',
      color: 'error',
    })
  } finally {
    cancelling.value = false
  }
}

useSeoMeta({ title: 'Trạng thái đơn hàng - PC Shop' })
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-2xl mx-auto text-center">
      <div v-if="loading" class="bg-white rounded-xl shadow-sm p-8">
        <p class="text-gray-600">Đang tải đơn hàng...</p>
      </div>

      <div
        v-else-if="accessDenied"
        class="bg-white rounded-xl shadow-sm p-8"
      >
        <h1 class="text-2xl font-bold text-gray-900 mb-3">
          Không thể hiển thị đơn hàng
        </h1>
        <p class="text-gray-600">
          Bạn không có quyền xem đơn hàng này.
        </p>
        <UButton to="/" size="lg" variant="outline" class="mt-6">
          Tiếp tục mua sắm
        </UButton>
      </div>

      <template v-else-if="order">
      <!-- Success Icon -->
      <div class="text-8xl mb-6">🎉</div>
      
      <h1 class="text-4xl font-bold text-green-600 mb-4">
        Trạng thái đơn hàng
      </h1>
      
      <p class="text-xl text-gray-600 mb-8">
        Cảm ơn bạn đã tin tưởng PC Shop
      </p>

      <div
        class="rounded-xl p-4 mb-8"
        :class="integrationStatusClass"
      >
        <p class="font-semibold">{{ integrationMessage }}</p>
        <p v-if="order.kiot_order_code" class="text-sm mt-1">
          Mã KIOT: {{ order.kiot_order_code }}
        </p>
        <p v-if="order.kiot_sync_error_code" class="text-sm mt-1">
          Mã lỗi: {{ order.kiot_sync_error_code }}
        </p>
      </div>

      <div
        v-if="order.can_pay && order.payment"
        class="bg-white rounded-xl shadow-sm p-6 mb-8"
      >
        <h2 class="text-2xl font-bold mb-2">
          Thanh toán bằng chuyển khoản
        </h2>
        <p class="text-gray-600 mb-4">
          Đơn hàng đã được xác nhận tồn kho trước khi thanh toán.
        </p>
        <img
          :src="order.payment.qr_url"
          alt="Mã QR thanh toán"
          class="w-64 h-64 mx-auto"
        />
        <p class="text-2xl font-bold text-primary-600 mt-4">
          {{ new Intl.NumberFormat('vi-VN').format(order.payment.amount) }}₫
        </p>
        <p class="text-gray-700 mt-2">
          Nội dung chuyển khoản:
          <strong>{{ order.payment.transfer_content }}</strong>
        </p>
      </div>

        <!-- Order Info -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-8 text-left">
          <div class="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
              <p class="text-sm text-gray-500">Mã đơn hàng</p>
              <p class="text-xl font-bold">{{ order.order_number }}</p>
            </div>
            <span 
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                order.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              ]"
            >
              {{ order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán' }}
            </span>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <p class="text-sm text-gray-500 mb-1">Người nhận</p>
              <p class="font-medium">{{ order.shipping_name }}</p>
              <p class="text-gray-600">{{ order.shipping_phone }}</p>
              <p class="text-gray-600">{{ order.customer_email }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-1">Địa chỉ giao hàng</p>
              <p class="text-gray-600">
                {{ order.shipping_address }}<br>
                {{ order.shipping_ward && order.shipping_ward + ', ' }}
                {{ order.shipping_district && order.shipping_district + ', ' }}
                {{ order.shipping_city }}
              </p>
            </div>
          </div>

          <!-- Order Items -->
          <div class="mt-6 pt-6 border-t">
            <p class="text-sm text-gray-500 mb-3">Sản phẩm đã đặt</p>
            <div class="space-y-3">
              <div 
                v-for="item in order.items" 
                :key="item.id"
                class="flex justify-between"
              >
              <div>
                  <p class="font-medium">{{ item.product_name }}</p>
                  <p class="text-sm text-gray-500">SL: {{ item.quantity }}</p>
                </div>
                <p class="font-medium">
                  {{ new Intl.NumberFormat('vi-VN').format(item.total) }}₫
                </p>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="mt-6 pt-6 border-t flex justify-between text-lg font-bold">
            <span>Tổng cộng</span>
            <span class="text-primary-600">
              {{ new Intl.NumberFormat('vi-VN').format(order.total) }}₫
            </span>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="bg-blue-50 rounded-xl p-6 mb-8 text-left">
          <h3 class="font-bold mb-2">📧 Tiếp theo</h3>
          <ul class="space-y-2 text-gray-700">
            <li>• Email xác nhận đơn hàng đã được gửi đến {{ order.customer_email }}</li>
            <li>• Chúng tôi sẽ liên hệ qua số {{ order.shipping_phone }} để xác nhận</li>
            <li>• Đơn hàng sẽ được giao trong 2-5 ngày làm việc</li>
          </ul>
        </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton
          v-if="order.can_cancel"
          color="error"
          variant="soft"
          size="lg"
          :loading="cancelling"
          @click="cancelOrder"
        >
          Hủy đơn hàng
        </UButton>
        <UButton to="/" size="lg" variant="outline">
          Tiếp tục mua sắm
        </UButton>
        <UButton :to="`/tai-khoan/don-hang/${orderId}`" size="lg">
          Theo dõi đơn hàng
        </UButton>
      </div>
      </template>
    </div>
  </div>
</template>
