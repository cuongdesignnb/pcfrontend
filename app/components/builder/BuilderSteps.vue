<script setup lang="ts">
const steps = [
  { number: 1, title: 'Chọn linh kiện', description: 'Lựa chọn sản phẩm theo nhu cầu' },
  { number: 2, title: 'Kiểm tra tương thích', description: 'Hệ thống tự động kiểm tra' },
  { number: 3, title: 'Hoàn thiện cấu hình', description: 'Xem tổng quan và tối ưu' },
  { number: 4, title: 'Lưu & Mua hàng', description: 'Lưu cấu hình hoặc thêm vào giỏ' },
]
</script>

<template>
<section class="builder-steps" aria-label="Các bước xây dựng cấu hình">
  <div v-for="step in steps" :key="step.number" class="builder-step">
    <span class="builder-step-number">{{ step.number }}</span>
    <span class="builder-step-copy">
      <strong>{{ step.title }}</strong>
      <small>{{ step.description }}</small>
    </span>
  </div>
</section>
</template>
