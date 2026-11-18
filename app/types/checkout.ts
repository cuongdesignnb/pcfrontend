import type { WarrantyPackage } from '~/types/product-detail'
import type { CartItem } from '~/types/cart'

export interface CheckoutLocation {
  name: string
  code: string
  type: string
  typename: string
  fullname: string
}

export interface CheckoutLocationDataset {
  provinces: CheckoutLocationWithWards[]
}

export interface CheckoutLocationWithWards extends CheckoutLocation {
  wards: CheckoutLocation[]
}

export interface CheckoutLine {
  key: string
  product_id: number
  variant_id: number | null
  name: string
  variant_name: string | null
  sku: string | null
  quantity: number
  unit_price: number
  original_unit_price: number
  line_total: number
  line_discount: number
  image: string | null
  warranty?: WarrantyPackage | null
}

export interface CheckoutSummary {
  line_count: number
  total_quantity: number
  original_subtotal: number
  product_discount: number
  subtotal: number
  coupon_discount: number
  referral_discount?: number
  shipping_fee: number | null
  total: number | null
  tax_label: string | null
}

export interface CheckoutShippingMethod {
  code: string
  label: string
  description: string
  available: boolean
  disabled_reason: string | null
  fee: number | null
  eta: string | null
  // False for store pickup: no delivery address is needed.
  requires_address?: boolean
  pickup_address?: string | null
}

export interface CheckoutPaymentMethod {
  code: 'cod' | 'sepay' | string
  label: string
  description: string
  available: boolean
  disabled_reason: string | null
  // SePay only: what a deposit would be for the quoted total, null when not offered.
  deposit_amount?: number | null
  // SePay only: the deposit must be paid first (COD is closed for this order).
  deposit_required?: boolean
}

export interface CheckoutIssue {
  field: string
  code: string
  message: string
}

export interface CheckoutCapabilities {
  coupons: boolean
  saved_addresses: boolean
  marketing_subscription: boolean
}

export interface CheckoutCoupon {
  code: string
  discount: number
  message?: string
}

export interface CheckoutQuote {
  quote_id: string
  expires_at: string
  checkout_mode: 'cart' | 'buy_now'
  currency: string
  items: CheckoutLine[]
  summary: CheckoutSummary
  shipping_methods: CheckoutShippingMethod[]
  // The method the totals use: the requested one, or the first the shop has turned on.
  shipping_method?: string
  payment_methods: CheckoutPaymentMethod[]
  required_deposit?: number | null
  coupon: CheckoutCoupon | null
  referral?: CheckoutReferral
  capabilities: CheckoutCapabilities
  issues: CheckoutIssue[]
  can_place_order: boolean
}

export interface CheckoutQuoteRequest {
  checkout_mode: 'cart' | 'buy_now'
  items?: Array<{
    product_id: number
    variant_id: number | null
    warranty_months?: number | null
    quantity: number
  }>
  shipping_province_code: string
  shipping_ward_code: string
  shipping_method: string
  payment_method: string
  customer_phone?: string
  referral_code?: string
}

export interface CheckoutForm {
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_city: string
  shipping_district: string
  shipping_ward: string
  shipping_province_code: string
  shipping_ward_code: string
  shipping_method: string
  payment_method: string
  payment_option: 'full' | 'deposit'
  notes: string
  referral_code: string
  video_code: string
}

/** CTV referral code result; a wrong code never blocks the order. */
export interface CheckoutReferral {
  code: string | null
  affiliate_name: string | null
  discount: number
  message: string | null
}

export interface CheckoutPaymentData {
  qr_url: string
  bank_code: string
  bank_account: string
  account_name: string
  amount: number
  purpose?: 'full' | 'deposit' | 'remaining'
  transfer_content: string
  order_number: string
}

export interface CheckoutOrder {
  id: number
  order_number: string
  payment_method: string
  payment_status: string
  payment_option?: 'full' | 'deposit' | null
  deposit_amount?: number | string | null
  amount_paid?: number | string
  remaining_amount?: number
  order_status: string
  subtotal: number | string
  discount: number | string
  shipping_fee: number | string
  shipping_method?: string
  shipping_method_label?: string
  total: number | string
  shipping_city: string | null
  shipping_ward: string | null
  can_pay: boolean
  kiot_sync_status: string
  // "awaiting_deposit" (Chờ cọc) / "awaiting_payment" (Chờ thanh toán) until SePay confirms the money.
  payment_stage?: 'awaiting_deposit' | 'awaiting_payment' | null
  payment_stage_label?: string | null
}

export interface CheckoutOrderResponse {
  message: string
  order: CheckoutOrder
  payment: CheckoutPaymentData | null
  integration_status?: string
}

export interface CheckoutApiErrorPayload {
  message?: string
  error_code?: string
  errors?: Record<string, string[]>
  integration_status?: string
}

export const cartItemToCheckoutLine = (item: CartItem): CheckoutLine => ({
  key: `${item.product_id}:${item.variant_id ?? 'base'}`,
  product_id: item.product_id,
  variant_id: item.variant_id,
  name: item.product?.name ?? 'Sản phẩm',
  variant_name: item.variant?.name ?? null,
  sku: item.variant?.sku ?? item.product?.sku ?? null,
  quantity: item.quantity,
  unit_price: item.pricing.unit_price,
  original_unit_price: item.pricing.original_unit_price,
  line_total: item.pricing.line_total,
  line_discount: item.pricing.line_saving,
  image: item.product?.images?.[0]?.url ?? null,
  warranty: item.warranty ?? null,
})
