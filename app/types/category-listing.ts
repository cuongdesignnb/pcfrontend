import type { ProductCard } from '~/types/product-detail'

export interface CategoryListingCategory {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_path?: string | null
  canonical_url?: string | null
  product_count?: number
  parent?: CategoryListingCategory | null
  children?: CategoryListingCategory[]
}

export interface CategoryListingBrand {
  id: number
  name: string
  slug: string
  logo: string | null
  products_count?: number
}

export interface CategoryListingFilterValue {
  label: string
  slug: string
  count: number
}

export interface CategoryListingFilterGroup {
  id: number
  name: string
  slug: string
  type: 'checkbox' | 'price_range'
  match_field: string
  values: CategoryListingFilterValue[]
}

export interface CategoryListingSpecFilter {
  key_id: number
  label: string
  unit: string | null
  type: string
  values: string[]
}

export interface CategoryListingPricePreset {
  key: string
  label: string
  min: number | null
  max: number | null
}

export interface CategoryListingFilters {
  brands: CategoryListingBrand[]
  price_range: { min: number; max: number }
  price_presets: CategoryListingPricePreset[]
  groups: CategoryListingFilterGroup[]
  specs: CategoryListingSpecFilter[]
}

export interface CategoryListingBanner {
  id: number
  title: string
  description: string | null
  badge: string | null
  image: string | null
  link: string | null
  position: string
  sort_order: number
  metadata: Record<string, string | string[] | null> | null
}

export interface CategoryListingPagination {
  data: ProductCard[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface CategoryListingResponse {
  category: CategoryListingCategory | null
  promo_banner: CategoryListingBanner | null
  products: CategoryListingPagination
  recommendations: ProductCard[]
  filters: CategoryListingFilters
}

export interface CategoryActiveFilter {
  id: string
  label: string
}

export interface CategoryTrustItem {
  key: string
  title: string
  text: string
  icon: 'shield' | 'truck' | 'support' | 'refresh'
}
