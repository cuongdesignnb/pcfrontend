export type BuilderIssueType = 'error' | 'warning' | 'info'

export interface BuilderIssue {
  type: BuilderIssueType
  code?: string | null
  message: string
  source_type_id?: number | null
  target_type_id?: number | null
}

export interface BuilderSpecification {
  key: string | null
  label: string
  value: string
  unit: string | null
}

export interface BuilderSpecificationKey {
  id: number
  key: string
  label: string
  data_type: string | null
  unit: string | null
  is_filterable: boolean
  display_order: number
}

export interface BuilderComponentType {
  id: number
  name: string
  slug: string
  display_order: number
  is_required: boolean
  specification_keys: BuilderSpecificationKey[]
}

export interface BuilderProductImage {
  url: string | null
  alt: string | null
}

export interface BuilderProduct {
  id: number
  name: string
  slug: string
  sku?: string | null
  brand: { id: number; name: string; slug: string; logo?: string | null } | null
  category?: { id: number; name: string; slug: string } | null
  component_type?: { id: number; name: string; slug: string } | null
  image: BuilderProductImage | null
  images?: Array<BuilderProductImage & { id?: number; is_primary?: boolean }>
  pricing: { price: number; sale_price: number | null; display_price: number }
  inventory: { purchasable: boolean; availability_label: string }
  rating: { average: number | null; count: number }
  sold_count: number
  has_variants: boolean
  specifications: BuilderSpecification[]
}

export interface BuilderProductOption {
  product: BuilderProduct
  is_compatible: boolean
  issues: BuilderIssue[]
}

export interface BuilderCompletion {
  selected: number
  required_selected: number
  required_total: number
  complete: boolean
}

export interface BuilderTotals {
  price: number
  tdp: number
  recommended_psu_wattage: number | null
}

export interface BuilderCheckResponse {
  compatible: boolean
  completion: BuilderCompletion
  issues: BuilderIssue[]
  totals: BuilderTotals
  products: BuilderProduct[]
}

export interface BuilderCompatibleResponse {
  component_type: BuilderComponentType
  products: BuilderProductOption[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  filters: BuilderFilterOptions
}

export interface BuilderFilterOptions {
  brands: Array<{ id: number; name: string; count: number }>
  specifications: Record<string, string[]>
}

export interface BuilderFiltersState {
  query: string
  brand_ids: number[]
  price_min: number | null
  price_max: number | null
  specs: Record<string, string[]>
  only_compatible: boolean
  on_sale: boolean
}

export type BuilderSort = 'compatibility' | 'popular' | 'price_asc' | 'price_desc' | 'rating'
export type BuilderSelection = Record<string, number>

export interface BuilderPreset {
  id: number
  name: string
  slug: string
  description: string | null
  image: string | null
  usage_type: string | null
  products: Record<string, number>
  starting_price: number | null
  is_active: boolean
  sort_order: number
}

export interface BuilderDraft {
  version: 1
  build: BuilderSelection
}
