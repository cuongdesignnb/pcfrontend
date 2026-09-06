<script setup lang="ts">
import type { BuilderIssue } from '~/types/pc-builder'

const props = defineProps<{
  complete: boolean
  compatible: boolean
  issues: BuilderIssue[]
  checking?: boolean
}>()

const hasErrors = computed(() => props.issues.some(issue => issue.type === 'error'))
const hasWarnings = computed(() => props.issues.some(issue => issue.type === 'warning'))
const state = computed(() => {
  if (props.checking) return 'checking'
  if (hasErrors.value) return 'error'
  if (!props.complete) return 'incomplete'
  if (hasWarnings.value || !props.compatible) return 'warning'
  return 'success'
})
const label = computed(() => ({
  checking: 'Đang kiểm tra',
  error: 'Không tương thích',
  incomplete: 'Chưa hoàn thiện',
  warning: 'Cần kiểm tra',
  success: 'Tương thích hoàn hảo',
}[state.value]))
</script>

<template>
<div class="builder-compatibility" :class="`builder-compatibility--${state}`" role="status" aria-live="polite">
  <span class="builder-compatibility-mark" aria-hidden="true">
    <svg v-if="state === 'success'" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    <svg v-else-if="state === 'error'" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
    <span v-else>{{ state === 'checking' ? '…' : '!' }}</span>
  </span>
  <span class="builder-compatibility-copy">
    <strong>{{ label }}</strong>
    <small v-if="state === 'success'">Các linh kiện đã chọn phù hợp với nhau.</small>
    <small v-else-if="state === 'incomplete'">Chọn đủ linh kiện bắt buộc để tiếp tục.</small>
    <small v-else-if="state === 'checking'">Đang lấy kết quả từ hệ thống.</small>
    <small v-else>Kiểm tra các ghi chú bên dưới.</small>
  </span>
</div>
</template>
