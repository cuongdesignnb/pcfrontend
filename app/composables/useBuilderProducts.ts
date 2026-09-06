import type {
  BuilderCompatibleResponse,
  BuilderFiltersState,
  BuilderProductOption,
  BuilderSelection,
  BuilderFilterOptions,
  BuilderSort,
} from '~/types/pc-builder'

const initialFilters = (): BuilderFiltersState => ({
  query: '',
  brand_ids: [],
  price_min: null,
  price_max: null,
  specs: {},
  only_compatible: true,
  on_sale: false,
})

export const useBuilderProducts = () => {
  const config = useRuntimeConfig()
  const options = ref<BuilderProductOption[]>([])
  const filterOptions = ref<BuilderFilterOptions>({ brands: [], specifications: {} })
  const meta = ref<BuilderCompatibleResponse['meta']>({ current_page: 1, last_page: 1, per_page: 24, total: 0 })
  const filters = ref<BuilderFiltersState>(initialFilters())
  const sort = ref<BuilderSort>('compatibility')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0

  const resetFilters = () => {
    filters.value = initialFilters()
    sort.value = 'compatibility'
  }

  const load = async (componentTypeSlug: string, build: BuilderSelection, page = 1) => {
    const currentRequest = ++requestId
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<BuilderCompatibleResponse>(
        `${config.public.apiBase}/builder/compatible/${encodeURIComponent(componentTypeSlug)}`,
        {
          method: 'POST',
          body: {
            build,
            filters: {
              ...filters.value,
              sort: sort.value,
              page,
              per_page: 24,
            },
          },
        },
      )

      if (currentRequest !== requestId) return
      options.value = response.products || []
      filterOptions.value = response.filters || { brands: [], specifications: {} }
      meta.value = response.meta || meta.value
    } catch (cause) {
      if (currentRequest !== requestId) return
      options.value = []
      error.value = cause instanceof Error ? cause.message : 'Không thể tải danh sách linh kiện.'
    } finally {
      if (currentRequest === requestId) isLoading.value = false
    }
  }

  const setFilter = <K extends keyof BuilderFiltersState>(key: K, value: BuilderFiltersState[K]) => {
    filters.value = { ...filters.value, [key]: value }
  }

  const setSpecFilter = (key: string, values: string[]) => {
    const specs = { ...filters.value.specs }
    if (values.length) specs[key] = values
    else delete specs[key]
    filters.value = { ...filters.value, specs }
  }

  return {
    options,
    filterOptions,
    meta,
    filters,
    sort,
    isLoading,
    error,
    resetFilters,
    load,
    setFilter,
    setSpecFilter,
  }
}
