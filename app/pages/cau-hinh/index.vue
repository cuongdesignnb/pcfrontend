<script setup lang="ts">
import type { BuilderComponentType, BuilderFiltersState, BuilderPreset, BuilderProductOption, BuilderSelection, BuilderSort } from '~/types/pc-builder'

const route = useRoute()
const config = useRuntimeConfig()
const toast = useToast()
const auth = useAuth()
const { siteName, siteTagline, siteHotline, siteLogo } = useSettings()
const builderState = usePcBuilder()
const browserState = useBuilderProducts()

// A composable result is a plain object containing refs. Vue only unwraps
// refs at the top level of setup state, so expose reactive view objects to
// child components to avoid passing Ref instances as props during SSR.
const builder = reactive(builderState)
const browser = reactive(browserState)

const presets = ref<BuilderPreset[]>([])
const isInitialising = ref(true)
const saveModalOpen = ref(false)
const shareModalOpen = ref(false)
const suggestedName = ref('PC Builder')
const shareUrl = ref('')
let filterTimer: ReturnType<typeof setTimeout> | null = null

await builderState.fetchComponentTypes()

const activeType = computed(() => builderState.componentTypes.value.find(type => type.slug === builderState.activeTypeSlug.value))

const parseSharedBuild = (): BuilderSelection | null => {
  const value = typeof route.query.build === 'string' ? route.query.build : ''
  if (!value) return null
  const next: BuilderSelection = {}
  for (const pair of value.split(',')) {
    const [rawTypeId, rawProductId] = pair.split('-')
    const typeId = Number(rawTypeId)
    const productId = Number(rawProductId)
    if (Number.isInteger(typeId) && typeId > 0 && Number.isInteger(productId) && productId > 0) next[String(typeId)] = productId
  }
  return Object.keys(next).length ? next : null
}

const restoreSavedBuild = async (): Promise<boolean> => {
  const savedBuildId = typeof route.query.saved_build === 'string' ? route.query.saved_build : ''
  if (!savedBuildId) return false
  if (!auth.isAuthenticated.value) {
    await navigateTo({ path: '/dang-nhap', query: { redirect: route.fullPath } })
    return true
  }

  try {
    const response = await auth.authFetch<{ build: { build: BuilderSelection } }>(`${config.public.apiBase}/builder/saved/${encodeURIComponent(savedBuildId)}`)
    await builderState.replaceBuild(response.build.build)
    return true
  } catch {
    toast.add({ title: 'Không thể mở cấu hình đã lưu', description: 'Cấu hình không tồn tại hoặc không thuộc tài khoản này.', color: 'error' })
    return false
  }
}

const loadActiveProducts = async (page = 1) => {
  if (builderState.activeTypeSlug.value) await browserState.load(builderState.activeTypeSlug.value, builderState.build.value, page)
}

const selectType = async (slug: string, reset = true) => {
  builderState.setActiveType(slug)
  if (reset) browserState.resetFilters()
  await loadActiveProducts()
}

const updateFilters = (filters: BuilderFiltersState) => {
  browserState.filters.value = filters
  scheduleProductReload()
}

const updateSort = (sort: BuilderSort) => {
  browserState.sort.value = sort
  scheduleProductReload()
}

const scheduleProductReload = () => {
  if (!import.meta.client || !builderState.activeTypeSlug.value) return
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(() => { loadActiveProducts().catch(() => undefined) }, 220)
}

const selectProduct = async (option: BuilderProductOption) => {
  if (!activeType.value || !option.is_compatible || option.product.has_variants) return
  await builderState.selectProduct(activeType.value, option.product)
  await loadActiveProducts()
}

const openProduct = async (option: BuilderProductOption) => {
  const product = option.product
  const url = product.category ? `/${product.category.slug}/${product.slug}` : `/products/${product.slug}`
  await navigateTo(url)
}

const changeType = async (type: BuilderComponentType) => {
  await selectType(type.slug)
  await nextTick()
  document.getElementById('builder-component-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const removeType = async (type: BuilderComponentType) => {
  await builderState.removeProduct(type)
  if (builderState.activeTypeSlug.value === type.slug) await loadActiveProducts()
}

const focusType = async (typeId: number) => {
  const type = builderState.componentTypes.value.find(item => item.id === typeId)
  if (!type) return
  await changeType(type)
  document.getElementById(`builder-selected-list`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const addConfigurationToCart = async () => {
  const result = await builderState.addAllToCart()
  if (result.success > 0) await navigateTo('/gio-hang')
}

const openSaveModal = () => { saveModalOpen.value = true }
const saveConfiguration = async (name: string) => {
  const result = await builderState.saveBuild(name)
  if (result === 'login') {
    saveModalOpen.value = false
    await navigateTo({ path: '/dang-nhap', query: { redirect: '/cau-hinh' } })
  } else if (result === 'saved') {
    saveModalOpen.value = false
  }
}

const makeShareUrl = () => {
  if (!import.meta.client) return ''
  const encoded = Object.entries(builderState.build.value).map(([typeId, productId]) => `${typeId}-${productId}`).join(',')
  return `${window.location.origin}/cau-hinh?build=${encodeURIComponent(encoded)}`
}
const openShareModal = () => {
  shareUrl.value = makeShareUrl()
  if (shareUrl.value) shareModalOpen.value = true
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`
const printQuotation = () => {
  if (!import.meta.client || !builderState.selectedCount.value) return
  const rows = builderState.componentTypes.value
    .filter(type => builderState.selectedProducts.value[String(type.id)])
    .map(type => {
      const product = builderState.selectedProducts.value[String(type.id)]
      return `<tr><td>${escapeHtml(type.name)}</td><td>${escapeHtml(product?.brand?.name || '')}</td><td>${escapeHtml(product?.name || '')}</td><td class="right">${formatMoney(product?.pricing.display_price || 0)}</td></tr>`
    }).join('')
  const logo = siteLogo.value
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Báo giá cấu hình - ${escapeHtml(siteName.value)}</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:32px;font-size:13px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1264d8;padding-bottom:16px;margin-bottom:24px}header img{max-width:180px;max-height:56px;object-fit:contain}.title{text-align:center;margin-bottom:20px}.title h1{font-size:22px;margin:0 0 6px}.title p{margin:0;color:#687386}table{border-collapse:collapse;width:100%;margin-bottom:18px}th{background:#1264d8;color:white;text-align:left;padding:10px}td{border-bottom:1px solid #e4e8ee;padding:10px}.right{text-align:right}.total{font-size:18px;font-weight:bold;color:#ef2f2f;text-align:right}.facts{padding:12px;background:#f6f8fb;border:1px solid #e4e8ee;border-radius:6px;color:#536176}footer{margin-top:28px;border-top:1px solid #e4e8ee;padding-top:12px;color:#687386;display:flex;justify-content:space-between}@media print{body{padding:12px}}</style></head><body><header>${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(siteName.value)}">` : `<strong>${escapeHtml(siteName.value)}</strong>`}<div>${escapeHtml(siteHotline.value)}</div></header><div class="title"><h1>Báo giá cấu hình PC</h1><p>${new Date().toLocaleDateString('vi-VN')} · ${escapeHtml(siteName.value)}</p></div><table><thead><tr><th>Nhóm</th><th>Hãng</th><th>Linh kiện</th><th class="right">Đơn giá</th></tr></thead><tbody>${rows}<tr><td colspan="3"><strong>Tổng tiền</strong></td><td class="right total">${formatMoney(builderState.totalPrice.value)}</td></tr></tbody></table><div class="facts">TDP ước tính: ${builderState.totalTdp.value}W${builderState.recommendedPsuWattage.value ? ` · Khuyến nghị nguồn: ${builderState.recommendedPsuWattage.value}W trở lên` : ''}</div><footer><span>Dữ liệu được lấy tại thời điểm tạo báo giá.</span><span>${escapeHtml(siteName.value)}</span></footer></body></html>`
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    toast.add({ title: 'Trình duyệt đã chặn cửa sổ in', color: 'warning' })
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const fetchPresets = async () => {
  try {
    const response = await $fetch<{ presets: BuilderPreset[] }>(`${config.public.apiBase}/builder/presets`)
    presets.value = response.presets || []
  } catch {
    presets.value = []
  }
}

const usePreset = async (preset: BuilderPreset) => {
  const next: BuilderSelection = {}
  for (const type of builderState.componentTypes.value) {
    const productId = preset.products[type.slug]
    if (typeof productId === 'number' && Number.isInteger(productId) && productId > 0) next[String(type.id)] = productId
  }
  await builderState.replaceBuild(next)
  if (!builderState.activeTypeSlug.value) builderState.setActiveType(builderState.componentTypes.value[0]?.slug || '')
  await loadActiveProducts()
}

onMounted(async () => {
  suggestedName.value = `PC Gaming ${new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}`
  const restoredSavedBuild = await restoreSavedBuild()
  const sharedBuild = restoredSavedBuild ? null : parseSharedBuild()
  if (sharedBuild) await builderState.replaceBuild(sharedBuild)
  else if (typeof route.query.product === 'string' && route.query.product) await builderState.preselectRequestedProduct()
  else await builderState.restoreDraft()
  await fetchPresets()
  await loadActiveProducts()
  isInitialising.value = false
})

useSeoMeta({
  title: () => `PC Builder - ${siteName.value}`,
  description: () => `Tự do lựa chọn linh kiện và kiểm tra tương thích cùng ${siteName.value}.`,
})
</script>

<template>
  <main class="builder-page">
    <div class="builder-container">
      <BuilderBreadcrumb />
      <BuilderHeader :site-name="siteName" :tagline="siteTagline" />
      <BuilderSteps />

      <div v-if="builder.error" class="builder-page-error" role="alert">{{ builder.error }}</div>

      <div class="builder-main-grid">
        <div class="builder-main-column">
          <BuilderSelectedList
            id="builder-selected-list"
            :component-types="builder.componentTypes"
            :selected-products="builder.selectedProducts"
            :issues="builder.checkResult.issues"
            :active-type-slug="builder.activeTypeSlug"
            @change="changeType"
            @remove="removeType"
            @reset="builder.resetBuild"
          />
          <BuilderComponentBrowser
            :component-types="builder.componentTypes"
            :active-type-slug="builder.activeTypeSlug"
            :options="browser.options"
            :selected-product-id="activeType ? builder.build[String(activeType.id)] : undefined"
            :filter-options="browser.filterOptions"
            :filters="browser.filters"
            :sort="browser.sort"
            :loading="browser.isLoading || builder.isLoadingTypes"
            :total="browser.meta.total"
            :current-page="browser.meta.current_page"
            :last-page="browser.meta.last_page"
            @select-type="selectType($event)"
            @select-product="selectProduct"
            @open-product="openProduct"
            @update:filters="updateFilters"
            @update:sort="updateSort"
            @page="loadActiveProducts"
          />
          <BuilderPresetSection :presets="presets" @use="usePreset" />
        </div>

        <BuilderSummary
          :component-types="builder.componentTypes"
          :selected-products="builder.selectedProducts"
          :check="builder.checkResult"
          :issues="builder.checkResult.issues"
          :selected-count="builder.selectedCount"
          :hotline="siteHotline"
          :site-name="siteName"
          :adding="builder.isAddingToCart"
          :saving="builder.isSaving"
          :checking="builder.isChecking"
          @buy="addConfigurationToCart"
          @cart="addConfigurationToCart"
          @save="openSaveModal"
          @share="openShareModal"
          @print="printQuotation"
          @focus="focusType"
        />
      </div>

      <p v-if="isInitialising" class="builder-loading-note">Đang tải dữ liệu cấu hình…</p>
    </div>

    <BuilderMobileSummary
      :selected-count="builder.selectedCount"
      :total-price="builder.totalPrice"
      :complete="builder.canPurchase"
      :adding="builder.isAddingToCart"
      @buy="addConfigurationToCart"
      @details="focusType(builder.activeTypeSlug ? builder.componentTypes.find(type => type.slug === builder.activeTypeSlug)?.id || 0 : 0)"
    />
    <BuilderSaveModal :open="saveModalOpen" :default-name="suggestedName" :saving="builder.isSaving" @close="saveModalOpen = false" @save="saveConfiguration" />
    <BuilderShareModal :open="shareModalOpen" :url="shareUrl" @close="shareModalOpen = false" />
  </main>
</template>

<style>
.builder-page { --builder-blue: #1264d8; --builder-blue-dark: #0754bd; --builder-navy: #102c58; --builder-red: #ef2f2f; --builder-green: #16a765; --builder-border: #e2e8f0; --builder-muted: #6d7b90; --builder-soft: #f5f8fc; background: #fff; color: #172033; }
.builder-container { width: min(100% - 32px, 1480px); margin-inline: auto; padding-bottom: 48px; }
.builder-breadcrumb { display: flex; align-items: center; gap: 9px; min-height: 38px; color: #74839a; font-size: 11px; }
.builder-breadcrumb a:hover { color: var(--builder-blue); }
.builder-page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 8px 0 14px; }
.builder-page-header h1 { margin: 0; color: #12234c; font-size: 32px; font-weight: 850; letter-spacing: -.035em; line-height: 1.08; }
.builder-page-header p { margin: 7px 0 0; color: #607088; font-size: 13px; }
.builder-page-header-note { max-width: 420px; color: #7c8ba2; font-size: 11px; text-align: right; }
.builder-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); min-height: 72px; margin-bottom: 14px; overflow: hidden; border: 1px solid #e3ecfa; border-radius: 8px; background: linear-gradient(100deg, #f7fbff, #edf5ff); }
.builder-step { position: relative; display: flex; min-width: 0; align-items: center; gap: 10px; padding: 12px 18px; }
.builder-step + .builder-step { border-left: 1px solid #dae8fa; }
.builder-step-number { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; color: #fff; background: linear-gradient(135deg, #2083ee, #1264d8); border-radius: 50%; box-shadow: 0 3px 7px rgba(18,100,216,.2); font-size: 14px; font-weight: 800; }
.builder-step-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.builder-step-copy strong { color: #1f3564; font-size: 12px; font-weight: 800; }
.builder-step-copy small { overflow: hidden; color: #7790b1; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.builder-main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 350px; gap: 16px; align-items: start; }
.builder-main-column { display: flex; min-width: 0; flex-direction: column; gap: 16px; }
.builder-panel, .builder-summary { min-width: 0; border: 1px solid var(--builder-border); border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(15,23,42,.035); }
.builder-panel-heading { display: flex; min-height: 53px; align-items: center; justify-content: space-between; gap: 12px; padding: 0 14px; border-bottom: 1px solid #edf1f5; }
.builder-panel-heading h2 { margin: 0; color: #172b57; font-size: 17px; font-weight: 800; }
.builder-panel-heading p { margin: 4px 0 0; color: var(--builder-muted); font-size: 10px; }
.builder-text-button { padding: 6px 0; color: var(--builder-blue); background: transparent; border: 0; font-size: 10px; font-weight: 700; }
.builder-text-button:hover { color: var(--builder-blue-dark); }
.builder-selected-rows { padding: 6px 12px 9px; }
.builder-selected-row { display: grid; min-height: 72px; grid-template-columns: 34px 104px 58px minmax(130px, 1fr) 104px 100px 86px 30px; align-items: center; gap: 9px; padding: 5px 7px; border-bottom: 1px solid #eef2f6; transition: background .16s ease, border-color .16s ease; }
.builder-selected-row:last-child { border-bottom: 0; }
.builder-selected-row:hover, .builder-selected-row--active { background: #fbfdff; }
.builder-selected-row--error { background: #fffafa; }
.builder-type-icon { display: grid; width: 30px; height: 30px; place-items: center; color: var(--builder-blue); background: #eef5ff; border-radius: 6px; }
.builder-type-icon svg { width: 20px; height: 20px; }
.builder-selected-type strong { color: #2a3c5f; font-size: 12px; font-weight: 800; }
.builder-selected-type em { color: var(--builder-red); font-style: normal; }
.builder-selected-image { display: grid; width: 58px; height: 52px; place-items: center; overflow: hidden; color: #a1b1c8; }
.builder-selected-image img { width: 100%; height: 100%; object-fit: contain; }
.builder-selected-image svg { width: 29px; height: 29px; }
.builder-selected-product { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.builder-selected-product strong { overflow: hidden; color: #25375b; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.builder-selected-product small { overflow: hidden; color: #7b8ba2; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.builder-selected-state { display: inline-flex; min-width: 0; align-items: center; gap: 4px; color: var(--builder-green); font-size: 9px; white-space: nowrap; }
.builder-selected-state svg { width: 16px; height: 16px; flex: 0 0 16px; }
.builder-selected-state.is-warning { color: #bd7a00; }
.builder-selected-state.is-error { color: var(--builder-red); }
.builder-selected-price { color: var(--builder-red); font-size: 12px; white-space: nowrap; }
.builder-selected-empty { grid-column: 3 / span 3; color: #9aa6b8; font-size: 11px; }
.builder-outline-button, .builder-primary-button { display: inline-flex; min-height: 31px; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; border-radius: 5px; font-size: 10px; font-weight: 750; transition: background .16s ease, color .16s ease, border-color .16s ease; }
.builder-outline-button { color: var(--builder-blue); background: #fff; border: 1px solid #9fc3f8; }
.builder-outline-button:hover:not(:disabled) { color: #fff; background: var(--builder-blue); border-color: var(--builder-blue); }
.builder-primary-button { color: #fff; background: var(--builder-blue); border: 1px solid var(--builder-blue); }
.builder-primary-button:hover:not(:disabled) { background: var(--builder-blue-dark); border-color: var(--builder-blue-dark); }
.builder-change-button { min-height: 29px; padding-inline: 8px; font-size: 9px; }
.builder-select-button { grid-column: 7 / span 2; justify-self: end; min-height: 29px; font-size: 9px; }
.builder-icon-button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; color: #93a1b5; background: transparent; border: 0; border-radius: 50%; }
.builder-icon-button:hover { color: var(--builder-red); background: #fff1f1; }
.builder-icon-button svg { width: 16px; height: 16px; }
.builder-summary { position: sticky; top: 82px; overflow: hidden; }
.builder-summary > .builder-panel-heading { min-height: 54px; }
.builder-compatibility { display: flex; align-items: center; gap: 10px; margin: 13px 14px 8px; }
.builder-compatibility-mark { display: grid; width: 33px; height: 33px; flex: 0 0 33px; place-items: center; color: #fff; background: var(--builder-green); border-radius: 50%; font-size: 18px; font-weight: 800; }
.builder-compatibility-mark svg { width: 19px; height: 19px; }
.builder-compatibility-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.builder-compatibility-copy strong { color: var(--builder-green); font-size: 12px; font-weight: 800; }
.builder-compatibility-copy small { color: #8592a6; font-size: 9px; }
.builder-compatibility--error .builder-compatibility-mark { background: var(--builder-red); }
.builder-compatibility--error .builder-compatibility-copy strong { color: var(--builder-red); }
.builder-compatibility--warning .builder-compatibility-mark, .builder-compatibility--incomplete .builder-compatibility-mark, .builder-compatibility--checking .builder-compatibility-mark { color: #9a6500; background: #fff0c8; }
.builder-compatibility--warning .builder-compatibility-copy strong, .builder-compatibility--incomplete .builder-compatibility-copy strong { color: #a76d00; }
.builder-issue-list { display: flex; flex-direction: column; gap: 5px; margin: 0 14px 10px; }
.builder-issue { display: flex; min-width: 0; align-items: center; gap: 6px; padding: 7px 8px; color: #9a6500; background: #fff9e8; border: 1px solid #ffedb6; border-radius: 5px; text-align: left; font-size: 9px; }
.builder-issue:disabled { cursor: default; }
.builder-issue--error { color: #c43636; background: #fff5f5; border-color: #ffd7d7; }
.builder-issue-icon { display: inline-flex; flex: 0 0 auto; }
.builder-issue-icon svg { width: 15px; height: 15px; }
.builder-issue > span:nth-child(2) { flex: 1; }
.builder-issue small { flex: 0 0 auto; color: #a28d65; font-size: 8px; }
.builder-summary-selected { max-height: 230px; overflow-y: auto; padding: 5px 14px; border-top: 1px solid #edf1f5; border-bottom: 1px solid #edf1f5; }
.builder-summary-selected-row { display: flex; min-height: 28px; align-items: center; justify-content: space-between; gap: 8px; }
.builder-summary-selected-row span { overflow: hidden; color: #718097; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.builder-summary-selected-row strong { color: #384866; font-size: 10px; white-space: nowrap; }
.builder-summary-empty { margin: 12px 0; color: #95a1b3; font-size: 10px; text-align: center; }
.builder-summary-total { display: flex; flex-direction: column; gap: 8px; padding: 13px 14px; background: #fbfcfe; }
.builder-summary-total > div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.builder-summary-total span { color: #718097; font-size: 10px; }
.builder-summary-total strong { color: #384866; font-size: 11px; }
.builder-summary-total > div:first-child strong { color: var(--builder-red); font-size: 20px; }
.builder-summary-actions { display: flex; flex-direction: column; gap: 8px; padding: 13px 14px; }
.builder-summary-buy, .builder-summary-cart { width: 100%; min-height: 38px; font-size: 12px; }
.builder-summary-buy span { margin-left: auto; font-size: 16px; }
.builder-summary-secondary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.builder-summary-secondary button { min-height: 31px; color: #65748b; background: #fff; border: 1px solid #e0e6ee; border-radius: 5px; font-size: 9px; }
.builder-summary-secondary button:hover:not(:disabled) { color: var(--builder-blue); border-color: #99bff4; }
.builder-support-card { display: flex; gap: 9px; margin: 0 14px 14px; padding: 11px; color: #35517d; background: #eef6ff; border-radius: 6px; }
.builder-support-icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; color: var(--builder-blue); }
.builder-support-icon svg { width: 27px; height: 27px; }
.builder-support-card strong { font-size: 11px; }
.builder-support-card p { margin: 2px 0 5px; color: #7187a7; font-size: 9px; }
.builder-support-card a { display: inline-block; color: var(--builder-blue); font-size: 11px; font-weight: 800; }
.builder-browser-heading { align-items: flex-start; padding-top: 11px; padding-bottom: 10px; }
.builder-browser-heading > a { color: var(--builder-blue); font-size: 10px; font-weight: 700; }
.builder-component-tabs { display: flex; min-width: 0; overflow-x: auto; border-bottom: 1px solid #e8edf4; scrollbar-width: thin; }
.builder-component-tabs button { position: relative; flex: 0 0 auto; min-height: 43px; padding: 0 14px; color: #66758e; background: transparent; border: 0; font-size: 10px; font-weight: 700; white-space: nowrap; }
.builder-component-tabs button::after { position: absolute; right: 12px; bottom: -1px; left: 12px; height: 2px; background: transparent; content: ''; }
.builder-component-tabs button:hover, .builder-component-tabs button.is-active { color: var(--builder-blue); }
.builder-component-tabs button.is-active::after { background: var(--builder-blue); }
.builder-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; padding: 10px 12px; background: #fbfcfe; border-bottom: 1px solid #edf1f5; }
.builder-filter-search { display: flex; min-width: 150px; height: 31px; flex: 1 1 180px; align-items: center; gap: 6px; padding: 0 8px; color: #93a1b5; background: #fff; border: 1px solid #dce4ee; border-radius: 5px; }
.builder-filter-search svg { width: 14px; height: 14px; flex: 0 0 14px; }
.builder-filter-search input { min-width: 0; width: 100%; padding: 0; color: #263858; background: transparent; border: 0; outline: 0; font-size: 10px; }
.builder-filter-group { position: relative; min-width: 150px; max-width: 210px; }
.builder-filter-group summary { display: flex; min-height: 31px; align-items: center; justify-content: space-between; gap: 10px; padding: 0 8px; color: #53637d; background: #fff; border: 1px solid #dce4ee; border-radius: 5px; cursor: pointer; font-size: 10px; list-style: none; }
.builder-filter-group summary::-webkit-details-marker { display: none; }
.builder-filter-group summary span { color: #94a1b4; }
.builder-filter-group[open] summary { color: var(--builder-blue); border-color: #a9c9f5; border-radius: 5px 5px 0 0; }
.builder-filter-group > .builder-check-option, .builder-filter-group > .builder-price-inputs { position: relative; z-index: 2; display: flex; }
.builder-filter-group[open] > .builder-check-option, .builder-filter-group[open] > .builder-price-inputs { min-width: 100%; padding: 5px 8px; background: #fff; border-right: 1px solid #a9c9f5; border-left: 1px solid #a9c9f5; }
.builder-filter-group[open] > .builder-check-option:last-child, .builder-filter-group[open] > .builder-price-inputs:last-child { border-bottom: 1px solid #a9c9f5; border-radius: 0 0 5px 5px; }
.builder-check-option { min-height: 26px; align-items: center; gap: 6px; color: #65738b; font-size: 10px; }
.builder-check-option input, .builder-switch-option input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.builder-checkbox { display: inline-block; width: 13px; height: 13px; flex: 0 0 13px; border: 1px solid #aebbd0; border-radius: 2px; }
.builder-check-option input:checked + .builder-checkbox { background: var(--builder-blue); border-color: var(--builder-blue); }
.builder-check-option input:checked + .builder-checkbox::after { display: block; width: 6px; height: 3px; margin: 3px 0 0 2px; border-bottom: 1.5px solid #fff; border-left: 1.5px solid #fff; content: ''; transform: rotate(-45deg); }
.builder-check-option span:nth-last-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.builder-check-option small { margin-left: auto; color: #9ba7b8; font-size: 9px; }
.builder-price-inputs { align-items: center; gap: 5px; padding: 6px 0; color: #8e9bad; }
.builder-price-inputs input { width: 80px; height: 27px; padding: 0 6px; color: #34445f; border: 1px solid #dce4ee; border-radius: 4px; outline: 0; font-size: 9px; }
.builder-switch-option { position: relative; display: inline-flex; min-height: 31px; align-items: center; gap: 5px; color: #6b7990; font-size: 9px; white-space: nowrap; }
.builder-switch { position: relative; display: inline-block; width: 28px; height: 16px; flex: 0 0 28px; background: #cad5e4; border-radius: 12px; }
.builder-switch::after { position: absolute; top: 3px; left: 3px; width: 10px; height: 10px; background: #fff; border-radius: 50%; content: ''; transition: transform .16s ease; }
.builder-switch-option input:checked + .builder-switch { background: var(--builder-blue); }
.builder-switch-option input:checked + .builder-switch::after { transform: translateX(12px); }
.builder-sort-control { display: flex; min-height: 31px; align-items: center; gap: 5px; margin-left: auto; color: #8290a4; font-size: 9px; }
.builder-sort-control select { height: 31px; padding: 0 7px; color: #34445f; background: #fff; border: 1px solid #dce4ee; border-radius: 5px; outline: 0; font-size: 9px; }
.builder-product-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; padding: 12px; }
.builder-product-card { position: relative; display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 7px; background: #fff; transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease; }
.builder-product-card:hover { border-color: #9fc3f8; box-shadow: 0 5px 14px rgba(15,23,42,.08); transform: translateY(-1px); }
.builder-product-card.is-selected { border: 2px solid var(--builder-blue); }
.builder-product-card.is-incompatible { background: #fbfcfd; }
.builder-product-card.is-incompatible .builder-product-image, .builder-product-card.is-incompatible .builder-product-body { opacity: .55; }
.builder-selected-badge { position: absolute; top: 7px; left: 7px; z-index: 1; padding: 3px 5px; color: #fff; background: var(--builder-blue); border-radius: 3px; font-size: 8px; font-weight: 750; }
.builder-wishlist { position: absolute; top: 6px; right: 6px; z-index: 1; display: grid; width: 24px; height: 24px; padding: 0; place-items: center; color: #8e9bb0; background: #fff; border: 0; border-radius: 50%; }
.builder-wishlist:hover { color: var(--builder-red); }
.builder-wishlist svg { width: 16px; height: 16px; }
.builder-product-image { display: grid; height: 136px; margin: 6px; place-items: center; color: #a2afc1; }
.builder-product-image img { width: 100%; height: 100%; object-fit: contain; }
.builder-product-image svg { width: 50px; height: 50px; }
.builder-product-body { display: flex; min-width: 0; flex: 1; flex-direction: column; padding: 2px 8px 8px; }
.builder-product-name { display: -webkit-box; min-height: 34px; overflow: hidden; color: #20355e; font-size: 10px; font-weight: 750; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.builder-product-name:hover { color: var(--builder-blue); }
.builder-product-specs { display: -webkit-box; min-height: 26px; margin: 4px 0 0; overflow: hidden; color: #8190a5; font-size: 8px; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.builder-product-price { display: flex; min-height: 22px; flex-wrap: wrap; align-items: baseline; gap: 5px; margin-top: 4px; }
.builder-product-price strong { color: var(--builder-red); font-size: 13px; }
.builder-product-price del { color: #9ba5b4; font-size: 8px; }
.builder-product-meta { display: flex; min-height: 16px; justify-content: space-between; gap: 4px; color: #8a97aa; font-size: 8px; }
.builder-rating-mark { color: #f5a400; }
.builder-product-issue { display: -webkit-box; min-height: 22px; margin: 3px 0; overflow: hidden; color: #cf4545; font-size: 8px; line-height: 1.3; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.builder-product-action { display: flex; min-height: 28px; align-items: center; justify-content: center; gap: 4px; margin-top: auto; padding: 0 5px; color: var(--builder-blue); background: #fff; border: 1px solid #82b0f4; border-radius: 4px; font-size: 9px; font-weight: 750; }
.builder-product-action:hover:not(:disabled) { color: #fff; background: var(--builder-blue); }
.builder-product-action:disabled { color: #a9b3c1; background: #f5f7f9; border-color: #e1e6ec; }
.builder-product-action svg { width: 13px; height: 13px; }
.builder-product-skeleton { min-height: 300px; border-radius: 7px; background: linear-gradient(100deg, #f0f3f7 20%, #fbfcfe 38%, #f0f3f7 56%); background-size: 300% 100%; animation: builder-loading 1.4s ease infinite; }
@keyframes builder-loading { from { background-position: 100% 0; } to { background-position: 0 0; } }
.builder-product-empty { grid-column: 1 / -1; min-height: 180px; margin: 0; padding: 50px 20px; color: #8b98aa; text-align: center; font-size: 11px; }
.builder-pagination { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 2px 12px 14px; }
.builder-pagination button { display: grid; min-width: 28px; height: 28px; place-items: center; color: #61718a; background: #fff; border: 1px solid #dce4ee; border-radius: 4px; font-size: 10px; }
.builder-pagination button:hover:not(:disabled), .builder-pagination button.is-active { color: #fff; background: var(--builder-blue); border-color: var(--builder-blue); }
.builder-presets { overflow: hidden; }
.builder-preset-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding: 12px; }
.builder-preset-card { display: flex; min-width: 0; align-items: center; gap: 8px; padding: 8px; border: 1px solid #e4e9f0; border-radius: 6px; }
.builder-preset-card:hover { border-color: #a5c7f5; }
.builder-preset-image { display: grid; width: 92px; height: 68px; flex: 0 0 92px; place-items: center; overflow: hidden; color: #9daec4; background: #f4f8fd; border-radius: 5px; }
.builder-preset-image img { width: 100%; height: 100%; object-fit: cover; }
.builder-preset-image svg { width: 31px; height: 31px; }
.builder-preset-copy { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 3px; }
.builder-preset-copy h3 { margin: 0; color: #24385f; font-size: 11px; }
.builder-preset-copy p { display: -webkit-box; min-height: 25px; margin: 0; overflow: hidden; color: #7d8ca2; font-size: 8px; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.builder-preset-copy strong { color: var(--builder-red); font-size: 10px; }
.builder-preset-copy .builder-outline-button { min-height: 26px; margin-top: 2px; padding-inline: 7px; font-size: 8px; }
.builder-mobile-summary { display: none; }
.builder-modal-backdrop { position: fixed; inset: 0; z-index: 120; display: grid; padding: 18px; place-items: center; background: rgba(6,24,49,.48); }
.builder-modal { position: relative; width: min(100%, 430px); padding: 22px; background: #fff; border-radius: 9px; box-shadow: 0 18px 45px rgba(7,24,48,.22); }
.builder-modal h2 { margin: 0; color: #172b57; font-size: 19px; }
.builder-modal p { margin: 7px 0 17px; color: #718097; font-size: 11px; }
.builder-modal-close { position: absolute; top: 8px; right: 9px; width: 28px; height: 28px; color: #8d99aa; background: transparent; border: 0; font-size: 22px; line-height: 1; }
.builder-modal-label { display: block; margin-bottom: 6px; color: #4f607a; font-size: 10px; font-weight: 750; }
.builder-modal-input { display: block; width: 100%; height: 36px; padding: 0 10px; color: #263858; border: 1px solid #dbe3ed; border-radius: 5px; outline: 0; font-size: 11px; }
.builder-modal-input:focus { border-color: #8bb7f2; box-shadow: 0 0 0 3px rgba(18,100,216,.1); }
.builder-modal-actions { display: flex; justify-content: flex-end; gap: 7px; margin-top: 18px; }
.builder-page-error { margin: 0 0 14px; padding: 10px 12px; color: #b53d3d; background: #fff5f5; border: 1px solid #ffdada; border-radius: 6px; font-size: 11px; }
.builder-loading-note { margin: 16px 0 0; color: #7e8da4; font-size: 11px; text-align: center; }

@media (max-width: 1320px) {
  .builder-product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .builder-selected-row { grid-template-columns: 34px 90px 52px minmax(100px, 1fr) 96px 92px 80px 28px; }
}
@media (max-width: 1050px) {
  .builder-main-grid { grid-template-columns: minmax(0, 1fr) 310px; }
  .builder-selected-row { grid-template-columns: 30px 78px 48px minmax(90px, 1fr) 86px 78px 28px; }
  .builder-selected-state { display: none; }
  .builder-step { padding-inline: 10px; }
  .builder-step-copy small { display: none; }
  .builder-preset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 820px) {
  .builder-container { width: min(100% - 20px, 680px); padding-bottom: 85px; }
  .builder-page-header { align-items: flex-start; flex-direction: column; }
  .builder-page-header-note { text-align: left; }
  .builder-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .builder-step:nth-child(3) { border-left: 0; border-top: 1px solid #dae8fa; }
  .builder-step:nth-child(4) { border-top: 1px solid #dae8fa; }
  .builder-main-grid { grid-template-columns: minmax(0, 1fr); }
  .builder-summary { display: none; }
  .builder-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .builder-mobile-summary { position: fixed; right: 0; bottom: 0; left: 0; z-index: 90; display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: #fff; border-top: 1px solid #dce4ee; box-shadow: 0 -4px 14px rgba(15,23,42,.1); }
  .builder-mobile-summary-details { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: flex-start; padding: 0; color: #6f7e95; background: transparent; border: 0; text-align: left; }
  .builder-mobile-summary-details span { font-size: 9px; }
  .builder-mobile-summary-details strong { color: var(--builder-red); font-size: 16px; }
  .builder-mobile-summary > .builder-primary-button { min-height: 38px; padding-inline: 18px; font-size: 11px; }
}
@media (max-width: 560px) {
  .builder-page-header h1 { font-size: 27px; }
  .builder-page-header p { font-size: 11px; }
  .builder-steps { min-height: 64px; }
  .builder-step { gap: 7px; padding: 9px 8px; }
  .builder-step-number { width: 25px; height: 25px; flex-basis: 25px; font-size: 11px; }
  .builder-step-copy strong { font-size: 10px; }
  .builder-selected-rows { padding-inline: 5px; }
  .builder-selected-row { grid-template-columns: 28px 46px minmax(0, 1fr) 74px 25px; gap: 6px; min-height: 65px; padding-inline: 4px; }
  .builder-selected-type { display: none; }
  .builder-selected-image { width: 46px; height: 44px; }
  .builder-selected-product strong { font-size: 10px; }
  .builder-selected-product small { font-size: 8px; }
  .builder-selected-price { font-size: 10px; }
  .builder-change-button { display: none; }
  .builder-select-button { grid-column: 4; min-height: 27px; padding-inline: 5px; }
  .builder-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 8px; }
  .builder-product-image { height: 118px; }
  .builder-product-name { font-size: 10px; }
  .builder-product-price strong { font-size: 12px; }
  .builder-filters { align-items: stretch; }
  .builder-filter-search { flex-basis: 100%; }
  .builder-filter-group { min-width: calc(50% - 4px); flex: 1 1 calc(50% - 4px); }
  .builder-switch-option { flex-basis: 100%; }
  .builder-sort-control { width: 100%; margin-left: 0; justify-content: space-between; }
  .builder-sort-control select { flex: 1; }
  .builder-preset-grid { grid-template-columns: minmax(0, 1fr); }
  .builder-preset-image { width: 82px; flex-basis: 82px; }
}
@media (prefers-reduced-motion: reduce) {
  .builder-page *, .builder-page *::before, .builder-page *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
</style>
