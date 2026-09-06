import type { ProductCard } from '~/types/product-detail'

export interface CartVariant {
  id: number
  name: string
  sku: string | null
  attributes: Record<string, string> | null
  pricing: {
    price: number
    sale_price: number | null
    display_price: number
  }
  inventory: {
    available_quantity: number
    is_available: boolean
  }
}

export interface CartItemAvailability {
  purchasable: boolean
  available_quantity: number
  label: string
}

export interface CartPricing {
  original_unit_price: number
  unit_price: number
  saving_per_unit: number
  line_original: number
  line_total: number
  line_saving: number
  discount_percent: number
}

export interface CartInventory {
  max_quantity: number
  available_quantity: number
  purchasable: boolean
  availability_label: string
}

export interface CartItem {
  id: number
  product_id: number
  variant_id: number | null
  quantity: number
  selected: boolean
  /** Legacy price snapshot retained by the API for compatibility. */
  price: number | string
  unit_price: number
  original_unit_price: number
  line_subtotal: number
  line_discount: number
  pricing: CartPricing
  inventory: CartInventory
  price_changed: boolean
  previous_unit_price: number | null
  /** Legacy availability shape retained for existing consumers. */
  availability: CartItemAvailability
  product: ProductCard | null
  variant: CartVariant | null
}

export interface CartSummary {
  item_count: number
  selected_item_count: number
  original_subtotal: number
  subtotal: number
  payable_before_shipping: number
  coupon_discount: number
  product_discount: number
  shipping: {
    free_threshold: number
    amount_remaining_for_free_shipping: number
    eligible_for_free_shipping: boolean
    estimated_fee: number
    /** Legacy aliases retained for existing consumers. */
    default_fee: number
    free_shipping_remaining: number
    is_free: boolean
  }
  /** Legacy aliases retained for existing consumers. */
  line_count: number
  selected_line_count: number
  quantity: number
  shipping_fee: number
  total: number
}

export interface CartBenefit {
  key: string
  title: string
  description: string
  icon: string
}

export interface CartPaymentMethod {
  key: string
  label: string
  provider: string
}

export interface CartCoupon {
  code: string
  discount: number
}

export interface CartResponse {
  id: number
  items: CartItem[]
  summary: CartSummary
  coupon: CartCoupon | null
  cart: {
    id: number
    item_count: number
    quantity: number
    selected_quantity: number
  }
  accessories: ProductCard[]
  recommendations: ProductCard[]
  benefits: CartBenefit[]
  payment_methods: CartPaymentMethod[]
  support: {
    hotline: string
    hours: string
  }
  total: number
  count: number
  selected_count: number
  message?: string
}

export interface CartRecommendationsResponse {
  accessories: ProductCard[]
  recommendations: ProductCard[]
}
