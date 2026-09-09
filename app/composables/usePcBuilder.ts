import type { ProductDetail } from '~/types/product-detail'
import type {
  BuilderCheckResponse,
  BuilderComponentType,
  BuilderIssue,
  BuilderProduct,
  BuilderSelection,
} from '~/types/pc-builder'

const emptyCheck = (): BuilderCheckResponse => ({
  compatible: true,
  completion: { selected: 0, required_selected: 0, required_total: 0, complete: false },
  issues: [],
  totals: { price: 0, tdp: 0, recommended_psu_wattage: null },
  products: [],
})

const fromProductDetail = (detail: ProductDetail): BuilderProduct => ({
  id: detail.id,
  name: detail.name,
  slug: detail.slug,
  sku: detail.sku,
  brand: detail.brand,
  category: detail.category,
  component_type: detail.component_type,
  image: detail.images[0] ? { url: detail.images[0].url, alt: detail.images[0].alt } : null,
  images: detail.images,
  pricing: {
    price: detail.pricing.price,
    sale_price: detail.pricing.sale_price,
    display_price: detail.pricing.display_price,
  },
  inventory: {
    purchasable: detail.inventory.purchasable,
    availability_label: detail.inventory.availability_label,
  },
  rating: { average: detail.rating.average, count: detail.rating.count },
  sold_count: detail.sold_count,
  has_variants: detail.variants.length > 0,
  specifications: detail.specifications,
})

export const usePcBuilder = () => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const toast = useToast()
  const cart = useCart()
  const { authFetch, isAuthenticated } = useAuth()
  const persistence = useBuilderPersistence()

  const componentTypes = ref<BuilderComponentType[]>([])
  const build = ref<BuilderSelection>({})
  const selectedProducts = ref<Record<string, BuilderProduct>>({})
  const checkResult = ref<BuilderCheckResponse>(emptyCheck())
  const activeTypeSlug = ref<string | null>(null)
  const isLoadingTypes = ref(false)
  const isChecking = ref(false)
  const error = ref<string | null>(null)
  const isAddingToCart = ref(false)
  const isSaving = ref(false)
  let checkRequestId = 0

  const selectedCount = computed(() => Object.keys(selectedProducts.value).length)
  const requiredTypes = computed(() => componentTypes.value.filter(type => type.is_required))
  const missingRequired = computed(() => requiredTypes.value.filter(type => !selectedProducts.value[String(type.id)]))
  const hasErrors = computed(() => checkResult.value.issues.some(issue => issue.type === 'error'))
  const hasWarnings = computed(() => checkResult.value.issues.some(issue => issue.type === 'warning'))
  const canPurchase = computed(() => selectedCount.value > 0 && checkResult.value.completion.complete && checkResult.value.compatible && !hasErrors.value)
  const totalPrice = computed(() => checkResult.value.totals.price)
  const totalTdp = computed(() => checkResult.value.totals.tdp)
  const recommendedPsuWattage = computed(() => checkResult.value.totals.recommended_psu_wattage)

  const normalizeComponentType = (type: BuilderComponentType & { sort_order?: number }): BuilderComponentType => ({
    ...type,
    display_order: type.display_order ?? type.sort_order ?? 0,
    specification_keys: type.specification_keys || [],
  })

  const fetchComponentTypes = async () => {
    if (componentTypes.value.length) return componentTypes.value
    isLoadingTypes.value = true
    error.value = null
    try {
      const response = await $fetch<{ component_types: BuilderComponentType[] } | BuilderComponentType[]>(
        `${config.public.apiBase}/builder/component-types`,
      )
      const types = Array.isArray(response) ? response : response.component_types || []
      componentTypes.value = types.map(normalizeComponentType).sort((a, b) => a.display_order - b.display_order)
      if (!activeTypeSlug.value) activeTypeSlug.value = componentTypes.value[0]?.slug || null
      return componentTypes.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Không thể tải cấu hình PC Builder.'
      return []
    } finally {
      isLoadingTypes.value = false
    }
  }

  const syncSelectedProducts = (products: BuilderProduct[]) => {
    const byId = new Map(products.map(product => [product.id, product]))
    const next: Record<string, BuilderProduct> = {}
    for (const [typeId, productId] of Object.entries(build.value)) {
      const product = byId.get(productId) || selectedProducts.value[typeId]
      if (product) next[typeId] = product
    }
    selectedProducts.value = next
  }

  const check = async (): Promise<BuilderCheckResponse | null> => {
    const currentRequest = ++checkRequestId
    isChecking.value = true
    error.value = null
    try {
      const response = await $fetch<BuilderCheckResponse>(`${config.public.apiBase}/builder/check`, {
        method: 'POST',
        body: { build: build.value },
      })
      if (currentRequest !== checkRequestId) return response
      checkResult.value = response
      syncSelectedProducts(response.products || [])
      persistence.saveDraft(build.value)
      return response
    } catch (cause) {
      if (currentRequest === checkRequestId) error.value = cause instanceof Error ? cause.message : 'Không thể kiểm tra cấu hình.'
      return null
    } finally {
      if (currentRequest === checkRequestId) isChecking.value = false
    }
  }

  const selectProduct = async (type: BuilderComponentType, product: BuilderProduct) => {
    build.value = { ...build.value, [String(type.id)]: product.id }
    selectedProducts.value = { ...selectedProducts.value, [String(type.id)]: product }
    activeTypeSlug.value = type.slug
    await check()
  }

  const removeProduct = async (type: BuilderComponentType) => {
    const nextBuild = { ...build.value }
    delete nextBuild[String(type.id)]
    build.value = nextBuild
    const nextSelected = { ...selectedProducts.value }
    delete nextSelected[String(type.id)]
    selectedProducts.value = nextSelected
    await check()
  }

  const replaceBuild = async (nextBuild: BuilderSelection) => {
    build.value = { ...nextBuild }
    selectedProducts.value = {}
    await check()
  }

  const resetBuild = () => {
    build.value = {}
    selectedProducts.value = {}
    checkResult.value = emptyCheck()
    persistence.clearDraft()
    activeTypeSlug.value = componentTypes.value[0]?.slug || null
  }

  const setActiveType = (slug: string) => {
    if (componentTypes.value.some(type => type.slug === slug)) activeTypeSlug.value = slug
  }

  const preselectRequestedProduct = async () => {
    const slug = typeof route.query.product === 'string' ? route.query.product : ''
    if (!slug) return false
    try {
      const response = await $fetch<{ product: ProductDetail }>(`${config.public.apiBase}/products/${encodeURIComponent(slug)}`)
      const detail = response.product
      const type = componentTypes.value.find(item => item.id === detail.component_type?.id)
      if (!type) {
        toast.add({ title: 'Sản phẩm này không dùng cho PC Builder', color: 'warning' })
        return false
      }
      build.value = { [String(type.id)]: detail.id }
      selectedProducts.value = { [String(type.id)]: fromProductDetail(detail) }
      activeTypeSlug.value = type.slug
      await check()
      return true
    } catch {
      toast.add({ title: 'Không thể tải sản phẩm cho PC Builder', color: 'error' })
      return false
    }
  }

  const restoreDraft = async () => {
    const pending = persistence.readPendingBuild()
    const draft = persistence.readDraft()
    const nextBuild = pending ?? draft?.build
    if (!nextBuild || Object.keys(nextBuild).length === 0) return false
    await replaceBuild(nextBuild)
    persistence.clearPendingBuild()
    return true
  }

  const saveBuild = async (name: string): Promise<'saved' | 'login' | 'failed'> => {
    if (!isAuthenticated.value) {
      persistence.savePendingBuild(build.value)
      return 'login'
    }
    isSaving.value = true
    try {
      const response = await authFetch<{ build: { name: string } }>(`${config.public.apiBase}/builder/save`, {
        method: 'POST',
        body: { name, build: build.value },
      })
      persistence.clearPendingBuild()
      toast.add({ title: 'Đã lưu cấu hình', description: response.build.name, color: 'success' })
      return 'saved'
    } catch {
      toast.add({ title: 'Không thể lưu cấu hình', description: 'Hãy kiểm tra lại các linh kiện đã chọn.', color: 'error' })
      return 'failed'
    } finally {
      isSaving.value = false
    }
  }

  const addAllToCart = async (): Promise<{ success: number; failed: number; blocked: boolean }> => {
    if (isAddingToCart.value) return { success: 0, failed: 0, blocked: true }
    const latest = await check()
    if (!latest || !latest.completion.complete || !latest.compatible || latest.issues.some(issue => issue.type === 'error')) {
      toast.add({ title: 'Cấu hình chưa thể mua', description: 'Vui lòng hoàn thiện các linh kiện và xử lý lỗi tương thích.', color: 'warning' })
      return { success: 0, failed: 0, blocked: true }
    }
    if (Object.values(selectedProducts.value).some(product => product.has_variants)) {
      toast.add({ title: 'Cần chọn phiên bản', description: 'Một sản phẩm có nhiều phiên bản. Hãy chọn phiên bản trên trang chi tiết.', color: 'warning' })
      return { success: 0, failed: 0, blocked: true }
    }

    isAddingToCart.value = true
    let success = 0
    let failed = 0
    try {
      for (const product of Object.values(selectedProducts.value)) {
        if (await cart.addItem(product.id, 1)) success++
        else failed++
      }
      if (failed) toast.add({ title: 'Đã thêm một phần cấu hình', description: `${success} thành công, ${failed} không thể thêm.`, color: 'warning' })
      else if (success) toast.add({ title: 'Đã thêm cấu hình vào giỏ hàng', description: `${success} linh kiện đã được thêm.`, color: 'success' })
      return { success, failed, blocked: false }
    } finally {
      isAddingToCart.value = false
    }
  }

  const issueForType = (typeId: number): BuilderIssue[] => checkResult.value.issues.filter(issue => issue.source_type_id === typeId || issue.target_type_id === typeId)

  return {
    componentTypes,
    build,
    selectedProducts,
    checkResult,
    activeTypeSlug,
    isLoadingTypes,
    isChecking,
    error,
    isAddingToCart,
    isSaving,
    selectedCount,
    requiredTypes,
    missingRequired,
    hasErrors,
    hasWarnings,
    canPurchase,
    totalPrice,
    totalTdp,
    recommendedPsuWattage,
    fetchComponentTypes,
    check,
    selectProduct,
    removeProduct,
    replaceBuild,
    resetBuild,
    setActiveType,
    preselectRequestedProduct,
    restoreDraft,
    saveBuild,
    addAllToCart,
    issueForType,
    fromProductDetail,
  }
}
