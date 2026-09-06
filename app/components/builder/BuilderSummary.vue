<script setup lang="ts">
import type { BuilderCheckResponse, BuilderComponentType, BuilderIssue, BuilderProduct } from '~/types/pc-builder'

const props = defineProps<{
  componentTypes: BuilderComponentType[]
  selectedProducts: Record<string, BuilderProduct>
  check: BuilderCheckResponse
  issues: BuilderIssue[]
  selectedCount: number
  hotline: string
  siteName: string
  adding: boolean
  saving: boolean
  checking: boolean
}>()

const emit = defineEmits<{
  buy: []
  cart: []
  save: []
  share: []
  print: []
  focus: [typeId: number]
}>()

const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`
const orderedSelected = computed(() => props.componentTypes.filter(type => props.selectedProducts[String(type.id)]))
const canPurchase = computed(() => props.selectedCount > 0 && props.check.completion.complete && props.check.compatible && !props.issues.some(issue => issue.type === 'error'))
</script>

<template>
<aside class="builder-summary">
  <div class="builder-panel-heading"><h2>Tổng quan cấu hình</h2></div>
  <BuilderCompatibilityStatus :complete="check.completion.complete" :compatible="check.compatible" :issues="issues" :checking="checking" />
  <BuilderIssueList :issues="issues" :component-types="componentTypes" @focus="emit('focus', $event)" />

  <div class="builder-summary-selected">
    <div v-for="type in orderedSelected" :key="type.id" class="builder-summary-selected-row">
      <span>{{ type.name }}</span>
      <strong>{{ formatMoney(selectedProducts[String(type.id)]?.pricing.display_price || 0) }}</strong>
    </div>
    <p v-if="!orderedSelected.length" class="builder-summary-empty">Chưa có linh kiện được chọn.</p>
  </div>

  <div class="builder-summary-total">
    <div><span>Tổng tiền ({{ selectedCount }} sản phẩm)</span><strong>{{ formatMoney(check.totals.price) }}</strong></div>
    <div v-if="check.totals.tdp"><span>Công suất ước tính</span><strong>~ {{ check.totals.tdp }}W</strong></div>
    <div v-if="check.totals.recommended_psu_wattage"><span>Khuyến nghị nguồn</span><strong>{{ check.totals.recommended_psu_wattage }}W trở lên</strong></div>
  </div>

  <div class="builder-summary-actions">
    <button type="button" class="builder-primary-button builder-summary-buy" :disabled="!canPurchase || adding" @click="emit('buy')">{{ adding ? 'Đang xử lý…' : 'Tiến hành mua' }} <span aria-hidden="true">→</span></button>
    <button type="button" class="builder-outline-button builder-summary-cart" :disabled="!canPurchase || adding" @click="emit('cart')"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14l-1 12H6L5 7Zm3 0a4 4 0 0 1 8 0M9 11v4m6-4v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg> Thêm tất cả vào giỏ</button>
    <div class="builder-summary-secondary"><button type="button" :disabled="!selectedCount || saving" @click="emit('save')">{{ saving ? 'Đang lưu…' : 'Lưu cấu hình' }}</button><button type="button" :disabled="!selectedCount" @click="emit('share')">Chia sẻ</button><button type="button" :disabled="!selectedCount" @click="emit('print')">In báo giá</button></div>
  </div>

  <div v-if="hotline" class="builder-support-card">
    <span class="builder-support-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13H3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2v-5Zm16 0h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2v-5ZM8 20h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
    <div><strong>Cần tư vấn cấu hình?</strong><p>Đội ngũ {{ siteName }} sẵn sàng hỗ trợ bạn.</p><a :href="`tel:${hotline.replace(/\s/g, '')}`">{{ hotline }}</a></div>
  </div>
</aside>
</template>
