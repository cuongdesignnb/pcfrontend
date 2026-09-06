<script setup lang="ts">
defineProps<{
  siteName: string
  tagline?: string
}>()
</script>

<template>
<header class="builder-page-header">
  <div>
    <h1>PC Builder</h1>
    <p>Tự do lựa chọn linh kiện - Kiến tạo cỗ máy trong mơ của bạn</p>
  </div>
  <span v-if="tagline || siteName" class="builder-page-header-note">
    {{ tagline || `${siteName} · Tối ưu cấu hình theo dữ liệu hệ thống` }}
  </span>
</header>
</template>
