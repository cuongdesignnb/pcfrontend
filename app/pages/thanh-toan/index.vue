<script setup lang="ts">
import type {
  CheckoutApiErrorPayload,
  CheckoutForm,
  CheckoutLine,
  CheckoutOrder,
  CheckoutOrderResponse,
  CheckoutPaymentData,
  CheckoutPaymentMethod,
  CheckoutQuoteRequest,
} from '~/types/checkout'
import type { BuyNowItem, ProductDetail, ProductDetailResponse } from '~/types/product-detail'
import { cartItemToCheckoutLine } from '~/types/checkout'
import { createUuid } from '~/utils/createUuid'

definePageMeta({
  ssr: false,
})

const config = useRuntimeConfig()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const auth = useAuth()
const cart = useCart()
const cartResponse = cart.state
const { getHeaders: getCartHeaders } = useCartSession()
const { read: readBuyNow, clear: clearBuyNow } = useBuyNow()
const { siteName, formatMoney, fetchSettings } = useSettings()
const locations = useCheckoutLocations()
const quotes = useCheckoutQuote()

const checkoutMode = ref<'cart' | 'buy_now'>(route.query.mode === 'buy-now' ? 'buy_now' : 'cart')
const buyNowItem = ref<BuyNowItem | null>(null)
const buyNowProduct = ref<ProductDetail | null>(null)
const pageLoading = ref(true)
const buyNowLoading = ref(false)
const pageError = ref<string | null>(null)
const initialized = ref(false)
const checkoutIdempotencyKey = ref('')
const orderAccessToken = ref('')
const orderResult = ref<CheckoutOrder | null>(null)
const paymentData = ref<CheckoutPaymentData | null>(null)
const paymentVerified = ref(false)
const paymentPending = ref(false)
const checkingPayment = ref(false)
const copiedField = ref('')
const submitError = ref('')
const serverFieldErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

const form = reactive<CheckoutForm>({
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  shipping_address: '',
  shipping_city: '',
  shipping_district: '',
  shipping_ward: '',
  shipping_province_code: '',
  shipping_ward_code: '',
  shipping_method: 'standard',
  payment_method: '',
  notes: '',
})

const selectedProvince = computed(() => locations.provinces.value.find(item => item.code === form.shipping_province_code) ?? null)
const selectedWard = computed(() => locations.wards.value.find(item => item.code === form.shipping_ward_code) ?? null)
const authRedirect = computed(() => checkoutMode.value === 'buy_now' ? '/thanh-toan?mode=buy-now' : '/thanh-toan')

const cartLines = computed<CheckoutLine[]>(() => cartResponse.value.items
  .filter(item => item.selected)
  .map(cartItemToCheckoutLine))

const buyNowLine = computed<CheckoutLine[]>(() => {
  const product = buyNowProduct.value
  const intent = buyNowItem.value
  if (!product || !intent) return []
  const variant = intent.variant_id === null
    ? null
    : product.variants.find(item => item.id === intent.variant_id) ?? null
  return [{
    key: `${product.id}:${variant?.id ?? 'base'}`,
    product_id: product.id,
    variant_id: variant?.id ?? null,
    name: product.name,
    variant_name: variant?.name ?? null,
    sku: variant?.sku ?? product.sku,
    quantity: intent.quantity,
    unit_price: variant?.pricing.display_price ?? product.pricing.display_price,
    original_unit_price: variant?.pricing.price ?? product.pricing.price,
    line_total: (variant?.pricing.display_price ?? product.pricing.display_price) * intent.quantity,
    line_discount: Math.max(0, (variant?.pricing.price ?? product.pricing.price) - (variant?.pricing.display_price ?? product.pricing.display_price)) * intent.quantity,
    image: product.images[0]?.url ?? null,
  }]
})

const fallbackLines = computed(() => checkoutMode.value === 'buy_now' ? buyNowLine.value : cartLines.value)
const displayLines = computed<CheckoutLine[]>(() => quotes.quote.value ? quotes.quote.value.items : fallbackLines.value)
const sourceHasItems = computed(() => fallbackLines.value.length > 0)
const quoteIssues = computed(() => quotes.quote.value?.issues ?? [])

const paymentMethods = computed<CheckoutPaymentMethod[]>(() => {
  if (quotes.quote.value) return quotes.quote.value.payment_methods
  return cartResponse.value.payment_methods.map(method => ({
    code: method.key,
    label: method.label,
    description: method.provider,
    available: true,
    disabled_reason: null,
  }))
})

const quotePayload = computed<CheckoutQuoteRequest>(() => {
  const payload: CheckoutQuoteRequest = {
    checkout_mode: checkoutMode.value,
    shipping_province_code: form.shipping_province_code,
    shipping_ward_code: form.shipping_ward_code,
    shipping_method: form.shipping_method,
    payment_method: form.payment_method,
  }
  if (checkoutMode.value === 'buy_now' && buyNowItem.value) {
    payload.items = [{
      product_id: buyNowItem.value.product_id,
      variant_id: buyNowItem.value.variant_id,
      quantity: buyNowItem.value.quantity,
    }]
  }
  return payload
})

const quoteLoading = computed(() => quotes.loading.value)
const hasCartError = computed(() => checkoutMode.value === 'cart' && Boolean(cart.error.value))
const quoteHasUsablePayment = computed(() => paymentMethods.value.some(method => method.code === form.payment_method && method.available))

const issueFor = (field: string): string => {
  if (serverFieldErrors.value[field]) return serverFieldErrors.value[field]
  return quoteIssues.value.find(issue => issue.field === field)?.message ?? ''
}

const isFormValid = computed(() => {
  const summary = quotes.quote.value?.summary
  return initialized.value
    && sourceHasItems.value
    && !orderResult.value
    && !quoteLoading.value
    && Boolean(quotes.quote.value?.quote_id)
    && Boolean(quotes.quote.value?.can_place_order)
    && (summary?.total ?? null) !== null
    && form.customer_name.trim().length > 0
    && form.customer_name.trim().length <= 255
    && form.customer_phone.trim().length > 0
    && form.customer_phone.trim().length <= 20
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim())
    && form.customer_email.trim().length <= 255
    && form.shipping_address.trim().length > 0
    && form.shipping_address.trim().length <= 500
    && Boolean(form.shipping_province_code)
    && Boolean(form.shipping_ward_code)
    && quoteHasUsablePayment.value
    && form.notes.length <= 1000
    && checkoutIdempotencyKey.value.length > 0
})

const mobileTotal = computed(() => quotes.quote.value?.summary.total)

const saveAttempt = (order: CheckoutOrder) => {
  if (!import.meta.client) return
  sessionStorage.setItem('pc-checkout-attempt', JSON.stringify({
    order_id: order.id,
    access_token: orderAccessToken.value,
    checkout_mode: checkoutMode.value,
  }))
}

const readString = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

const prefillProfile = () => {
  const record = auth.user.value as Record<string, unknown> | null
  if (!record) return
  if (!form.customer_name) form.customer_name = readString(record, ['name', 'full_name'])
  if (!form.customer_email) form.customer_email = readString(record, ['email'])
  if (!form.customer_phone) form.customer_phone = readString(record, ['phone', 'phone_number'])
}

const initialiseTokens = () => {
  const idempotencyStorageKey = 'pc-checkout-idempotency-key'
  const accessTokenStorageKey = 'pc-checkout-order-access-token'
  checkoutIdempotencyKey.value = sessionStorage.getItem(idempotencyStorageKey) || createUuid()
  orderAccessToken.value = sessionStorage.getItem(accessTokenStorageKey) || createUuid()
  sessionStorage.setItem(idempotencyStorageKey, checkoutIdempotencyKey.value)
  sessionStorage.setItem(accessTokenStorageKey, orderAccessToken.value)
}

const loadBuyNowProduct = async () => {
  if (checkoutMode.value !== 'buy_now') return true
  const intent = readBuyNow()
  if (!intent) {
    pageError.value = 'Phiên mua ngay không còn hợp lệ. Vui lòng quay lại sản phẩm để chọn lại.'
    return false
  }
  buyNowItem.value = intent
  buyNowLoading.value = true
  try {
    const response = await $fetch<ProductDetailResponse>(`${config.public.apiBase}/products/${encodeURIComponent(intent.product_slug)}`)
    const variant = intent.variant_id === null ? null : response.product.variants.find(item => item.id === intent.variant_id)
    if (intent.variant_id !== null && !variant) {
      pageError.value = 'Biến thể đã chọn không còn khả dụng. Vui lòng quay lại sản phẩm để chọn lại.'
      return false
    }
    buyNowProduct.value = response.product
    return true
  } catch {
    pageError.value = 'Không thể tải sản phẩm mua ngay. Vui lòng quay lại sản phẩm và thử lại.'
    return false
  } finally {
    buyNowLoading.value = false
  }
}

const setDefaultPaymentMethod = () => {
  if (form.payment_method && paymentMethods.value.some(method => method.code === form.payment_method && method.available)) return
  form.payment_method = paymentMethods.value.find(method => method.available)?.code ?? ''
}

const refreshQuote = async () => {
  if (!initialized.value || !sourceHasItems.value) return null
  const response = await quotes.fetchQuote({ ...quotePayload.value, items: quotePayload.value.items?.map(item => ({ ...item })) })
  if (response) setDefaultPaymentMethod()
  return response
}

const resumeAttempt = async (): Promise<boolean> => {
  if (!import.meta.client) return false
  const raw = sessionStorage.getItem('pc-checkout-attempt')
  if (!raw) return false
  try {
    const attempt = JSON.parse(raw) as { order_id?: number; access_token?: string; checkout_mode?: 'cart' | 'buy_now' }
    if (!Number.isInteger(attempt.order_id) || typeof attempt.access_token !== 'string' || !attempt.access_token) return false
    const response = await $fetch<CheckoutOrderResponse>(`${config.public.apiBase}/orders/${attempt.order_id}`, {
      headers: {
        ...getCartHeaders(),
        'X-Order-Access-Token': attempt.access_token,
        ...(auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : {}),
      },
    })
    orderAccessToken.value = attempt.access_token
    orderResult.value = response.order
    paymentData.value = response.payment ?? null
    paymentPending.value = response.order.payment_method === 'sepay'
      && !response.payment
      && response.order.payment_status !== 'paid'
      && !isTerminalPaymentOrder(response.order)
    if (paymentData.value && response.order.payment_status === 'paid') paymentVerified.value = true
    return true
  } catch {
    sessionStorage.removeItem('pc-checkout-attempt')
    return false
  }
}

watch(() => form.shipping_province_code, (code) => {
  form.shipping_city = selectedProvince.value?.fullname ?? ''
  form.shipping_ward_code = ''
  form.shipping_ward = ''
  void locations.loadWards(code)
})

watch(() => form.shipping_ward_code, (code) => {
  form.shipping_ward = locations.wards.value.find(item => item.code === code)?.fullname ?? ''
})

watch(
  () => [form.shipping_province_code, form.shipping_ward_code, form.shipping_method, form.payment_method] as const,
  () => {
    if (initialized.value && sourceHasItems.value && !orderResult.value) {
      quotes.scheduleQuote({ ...quotePayload.value, items: quotePayload.value.items?.map(item => ({ ...item })) })
    }
  },
)

onMounted(async () => {
  initialiseTokens()
  await fetchSettings()
  const buyNowReady = await loadBuyNowProduct()
  await Promise.all([cart.fetchCart(), locations.loadProvinces()])
  prefillProfile()
  setDefaultPaymentMethod()
  pageLoading.value = false
  initialized.value = buyNowReady && !hasCartError.value
  if (initialized.value && sourceHasItems.value) {
    const resumed = await resumeAttempt()
    if (!resumed) await refreshQuote()
    if (paymentData.value || paymentPending.value) schedulePaymentPoll(0)
  }
})

const normaliseError = (caught: unknown): CheckoutApiErrorPayload => {
  if (!caught || typeof caught !== 'object') return {}
  const data = (caught as { data?: unknown }).data
  return data && typeof data === 'object' ? data as CheckoutApiErrorPayload : {}
}

const focusFirstError = () => {
  nextTick(() => {
    const element = document.querySelector<HTMLElement>('[aria-invalid="true"]')
    element?.focus()
  })
}

const placeOrder = async () => {
  if (isSubmitting.value || orderResult.value) return
  submitError.value = ''
  serverFieldErrors.value = {}
  if (!isFormValid.value) {
    submitError.value = 'Vui lòng hoàn thiện các thông tin bắt buộc và cập nhật báo giá trước khi đặt hàng.'
    focusFirstError()
    return
  }

  isSubmitting.value = true
  try {
    const response = await $fetch<CheckoutOrderResponse>(`${config.public.apiBase}/orders`, {
      method: 'POST',
      headers: {
        ...getCartHeaders(),
        ...(auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : {}),
      },
      body: {
        checkout_idempotency_key: checkoutIdempotencyKey.value,
        order_access_token: orderAccessToken.value,
        checkout_mode: checkoutMode.value,
        quote_id: quotes.quote.value?.quote_id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        shipping_address: form.shipping_address.trim(),
        shipping_city: selectedProvince.value?.fullname ?? form.shipping_city,
        shipping_district: form.shipping_district.trim() || null,
        shipping_ward: selectedWard.value?.fullname ?? form.shipping_ward,
        shipping_province_code: form.shipping_province_code,
        shipping_ward_code: form.shipping_ward_code,
        shipping_method: form.shipping_method,
        notes: form.notes,
        payment_method: form.payment_method,
        items: displayLines.value.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      },
    })

    orderResult.value = response.order
    saveAttempt(response.order)
    if (checkoutMode.value === 'buy_now') clearBuyNow()
    toast.add({ title: 'Đơn hàng đã được ghi nhận', description: `Mã đơn hàng: ${response.order.order_number}`, color: 'success' })

    if (response.order.payment_method === 'sepay' && response.payment && response.order.can_pay) {
      paymentData.value = response.payment
      paymentPending.value = false
      schedulePaymentPoll(5000)
    } else if (response.order.payment_method === 'sepay') {
      paymentPending.value = true
      schedulePaymentPoll(5000)
    } else {
      await router.push(`/don-hang/${response.order.id}/thanh-cong`)
    }
  } catch (caught) {
    const payload = normaliseError(caught)
    submitError.value = payload.message ?? 'Không thể ghi nhận đơn hàng. Vui lòng kiểm tra lại thông tin.'
    if (payload.errors) {
      serverFieldErrors.value = Object.fromEntries(Object.entries(payload.errors).map(([key, messages]) => [key, messages[0] ?? 'Thông tin chưa hợp lệ.']))
    }
    if (payload.error_code === 'CHECKOUT_QUOTE_STALE' || payload.error_code === 'CHECKOUT_QUOTE_EXPIRED') {
      await refreshQuote()
    }
    focusFirstError()
  } finally {
    isSubmitting.value = false
  }
}

let paymentPollTimer: ReturnType<typeof setTimeout> | null = null
let paymentPollInFlight = false

const stopPaymentPoll = () => {
  if (paymentPollTimer) clearTimeout(paymentPollTimer)
  paymentPollTimer = null
}

const schedulePaymentPoll = (delay = 5000) => {
  stopPaymentPoll()
  if (!orderResult.value || paymentVerified.value || document.visibilityState === 'hidden') return
  paymentPollTimer = setTimeout(() => { void checkPaymentStatus() }, delay)
}

const isTerminalPaymentOrder = (order: Pick<CheckoutOrder, 'order_status' | 'kiot_sync_status'>) =>
  order.order_status === 'cancelled' || ['cancelled', 'rejected'].includes(order.kiot_sync_status)

const checkPaymentStatus = async () => {
  if (!orderResult.value || paymentPollInFlight || paymentVerified.value || document.visibilityState === 'hidden') return
  paymentPollInFlight = true
  checkingPayment.value = true
  try {
    const response = await $fetch<{
      paid: boolean
      can_pay: boolean
      payment_status: string
      order_status: string
      kiot_sync_status: string
      payment?: CheckoutPaymentData | null
    }>(`${config.public.apiBase}/orders/${orderResult.value.id}/check-payment`, {
      headers: {
        ...getCartHeaders(),
        'X-Order-Access-Token': orderAccessToken.value,
        ...(auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : {}),
      },
    })
    if (response.payment && response.can_pay) {
      paymentData.value = response.payment
      paymentPending.value = false
    }
    if (response.paid) {
      paymentPending.value = false
      paymentVerified.value = true
      stopPaymentPoll()
      toast.add({ title: 'Thanh toán đã được xác nhận', description: 'Đang chuyển tới trang chi tiết đơn hàng.', color: 'success' })
      window.setTimeout(() => { void router.push(`/don-hang/${orderResult.value?.id}/thanh-cong`) }, 1400)
    } else if (!response.can_pay && isTerminalPaymentOrder({ order_status: response.order_status, kiot_sync_status: response.kiot_sync_status })) {
      paymentPending.value = false
      stopPaymentPoll()
      submitError.value = 'Đơn hàng không còn đủ điều kiện thanh toán trực tuyến. Vui lòng liên hệ cửa hàng để được hỗ trợ.'
    } else {
      schedulePaymentPoll(5000)
    }
  } catch {
    schedulePaymentPoll(10000)
  } finally {
    checkingPayment.value = false
    paymentPollInFlight = false
  }
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible' && orderResult.value && !paymentVerified.value) {
    schedulePaymentPoll(0)
  } else if (document.visibilityState === 'hidden') {
    stopPaymentPoll()
  }
}

const copyToClipboard = async (value: string, field: string) => {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const element = document.createElement('textarea')
    element.value = value
    element.setAttribute('readonly', '')
    element.style.position = 'fixed'
    element.style.opacity = '0'
    document.body.appendChild(element)
    element.select()
    document.execCommand('copy')
    element.remove()
  }
  copiedField.value = field
  window.setTimeout(() => {
    if (copiedField.value === field) copiedField.value = ''
  }, 1800)
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onBeforeUnmount(() => {
  stopPaymentPoll()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

useSeoMeta({
  title: () => `Thanh toán - ${siteName.value}`,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <div class="checkout-page">
    <div class="pc-container checkout-container">
      <nav class="checkout-breadcrumb" aria-label="Đường dẫn">
        <NuxtLink to="/">Trang chủ</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/gio-hang">Giỏ hàng</NuxtLink>
        <span aria-hidden="true">/</span>
        <strong>Thanh toán</strong>
      </nav>

      <header class="checkout-page-heading">
        <div>
          <h1>Thanh toán</h1>
          <p>Vui lòng kiểm tra thông tin và hoàn tất đơn hàng</p>
        </div>
        <CheckoutProgress :current="2" />
      </header>

      <div v-if="pageLoading || buyNowLoading" class="checkout-skeleton" aria-live="polite" aria-busy="true">
        <div class="checkout-skeleton-main">
          <div v-for="item in 5" :key="item" class="checkout-skeleton-section"><span /><span /><span /></div>
        </div>
        <div class="checkout-skeleton-summary"><span /><span /><span /><span /></div>
      </div>

      <section v-else-if="pageError || hasCartError" class="checkout-state-card" role="alert">
        <CartIcon name="help" size="34" />
        <h2>{{ pageError ?? 'Không thể tải giỏ hàng' }}</h2>
        <p>{{ hasCartError ? 'Vui lòng kiểm tra kết nối rồi thử lại. Dữ liệu checkout chưa bị xóa.' : 'Vui lòng quay lại sản phẩm và tạo lại phiên mua hàng.' }}</p>
        <button v-if="hasCartError" type="button" class="checkout-primary-button" @click="cart.fetchCart">Thử lại</button>
        <NuxtLink v-else to="/" class="checkout-primary-button">Tiếp tục mua sắm</NuxtLink>
      </section>

      <section v-else-if="!sourceHasItems" class="checkout-state-card" role="status">
        <CartIcon name="cart" size="34" />
        <h2>Chưa có sản phẩm để thanh toán</h2>
        <p>Hãy chọn sản phẩm trước khi tiếp tục checkout.</p>
        <NuxtLink :to="checkoutMode === 'buy_now' ? '/san-pham' : '/gio-hang'" class="checkout-primary-button">Quay lại</NuxtLink>
      </section>

      <form v-else id="checkout-form" class="checkout-form" @submit.prevent="placeOrder">
        <div class="checkout-layout">
          <main class="checkout-main-column">
            <div v-if="submitError || quotes.error.value || quoteIssues.length" class="checkout-issue-summary" role="alert" aria-live="assertive">
              <CartIcon name="help" size="18" />
              <div>
                <strong>{{ submitError || quotes.error.value || 'Cần cập nhật lại một số thông tin' }}</strong>
                <p v-if="quoteIssues.length">{{ quoteIssues[0]?.message }}</p>
              </div>
            </div>

            <section v-if="!auth.isAuthenticated.value && !orderResult" class="checkout-auth-prompt">
              <span class="checkout-auth-prompt-icon"><CartIcon name="user" size="19" /></span>
              <div><strong>Đã có tài khoản tại PC Center?</strong><p>Đăng nhập để đồng bộ giỏ hàng và tự động điền thông tin cho lần thanh toán này.</p></div>
              <NuxtLink :to="{ path: '/dang-nhap', query: { redirect: authRedirect } }">Đăng nhập <CartIcon name="arrow-right" size="14" /></NuxtLink>
            </section>

            <CheckoutSection :number="1" title="Thông tin khách hàng" icon="user">
              <div class="checkout-fields checkout-fields-three">
                <div class="checkout-field">
                  <label for="customer-name">Họ và tên <span>*</span></label>
                  <input id="customer-name" v-model="form.customer_name" type="text" autocomplete="name" maxlength="255" placeholder="Nhập họ và tên" :aria-invalid="Boolean(issueFor('customer_name'))">
                  <small v-if="issueFor('customer_name')">{{ issueFor('customer_name') }}</small>
                </div>
                <div class="checkout-field">
                  <label for="customer-phone">Số điện thoại <span>*</span></label>
                  <input id="customer-phone" v-model="form.customer_phone" type="tel" autocomplete="tel" maxlength="20" placeholder="Nhập số điện thoại" :aria-invalid="Boolean(issueFor('customer_phone'))">
                  <small v-if="issueFor('customer_phone')">{{ issueFor('customer_phone') }}</small>
                </div>
                <div class="checkout-field">
                  <label for="customer-email">Email <span>*</span></label>
                  <input id="customer-email" v-model="form.customer_email" type="email" autocomplete="email" maxlength="255" placeholder="Nhập email nhận thông tin đơn hàng" :aria-invalid="Boolean(issueFor('customer_email'))">
                  <small v-if="issueFor('customer_email')">{{ issueFor('customer_email') }}</small>
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection :number="2" title="Địa chỉ nhận hàng" icon="location">
              <div class="checkout-fields checkout-fields-three">
                <div class="checkout-field">
                  <label for="shipping-province">Tỉnh/Thành phố <span>*</span></label>
                  <select id="shipping-province" v-model="form.shipping_province_code" :disabled="locations.provincesLoading" :aria-invalid="Boolean(issueFor('shipping_province_code') || issueFor('location'))">
                    <option value="">Chọn tỉnh/thành phố</option>
                    <option v-for="province in locations.provinces" :key="province.code" :value="province.code">{{ province.fullname }}</option>
                  </select>
                  <div v-if="locations.error" class="checkout-field-status" role="alert">{{ locations.error }} <button type="button" @click="locations.retryProvinces">Thử lại</button></div>
                  <small v-if="issueFor('shipping_province_code') || issueFor('location')">{{ issueFor('shipping_province_code') || issueFor('location') }}</small>
                </div>
                <div class="checkout-field">
                  <label for="shipping-district">Quận/Huyện <em>(không bắt buộc)</em></label>
                  <input id="shipping-district" v-model="form.shipping_district" type="text" maxlength="100" placeholder="Nhập quận/huyện nếu cần">
                </div>
                <div class="checkout-field">
                  <label for="shipping-ward">Phường/Xã <span>*</span></label>
                  <select id="shipping-ward" v-model="form.shipping_ward_code" :disabled="!form.shipping_province_code || locations.wardsLoading" :aria-invalid="Boolean(issueFor('shipping_ward_code') || issueFor('location'))">
                    <option value="">{{ locations.wardsLoading ? 'Đang tải xã/phường…' : 'Chọn xã/phường' }}</option>
                    <option v-for="ward in locations.wards" :key="ward.code" :value="ward.code">{{ ward.fullname }}</option>
                  </select>
                  <div v-if="locations.wardError" class="checkout-field-status" role="alert">{{ locations.wardError }} <button type="button" @click="locations.retryWards(form.shipping_province_code)">Thử lại</button></div>
                  <small v-if="issueFor('shipping_ward_code') || issueFor('location')">{{ issueFor('shipping_ward_code') || issueFor('location') }}</small>
                </div>
                <div class="checkout-field checkout-field-wide">
                  <label for="shipping-address">Địa chỉ chi tiết <span>*</span></label>
                  <input id="shipping-address" v-model="form.shipping_address" type="text" autocomplete="street-address" maxlength="500" placeholder="Số nhà, tên đường, tòa nhà…" :aria-invalid="Boolean(issueFor('shipping_address'))">
                  <small v-if="issueFor('shipping_address')">{{ issueFor('shipping_address') }}</small>
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection :number="3" title="Phương thức giao hàng" icon="truck">
              <fieldset class="checkout-radio-group">
                <legend class="sr-only">Phương thức giao hàng</legend>
                <label v-for="shipping in (quotes.quote?.shipping_methods ?? [])" :key="shipping.code" class="checkout-radio-card" :class="{ 'is-selected': form.shipping_method === shipping.code, 'is-disabled': !shipping.available }">
                  <input v-model="form.shipping_method" type="radio" name="shipping_method" :value="shipping.code" :disabled="!shipping.available || Boolean(orderResult)">
                  <span class="checkout-radio-mark" aria-hidden="true" />
                  <CartIcon name="truck" size="22" />
                  <span class="checkout-radio-copy"><strong>{{ shipping.label }}</strong><small>{{ shipping.description }}<template v-if="shipping.eta"> · {{ shipping.eta }}</template></small></span>
                  <strong class="checkout-radio-price">{{ shipping.fee === null ? '—' : (shipping.fee === 0 ? 'Miễn phí' : formatMoney(shipping.fee)) }}</strong>
                </label>
                <p v-if="!quotes.quote?.shipping_methods.length" class="checkout-muted">Đang cập nhật phương thức giao hàng từ hệ thống.</p>
              </fieldset>
            </CheckoutSection>

            <CheckoutSection :number="4" title="Phương thức thanh toán" icon="card">
              <fieldset class="checkout-radio-group">
                <legend class="sr-only">Phương thức thanh toán</legend>
                <label v-for="method in paymentMethods" :key="method.code" class="checkout-radio-card checkout-payment-card" :class="{ 'is-selected': form.payment_method === method.code, 'is-disabled': !method.available }">
                  <input v-model="form.payment_method" type="radio" name="payment_method" :value="method.code" :disabled="!method.available || Boolean(orderResult)">
                  <span class="checkout-radio-mark" aria-hidden="true" />
                  <span class="checkout-payment-symbol" aria-hidden="true"><CartIcon :name="method.code === 'sepay' ? 'qr' : 'cash'" size="22" /></span>
                  <span class="checkout-radio-copy"><strong>{{ method.label }}</strong><small>{{ method.description }}</small></span>
                  <span class="checkout-method-badge">{{ method.code === 'cod' ? 'COD' : 'SePay' }}</span>
                </label>
                <p v-if="!paymentMethods.length" class="checkout-muted">Chưa có phương thức thanh toán khả dụng. Vui lòng liên hệ cửa hàng.</p>
              </fieldset>

              <div v-if="form.payment_method === 'sepay' && !paymentData && !paymentPending" class="checkout-payment-hint" role="status">
                <CartIcon name="info" size="17" />
                <span>Mã QR sẽ được tạo sau khi đơn hàng được ghi nhận và backend xác nhận đủ điều kiện thanh toán.</span>
              </div>
              <div v-if="paymentPending && !paymentData" class="checkout-payment-pending" role="status" aria-live="polite">
                <span class="checkout-spinner" aria-hidden="true" />
                <span>Đơn hàng đã được ghi nhận. Đang chờ hệ thống kho xác nhận để mở thanh toán SePay.</span>
                <button type="button" class="checkout-link-button" :disabled="checkingPayment" @click="checkPaymentStatus">Kiểm tra lại</button>
              </div>
              <CheckoutSepayPanel v-if="paymentData" :payment="paymentData" :format-money="formatMoney" :verified="paymentVerified" :checking="checkingPayment" :copied-field="copiedField" @copy="copyToClipboard" @check="checkPaymentStatus" />
            </CheckoutSection>

            <CheckoutSection :number="5" title="Ghi chú đơn hàng" icon="file" description="(tùy chọn)">
              <div class="checkout-field">
                <label for="order-notes">Ghi chú cho người giao hàng</label>
                <textarea id="order-notes" v-model="form.notes" maxlength="1000" rows="4" placeholder="Ví dụ: Giao hàng trong giờ hành chính…" :aria-invalid="Boolean(issueFor('notes'))" />
                <div class="checkout-counter" :class="{ 'is-limit': form.notes.length >= 1000 }">{{ form.notes.length }}/1000</div>
                <small v-if="issueFor('notes')">{{ issueFor('notes') }}</small>
              </div>
            </CheckoutSection>
          </main>

          <CheckoutOrderSummary
            :quote="quotes.quote.value"
            :lines="displayLines"
            :payment-methods="paymentMethods"
            :format-money="formatMoney"
            :benefits="cartResponse.benefits"
            :support="cartResponse.support"
            :loading="quoteLoading"
            :submitting="isSubmitting"
            :disabled="!isFormValid"
            :mode="checkoutMode"
          />
        </div>
      </form>

      <div v-if="sourceHasItems && !pageLoading" class="checkout-mobile-bar">
        <span class="checkout-mobile-total"><small>Tổng cộng</small><strong>{{ mobileTotal === null || mobileTotal === undefined ? '—' : formatMoney(mobileTotal) }}</strong></span>
        <button type="submit" form="checkout-form" :disabled="!isFormValid || isSubmitting || Boolean(orderResult)">{{ isSubmitting ? 'Đang xử lý…' : 'Đặt hàng' }} <CartIcon name="arrow-right" size="16" /></button>
      </div>
    </div>
  </div>
</template>
