import type { ComputedRef } from 'vue'
import type {
  CategoryListingResponse,
  CategoryListingFilters,
} from '~/types/category-listing'

export const categorySortOptions = [
  { value: 'popular', label: 'Bán chạy nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'name_asc', label: 'Tên A - Z' },
  { value: 'name_desc', label: 'Tên Z - A' },
] as const

const emptyFilters = (): CategoryListingFilters => ({
  brands: [],
  price_range: { min: 0, max: 0 },
  price_presets: [],
  groups: [],
  specs: [],
})

const emptyResponse = (): CategoryListingResponse => ({
  category: null,
  promo_banner: null,
  products: { data: [], current_page: 1, last_page: 1, per_page: 24, total: 0 },
  recommendations: [],
  filters: emptyFilters(),
})

type QueryValue = string | string[] | null | undefined

export const useCategoryListing = (slug: ComputedRef<string>) => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const router = useRouter()

  const queryValue = (key: string): string => {
    const value = route.query[key] as QueryValue
    if (Array.isArray(value)) return value.join(',')
    return typeof value === 'string' ? value : ''
  }

  const csv = (value: string): string[] => value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const initialPage = Number(queryValue('page'))
  const page = ref(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1)
  const sort = ref(
    categorySortOptions.some(option => option.value === queryValue('sort'))
      ? queryValue('sort')
      : 'popular',
  )
  const selectedBrands = ref(csv(queryValue('brands')))
  const selectedSubCategory = ref(queryValue('sub_category'))
  const minPrice = ref<number | undefined>(toPrice(queryValue('min_price')))
  const maxPrice = ref<number | undefined>(toPrice(queryValue('max_price')))
  const inStock = ref(queryValue('in_stock') === '1')
  const dynamicFilters = ref<Record<string, string[]>>(readPrefixedQueries('f_'))
  const specFilters = ref<Record<string, string[]>>(readPrefixedQueries('spec_'))
  const viewMode = ref<'grid' | 'list'>('grid')

  const queryParams = computed<Record<string, string | number>>(() => {
    const params: Record<string, string | number> = {
      page: page.value,
      per_page: 24,
      sort: sort.value,
    }
    if (selectedBrands.value.length) params.brands = selectedBrands.value.join(',')
    if (selectedSubCategory.value) params.sub_category = selectedSubCategory.value
    if (minPrice.value !== undefined) params.min_price = minPrice.value
    if (maxPrice.value !== undefined) params.max_price = maxPrice.value
    if (inStock.value) params.in_stock = '1'
    for (const [filterSlug, values] of Object.entries(dynamicFilters.value)) {
      if (values.length) params[`f_${filterSlug}`] = values.join(',')
    }
    for (const [filterKey, values] of Object.entries(specFilters.value)) {
      if (values.length) params[filterKey] = values.join(',')
    }
    return params
  })

  const endpoint = computed(() => `${config.public.apiBase}/categories/${encodeURIComponent(slug.value)}`)
  const { data, status, error } = useFetch<CategoryListingResponse>(endpoint, {
    params: queryParams,
    watch: [endpoint, queryParams],
    default: emptyResponse,
  })

  function readPrefixedQueries(prefix: string): Record<string, string[]> {
    const values: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(route.query)) {
      if (!key.startsWith(prefix)) continue
      const items = csv(Array.isArray(value) ? value.join(',') : String(value || ''))
      if (items.length) values[key.slice(prefix.length)] = items
    }
    return values
  }

  function toPrice(value: string): number | undefined {
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }

  function resetPage() {
    page.value = 1
  }

  function toggleBrand(brandSlug: string) {
    selectedBrands.value = toggleValue(selectedBrands.value, brandSlug)
    resetPage()
  }

  function toggleSubCategory(categorySlug: string) {
    selectedSubCategory.value = selectedSubCategory.value === categorySlug ? '' : categorySlug
    resetPage()
  }

  function toggleDynamicFilter(filterSlug: string, valueSlug: string) {
    dynamicFilters.value = toggleRecordValue(dynamicFilters.value, filterSlug, valueSlug)
    resetPage()
  }

  function toggleSpec(filterKey: string, value: string) {
    specFilters.value = toggleRecordValue(specFilters.value, filterKey, value)
    resetPage()
  }

  function applyPrice(min: number | undefined, max: number | undefined) {
    minPrice.value = min
    maxPrice.value = max
    resetPage()
  }

  function clearPrice() {
    applyPrice(undefined, undefined)
  }

  function clearAllFilters() {
    selectedBrands.value = []
    selectedSubCategory.value = ''
    minPrice.value = undefined
    maxPrice.value = undefined
    inStock.value = false
    dynamicFilters.value = {}
    specFilters.value = {}
    sort.value = 'popular'
    resetPage()
  }

  function removeFilter(id: string) {
    if (id.startsWith('brand:')) return toggleBrand(id.slice(6))
    if (id === 'subcategory') {
      selectedSubCategory.value = ''
      resetPage()
      return
    }
    if (id === 'price') return clearPrice()
    if (id === 'stock') {
      inStock.value = false
      resetPage()
      return
    }
    if (id.startsWith('dynamic:')) {
      const [, filterSlug, valueSlug] = id.split(':')
      if (!filterSlug || !valueSlug) return
      return toggleDynamicFilter(filterSlug, valueSlug)
    }
    if (id.startsWith('spec:')) {
      const valueSeparator = id.indexOf(':', 5)
      const filterKey = id.slice(5, valueSeparator)
      const value = decodeURIComponent(id.slice(valueSeparator + 1))
      return toggleSpec(filterKey, value)
    }
  }

  function toggleValue(values: string[], value: string): string[] {
    return values.includes(value)
      ? values.filter(item => item !== value)
      : [...values, value]
  }

  function toggleRecordValue(record: Record<string, string[]>, key: string, value: string): Record<string, string[]> {
    const values = toggleValue(record[key] || [], value)
    const next = { ...record }
    if (values.length) next[key] = values
    else delete next[key]
    return next
  }

  function urlQuery(): Record<string, string> {
    const params = queryParams.value
    const query: Record<string, string> = {}
    if (params.page !== 1) query.page = String(params.page)
    if (params.sort !== 'popular') query.sort = String(params.sort)
    for (const key of ['brands', 'sub_category', 'min_price', 'max_price', 'in_stock']) {
      if (params[key] !== undefined) query[key] = String(params[key])
    }
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('f_') || key.startsWith('spec_')) query[key] = String(value)
    }
    return query
  }

  function syncFromRoute() {
    const nextPage = Number(queryValue('page'))
    page.value = Number.isInteger(nextPage) && nextPage > 0 ? nextPage : 1
    sort.value = categorySortOptions.some(option => option.value === queryValue('sort'))
      ? queryValue('sort')
      : 'popular'
    selectedBrands.value = csv(queryValue('brands'))
    selectedSubCategory.value = queryValue('sub_category')
    minPrice.value = toPrice(queryValue('min_price'))
    maxPrice.value = toPrice(queryValue('max_price'))
    inStock.value = queryValue('in_stock') === '1'
    dynamicFilters.value = readPrefixedQueries('f_')
    specFilters.value = readPrefixedQueries('spec_')
  }

  watch(queryParams, () => {
    if (import.meta.client) void router.replace({ query: urlQuery() })
  }, { deep: true })

  watch(() => route.query, syncFromRoute, { deep: true })

  return {
    data,
    status,
    error,
    page,
    sort,
    selectedBrands,
    selectedSubCategory,
    minPrice,
    maxPrice,
    inStock,
    dynamicFilters,
    specFilters,
    viewMode,
    queryParams,
    resetPage,
    toggleBrand,
    toggleSubCategory,
    toggleDynamicFilter,
    toggleSpec,
    applyPrice,
    clearPrice,
    clearAllFilters,
    removeFilter,
  }
}
