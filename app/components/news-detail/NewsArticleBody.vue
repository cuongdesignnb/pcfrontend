<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <div v-if="html" class="news-detail-article-body" v-html="html" />
  <p v-else class="news-detail-empty-body">Nội dung bài viết đang được cập nhật.</p>
</template>
