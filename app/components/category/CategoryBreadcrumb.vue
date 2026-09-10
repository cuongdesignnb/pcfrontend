<script setup lang="ts">
import type { CategoryListingCategory } from '~/types/category-listing'
import { categoryUrl } from '~/utils/urls'

defineProps<{ category: CategoryListingCategory | null }>()
</script>

<template>
  <nav class="category-breadcrumb" aria-label="Breadcrumb">
    <NuxtLink to="/">Trang chủ</NuxtLink>
    <span aria-hidden="true">/</span>
    <template v-if="category?.parent">
      <NuxtLink :to="categoryUrl(category.parent)">{{ category.parent.name }}</NuxtLink>
      <span aria-hidden="true">/</span>
    </template>
    <span class="is-current" aria-current="page">{{ category?.name || 'Danh mục sản phẩm' }}</span>
  </nav>
</template>
