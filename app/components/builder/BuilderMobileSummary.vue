<script setup lang="ts">
defineProps<{ selectedCount: number; totalPrice: number; complete: boolean; adding: boolean }>()
const emit = defineEmits<{ buy: []; details: [] }>()
</script>

<template>
<div class="builder-mobile-summary">
  <button type="button" class="builder-mobile-summary-details" @click="emit('details')"><span>{{ selectedCount }} linh kiện</span><strong>{{ new Intl.NumberFormat('vi-VN').format(totalPrice) }}đ</strong></button>
  <button type="button" class="builder-primary-button" :disabled="!complete || adding" @click="emit('buy')">{{ adding ? 'Đang thêm…' : 'Mua ngay' }}</button>
</div>
</template>
