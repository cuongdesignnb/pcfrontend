<script setup lang="ts">
const { siteName } = useSettings()
</script>

<template>
  <header class="news-page-header">
    <h1>Tin tức công nghệ</h1>
    <p>Cập nhật nhanh chóng những thông tin công nghệ mới nhất, đánh giá chuyên sâu và xu hướng hot nhất từ {{ siteName }}.</p>
  </header>
</template>
