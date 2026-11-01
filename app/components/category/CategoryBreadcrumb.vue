<script setup lang="ts">
import type { CategoryListingCategory } from '~/types/category-listing'
import { categoryUrl } from '~/utils/urls'

const props = defineProps<{ category: CategoryListingCategory | null }>()
const ancestors = computed(() => props.category?.ancestors ?? (props.category?.parent ? [props.category.parent] : []))
</script>

<template>
  <nav class="category-breadcrumb" aria-label="Breadcrumb">
    <NuxtLink to="/">Trang chủ</NuxtLink>
    <span aria-hidden="true">/</span>
    <template v-for="ancestor in ancestors" :key="ancestor.id">
      <NuxtLink :to="categoryUrl(ancestor)">{{ ancestor.name }}</NuxtLink>
      <span aria-hidden="true">/</span>
    </template>
    <span class="is-current" aria-current="page">{{ category?.name || 'Danh mục sản phẩm' }}</span>
  </nav>
</template>
