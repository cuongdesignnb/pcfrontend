<script setup lang="ts">
import type { HomepageCategorySection } from '~/types/homepage'
import { categoryUrl } from '~/utils/urls'

defineProps<{ sections: HomepageCategorySection[] }>()
</script>

<template>
  <section v-if="sections.length" class="home-section">
    <div class="pc-container home-block-list">
      <article v-for="section in sections" :key="section.category.id" class="home-block">
        <div class="home-block-heading">
          <div class="home-block-title">
            <h2>{{ section.category.name }}</h2>
            <small>{{ section.product_count }} sản phẩm</small>
          </div>
          <nav v-if="section.children?.length" class="home-chips" :aria-label="`Danh mục con của ${section.category.name}`">
            <NuxtLink :to="categoryUrl(section.category)" class="is-active">Tất cả</NuxtLink>
            <NuxtLink v-for="child in section.children.slice(0, 8)" :key="child.id" :to="categoryUrl(child)">{{ child.name }}</NuxtLink>
          </nav>
          <NuxtLink :to="categoryUrl(section.category)" class="home-block-more">Xem tất cả <span aria-hidden="true">›</span></NuxtLink>
        </div>
        <HomeProductCarousel :products="section.products" variant="homepage" />
      </article>
    </div>
  </section>
</template>
