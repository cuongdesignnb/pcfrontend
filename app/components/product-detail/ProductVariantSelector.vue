<script setup lang="ts">
import type { ProductCard, ProductDetail, ProductVariant, WarrantyPackage } from '~/types/product-detail'
import { productUrl } from '~/utils/urls'

defineProps<{
  product: ProductDetail
  variants: ProductVariant[]
  optionGroups: { name: string; values: string[] }[]
  selectedVariant: ProductVariant | null
  selectedAttributes: Record<string, string>
  alternativeProducts: ProductCard[]
  isOptionAvailable: (name: string, value: string) => boolean
  warrantyPackages?: WarrantyPackage[]
  selectedWarranty?: number | null
}>()

const emit = defineEmits<{
  selectVariant: [variant: ProductVariant]
  selectAttribute: [name: string, value: string]
  selectWarranty: [months: number]
}>()

const { formatMoney } = useSettings()

const groupLabel = (name: string) => name === 'Tản nhiệt' ? 'Phiên bản tản nhiệt' : name
const productPath = (product: ProductCard) => productUrl(product)
</script>

<template>
  <section class="space-y-3 border-t border-slate-100 pt-3">
    <div v-if="product.brand || alternativeProducts.length" class="pdp-option-row">
      <span class="pdp-option-label">Thương hiệu</span>
      <div class="flex flex-wrap gap-1.5">
        <span v-if="product.brand" class="pdp-option-chip pdp-option-chip--selected">{{ product.brand.name }}</span>
        <NuxtLink
          v-for="alternative in alternativeProducts"
          :key="alternative.id"
          :to="productPath(alternative)"
          class="pdp-option-chip hover:border-brand hover:text-brand"
        >
          {{ alternative.brand?.name || alternative.name }}
        </NuxtLink>
      </div>
    </div>

    <template v-if="variants.length && optionGroups.length">
      <div v-for="group in optionGroups" :key="group.name" class="pdp-option-row">
        <span class="pdp-option-label">{{ groupLabel(group.name) }}</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="value in group.values"
            :key="value"
            type="button"
            :disabled="!isOptionAvailable(group.name, value)"
            :aria-pressed="selectedAttributes[group.name] === value"
            class="pdp-option-chip disabled:cursor-not-allowed disabled:opacity-40"
            :class="selectedAttributes[group.name] === value ? 'pdp-option-chip--selected' : 'hover:border-brand hover:text-brand'"
            @click="emit('selectAttribute', group.name, value)"
          >
            {{ value }}
          </button>
        </div>
      </div>
    </template>

    <div v-else-if="variants.length" class="pdp-option-row">
      <span class="pdp-option-label">Phiên bản</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="variant in variants"
          :key="variant.id"
          type="button"
          :disabled="!variant.inventory.is_available"
          :aria-pressed="selectedVariant?.id === variant.id"
          class="pdp-option-chip text-left disabled:cursor-not-allowed disabled:opacity-40"
          :class="selectedVariant?.id === variant.id ? 'pdp-option-chip--selected' : 'hover:border-brand hover:text-brand'"
          @click="emit('selectVariant', variant)"
        >
          {{ variant.name }}
        </button>
      </div>
    </div>

    <div v-if="warrantyPackages?.length" class="pdp-option-row">
      <span class="pdp-option-label">Gói bảo hành</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="pkg in warrantyPackages"
          :key="pkg.months"
          type="button"
          :aria-pressed="selectedWarranty === pkg.months"
          class="pdp-option-chip"
          :class="selectedWarranty === pkg.months ? 'pdp-option-chip--selected' : 'hover:border-brand hover:text-brand'"
          @click="emit('selectWarranty', pkg.months)"
        >
          {{ pkg.months }} tháng{{ pkg.price > 0 ? ` (+${formatMoney(pkg.price)})` : '' }}
        </button>
      </div>
    </div>
    <div v-else-if="product.warranty_months" class="pdp-option-row">
      <span class="pdp-option-label">Gói bảo hành mở rộng</span>
      <span class="pdp-option-chip pdp-option-chip--selected">Mặc định ({{ product.warranty_months || 0 }}T)</span>
    </div>
  </section>
</template>
