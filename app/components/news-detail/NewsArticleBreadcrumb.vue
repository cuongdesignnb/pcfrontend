<script setup lang="ts">
import type { NewsDetailPost } from '~/types/news-detail'
import { newsCategoryUrl } from '~/utils/news'

const props = defineProps<{
  post: NewsDetailPost
}>()

const categoryLink = computed(() => props.post.category ? newsCategoryUrl(props.post.category) : '/tin-tuc')
</script>

<template>
  <nav class="news-detail-breadcrumb" aria-label="Điều hướng bài viết">
    <NuxtLink to="/">Trang chủ</NuxtLink>
    <span aria-hidden="true">/</span>
    <NuxtLink to="/tin-tuc">Tin tức</NuxtLink>
    <template v-if="post.category">
      <span aria-hidden="true">/</span>
      <NuxtLink :to="categoryLink">{{ post.category.name }}</NuxtLink>
    </template>
    <span aria-hidden="true">/</span>
    <span class="news-detail-breadcrumb-current" aria-current="page" :title="post.title">{{ post.title }}</span>
  </nav>
</template>
