<script setup lang="ts">
import type { HomepageCategorySection } from '~/types/homepage'

defineProps<{ sections: HomepageCategorySection[] }>()
</script>

<template>
  <section v-if="sections.length" class="home-section home-category-sections">
    <div class="pc-container home-category-section-list">
      <article v-for="section in sections" :key="section.category.id" class="home-category-product-section">
        <div class="home-section-heading home-category-product-heading">
          <div class="home-category-product-title">
            <span class="home-category-product-icon">
              <img v-if="section.category.icon" :src="section.category.icon" :alt="section.category.name" loading="lazy">
              <svg v-else aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="15" rx="2" stroke-width="1.7" />
                <path stroke-linecap="round" stroke-width="1.7" d="M8 22h8M12 19v3" />
              </svg>
            </span>
            <span>
              <h2>{{ section.category.name }}</h2>
              <small>{{ section.product_count }} sản phẩm nổi bật</small>
            </span>
          </div>
          <NuxtLink :to="`/categories/${section.category.slug}`">Xem tất cả <span aria-hidden="true">›</span></NuxtLink>
        </div>
        <HomeProductCarousel :products="section.products" variant="homepage" />
      </article>
    </div>
  </section>
</template>
