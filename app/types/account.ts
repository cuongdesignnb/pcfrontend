import type { BuilderProduct, BuilderSelection } from '~/types/pc-builder'
import type { ProductCard } from '~/types/product-detail'

export interface AccountAddress {
  id: number
  label: string | null
  full_name: string
  phone: string
  province: string
  province_code: string | null
  district: string | null
  ward: string
  ward_code: string | null
  street: string
  full_address: string
  is_default: boolean
}

export interface AccountUser {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  created_at: string | null
  default_address?: AccountAddress | null
}

export interface AccountStats {
  orders: number
  wishlist: number
  saved_builds: number
  total_spent: number
}

export interface AccountOrderItemPreview {
  id: number
  product_id: number | null
  product_name: string
  quantity: number
  image: { url: string | null; alt: string | null } | null
}

export interface AccountOrderSummary {
  id: number
  order_number: string
  created_at: string | null
  total: number
  payment_status: string
  order_status: string
  display_status: { code: string; label: string }
  status_label: string
  items_count: number
  additional_item_count: number
  representative_item: AccountOrderItemPreview | null
}

export interface AccountBuildPart {
  component_type: { id: number; name: string; slug: string } | null
  product: BuilderProduct
}

export interface AccountSavedBuild {
  id: number
  name: string
  build: BuilderSelection
  total_price: number
  total_tdp: number
  created_at: string | null
  parts: AccountBuildPart[]
  preview_images: string[]
}

export interface AccountBanner {
  id: number
  title: string | null
  description: string | null
  badge: string | null
  image: string | null
  link: string | null
}

export interface AccountDashboard {
  user: AccountUser
  stats: AccountStats
  loyalty: null
  recent_orders: AccountOrderSummary[]
  saved_builds: AccountSavedBuild[]
  wishlist: ProductCard[]
  banner: AccountBanner | null
  capabilities: {
    loyalty: boolean
    addresses: boolean
    wishlist: boolean
    saved_builds: boolean
    warranty: boolean
  }
}

export interface AccountOrderDetail extends AccountOrderSummary {
  items: Array<{
    id: number
    product_id: number | null
    product_name: string
    variant_name: string | null
    sku: string
    quantity: number
    price: number
    total: number
    image: { url: string | null; alt: string | null } | null
  }>
  shipping: {
    name: string
    phone: string
    email: string | null
    address: string
    city: string | null
    district: string | null
    ward: string | null
  }
}

export interface AccountWarranty {
  id: string
  order_number: string
  product_name: string
  product_slug: string | null
  image: { url: string | null; alt: string | null } | null
  warranty_months: number | null
  purchased_at: string
  expires_at: string | null
  status: 'active' | 'expired' | 'unknown'
}
