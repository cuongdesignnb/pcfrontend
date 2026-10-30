<script setup lang="ts">
import type { ProductCompliance } from '~/types/product-detail'

// Information required by Nghị định 37/2026/NĐ-CP (Phụ lục I). Technical
// specifications are shown in their own table.
defineProps<{ compliance: ProductCompliance }>()
</script>

<template>
  <section id="thong-tin-quy-dinh" class="pdp-panel scroll-mt-28">
    <h2 class="pdp-section-title">Thông tin sản phẩm</h2>
    <dl class="mt-3 divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200 text-[12px]">
      <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] gap-3 px-3 py-2">
        <dt class="text-slate-500">Năm sản xuất</dt>
        <dd class="font-medium text-slate-700">{{ compliance.manufacture_year ?? 'Đang cập nhật' }}</dd>
      </div>
      <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] gap-3 px-3 py-2">
        <dt class="text-slate-500">Tình trạng</dt>
        <dd class="font-medium" :class="compliance.is_refurbished ? 'text-amber-700' : 'text-slate-700'">{{ compliance.refurbished_label || 'Mới' }}</dd>
      </div>
      <div v-if="compliance.warning_info" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] gap-3 px-3 py-2">
        <dt class="text-slate-500">Thông tin cảnh báo</dt>
        <dd class="whitespace-pre-line text-slate-700">{{ compliance.warning_info }}</dd>
      </div>
      <div v-if="compliance.usage_instructions" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] gap-3 px-3 py-2">
        <dt class="text-slate-500">Hướng dẫn sử dụng, bảo quản</dt>
        <dd class="whitespace-pre-line text-slate-700">{{ compliance.usage_instructions }}</dd>
      </div>
    </dl>
  </section>
</template>
