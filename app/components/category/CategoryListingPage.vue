<script setup lang="ts">
import { categorySortOptions, useCategoryListing } from '~/composables/useCategoryListing'
import type {
  CategoryActiveFilter,
  CategoryListingFilters,
  CategoryTrustItem,
} from '~/types/category-listing'
import { canonicalAbsoluteUrl, serializeJsonLd, useSeoDocument } from '~/composables/useSeoDocument'
import { getErrorStatusCode } from '~/utils/errors'
import { productUrl } from '~/utils/urls'

const route = useRoute()
const { siteName, getString } = useSettings()
const slug = computed(() => String(route.params.category || ''))
const listing = await useCategoryListing(slug)
const {
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
} = listing

if (error.value) {
  const statusCode = getErrorStatusCode(error.value, 503)
  throw createError({
    statusCode: statusCode === 404 ? 404 : 503,
    statusMessage: statusCode === 404 ? 'Không tìm thấy danh mục.' : 'Không thể tải danh mục.',
  })
}
if (status.value === 'success' && !data.value?.category) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy danh mục.' })
}

const category = computed(() => data.value?.category || null)
if (category.value?.canonical_path && route.path !== category.value.canonical_path) {
  await navigateTo({ path: category.value.canonical_path, query: route.query }, { redirectCode: 301 })
}
const filters = computed<CategoryListingFilters>(() => {
  const responseFilters = data.value?.filters
  return {
    brands: responseFilters?.brands || [],
    price_range: responseFilters?.price_range || { min: 0, max: 0 },
    price_presets: responseFilters?.price_presets || [],
    groups: responseFilters?.groups || [],
    specs: responseFilters?.specs || [],
  }
})
const pricePresets = computed(() => filters.value.price_presets)
const products = computed(() => data.value?.products.data || [])
const recommendations = computed(() => data.value?.recommendations || [])
const promoBanner = computed(() => data.value?.promo_banner || null)
const isLoading = computed(() => status.value === 'pending')
const totalProducts = computed(() => data.value?.products.total || 0)
const currentPage = computed(() => data.value?.products.current_page || page.value)
const lastPage = computed(() => data.value?.products.last_page || 1)
const pageSize = computed(() => data.value?.products.per_page || 24)
const resultFrom = computed(() => totalProducts.value ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const resultTo = computed(() => totalProducts.value ? Math.min(currentPage.value * pageSize.value, totalProducts.value) : 0)

const collapsedGroups = ref<Record<string, boolean>>({})
const showMobileFilters = ref(false)
let listingMounted = false

const trustItems = computed<CategoryTrustItem[]>(() => {
  const definitions: Array<[string, string, CategoryTrustItem['icon']]> = [
    ['homepage_service_authenticity_title', 'homepage_service_authenticity_text', 'shield'],
    ['homepage_service_shipping_title', 'homepage_service_shipping_text', 'truck'],
    ['homepage_service_support_title', 'homepage_service_support_text', 'support'],
    ['homepage_service_returns_title', 'homepage_service_returns_text', 'refresh'],
  ]

  return definitions.flatMap(([titleKey, textKey, icon]) => {
    const title = getString(titleKey)
    const text = getString(textKey)
    return title && text ? [{ key: titleKey, title, text, icon }] : []
  })
})

const activeFilters = computed<CategoryActiveFilter[]>(() => {
  const chips: CategoryActiveFilter[] = []
  for (const brandSlug of listing.selectedBrands.value) {
    const brand = filters.value.brands.find(item => item.slug === brandSlug)
    chips.push({ id: `brand:${brandSlug}`, label: brand?.name || brandSlug })
  }

  if (listing.selectedSubCategory.value) {
    const child = category.value?.children?.find(item => item.slug === listing.selectedSubCategory.value)
    chips.push({ id: 'subcategory', label: child?.name || listing.selectedSubCategory.value })
  }
  if (listing.minPrice.value !== undefined || listing.maxPrice.value !== undefined) {
    chips.push({ id: 'price', label: priceLabel(listing.minPrice.value, listing.maxPrice.value) })
  }
  if (listing.inStock.value) chips.push({ id: 'stock', label: 'Còn hàng' })

  for (const [filterSlug, values] of Object.entries(listing.dynamicFilters.value)) {
    const group = filters.value.groups.find(item => item.slug === filterSlug)
    for (const valueSlug of values) {
      const value = group?.values.find(item => item.slug === valueSlug)
      chips.push({ id: `dynamic:${filterSlug}:${valueSlug}`, label: value?.label || valueSlug })
    }
  }
  for (const [filterKey, values] of Object.entries(listing.specFilters.value)) {
    const spec = filters.value.specs.find(item => `spec_${item.key_id}` === filterKey)
    for (const value of values) {
      chips.push({ id: `spec:${filterKey}:${encodeURIComponent(value)}`, label: `${spec?.label || filterKey}: ${value}` })
    }
  }
  return chips
})

function priceLabel(min: number | undefined, max: number | undefined): string {
  const format = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`
  if (min !== undefined && max !== undefined) return `${format(min)} - ${format(max)}`
  if (min !== undefined) return `Từ ${format(min)}`
  return `Đến ${format(max || 0)}`
}

function toggleGroup(slug: string) {
  collapsedGroups.value = { ...collapsedGroups.value, [slug]: !collapsedGroups.value[slug] }
}

function toggleStock() {
  listing.inStock.value = !listing.inStock.value
  listing.resetPage()
}

function changeSort(value: string) {
  sort.value = value
  listing.resetPage()
}

function changeView(value: 'grid' | 'list') {
  viewMode.value = value
}

function changePage(value: number) {
  page.value = value
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handlePriceApply(min: number | undefined, max: number | undefined) {
  listing.applyPrice(min, max)
}

function scrollToToolbar() {
  if (!import.meta.client) return
  const toolbar = document.getElementById('category-toolbar')
  if (!toolbar) return
  toolbar.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

onMounted(() => {
  listingMounted = true
})

watch(() => route.query, () => {
  if (listingMounted) scrollToToolbar()
}, { deep: true })

const queryKeys = computed(() => Object.keys(route.query).filter(key => key !== 'page'))
const hasFilterQuery = computed(() => queryKeys.value.length > 0)
const pageNumber = computed(() => Math.max(1, Number(route.query.page || 1) || 1))
const canonicalPath = computed(() => {
  const path = category.value?.canonical_path || `/${slug.value}`
  return pageNumber.value > 1 && !hasFilterQuery.value ? `${path}?page=${pageNumber.value}` : path
})

const { origin, canonicalUrl } = useSeoDocument(() => ({
  title: (() => {
    const title = category.value?.meta_title || category.value?.name
    return title ? `${title} - ${siteName.value}` : `Danh mục - ${siteName.value}`
  })(),
  description: category.value?.meta_description || category.value?.description,
  path: canonicalPath.value,
  image: category.value?.image,
  robots: hasFilterQuery.value ? 'noindex,follow' : 'index,follow',
}))

const categoryJsonLd = computed(() => {
  if (!category.value || !canonicalUrl.value || hasFilterQuery.value) return null

  const itemListElement = products.value
    .map((item, index) => {
      const path = productUrl(item)
      const url = canonicalAbsoluteUrl(origin.value, path)
      return url ? { '@type': 'ListItem', position: index + 1, url } : null
    })
    .filter((item): item is { '@type': string; position: number; url: string } => item !== null)

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: canonicalAbsoluteUrl(origin.value, '/') },
    ...(category.value.parent
      ? [{
          '@type': 'ListItem',
          position: 2,
          name: category.value.parent.name,
          item: canonicalAbsoluteUrl(origin.value, category.value.parent.canonical_path || `/${category.value.parent.slug}`),
        }]
      : []),
    {
      '@type': 'ListItem',
      position: category.value.parent ? 3 : 2,
      name: category.value.name,
      item: canonicalUrl.value,
    },
  ].filter(item => item.item)

  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl.value,
        name: category.value.meta_title || category.value.name,
        description: category.value.meta_description || category.value.description || undefined,
        url: canonicalUrl.value,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: itemListElement.length,
          itemListElement,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
    ],
  })
})

useHead(() => categoryJsonLd.value
  ? { script: [{ key: 'category-jsonld', type: 'application/ld+json', innerHTML: categoryJsonLd.value }] }
  : {})
</script>

<template>
  <div class="category-page">
    <div class="category-container">
      <CategoryBreadcrumb :category="category" />

      <div class="category-layout">
        <CategoryFilterSidebar
          :category="category"
          :filters="filters"
          :selected-brands="selectedBrands"
          :selected-sub-category="selectedSubCategory"
          :min-price="minPrice"
          :max-price="maxPrice"
          :in-stock="inStock"
          :dynamic-filters="dynamicFilters"
          :spec-filters="specFilters"
          :collapsed-groups="collapsedGroups"
          :price-presets="pricePresets"
          @toggle-brand="listing.toggleBrand"
          @toggle-sub-category="listing.toggleSubCategory"
          @apply-price="handlePriceApply"
          @toggle-stock="toggleStock"
          @toggle-dynamic="listing.toggleDynamicFilter"
          @toggle-spec="listing.toggleSpec"
          @toggle-group="toggleGroup"
          @clear="listing.clearAllFilters"
        />

        <main class="category-main">
          <CategoryHero :category="category" :trust-items="trustItems" />
          <CategoryPromoBanner :banner="promoBanner" />

          <CategoryToolbar
            :from="resultFrom"
            :to="resultTo"
            :total="totalProducts"
            :sort="sort"
            :view-mode="viewMode"
            :sort-options="categorySortOptions"
            :active-filter-count="activeFilters.length"
            :pending="isLoading"
            @open-filters="showMobileFilters = true"
            @update-sort="changeSort"
            @update-view="changeView"
          />
          <CategoryActiveFilters :filters="activeFilters" @remove="listing.removeFilter" @clear="listing.clearAllFilters" />

          <div v-if="error" class="category-error" role="alert">
            Không thể tải danh mục lúc này. Vui lòng thử lại sau.
          </div>
          <template v-else>
            <CategoryProductGrid v-if="viewMode === 'grid' && (isLoading || products.length)" :products="products" :loading="isLoading" />
            <CategoryProductList v-else-if="viewMode === 'list' && products.length" :products="products" />
            <div v-else-if="!isLoading" class="category-empty">
              <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor"><circle cx="28" cy="28" r="17" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="m41 41 13 13M20 28h16M28 20v16" /></svg>
              <h2>Không tìm thấy sản phẩm phù hợp</h2>
              <p>Thử thay đổi bộ lọc hoặc xóa bộ lọc hiện tại.</p>
              <button type="button" @click="listing.clearAllFilters">Xóa tất cả bộ lọc</button>
            </div>
          </template>

          <CategoryPagination v-if="!error" :current-page="currentPage" :last-page="lastPage" @change="changePage" />
          <CategoryRecommendations :products="recommendations" :category-slug="slug" />
        </main>
      </div>
    </div>

    <CategoryMobileFilters :open="showMobileFilters" :active-count="activeFilters.length" :result-count="totalProducts" @close="showMobileFilters = false" @clear="listing.clearAllFilters">
      <CategoryFilterSidebar
        :category="category"
        :filters="filters"
        :selected-brands="selectedBrands"
        :selected-sub-category="selectedSubCategory"
        :min-price="minPrice"
        :max-price="maxPrice"
        :in-stock="inStock"
        :dynamic-filters="dynamicFilters"
        :spec-filters="specFilters"
        :collapsed-groups="collapsedGroups"
        :price-presets="pricePresets"
        @toggle-brand="listing.toggleBrand"
        @toggle-sub-category="listing.toggleSubCategory"
        @apply-price="handlePriceApply"
        @toggle-stock="toggleStock"
        @toggle-dynamic="listing.toggleDynamicFilter"
        @toggle-spec="listing.toggleSpec"
        @toggle-group="toggleGroup"
        @clear="listing.clearAllFilters"
      />
    </CategoryMobileFilters>
  </div>
</template>
