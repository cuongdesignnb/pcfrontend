<script setup lang="ts">
import type { HomepageProductTab } from '~/types/homepage'
import { categoryUrl } from '~/utils/urls'

// Tabs and their categories come from Cài đặt → Trang chủ.
const props = defineProps<{ tabs: HomepageProductTab[] }>()

const { getString } = useSettings()
const title = computed(() => getString('homepage_product_tabs_title').trim() || 'Sản phẩm bán chạy')
const activeIndex = ref(0)
const activeTab = computed(() => props.tabs[activeIndex.value] ?? props.tabs[0])
watch(() => props.tabs.length, () => { activeIndex.value = 0 })
</script>

<template>
  <section v-if="activeTab" class="home-section">
    <div class="pc-container">
      <div class="home-block">
        <div class="home-block-heading">
          <h2>{{ title }}</h2>
          <div v-if="tabs.length > 1" class="home-chips" role="tablist" :aria-label="title">
            <button
              v-for="(tab, index) in tabs"
              :key="tab.category.id"
              type="button"
              role="tab"
              :aria-selected="index === activeIndex"
              :class="{ 'is-active': index === activeIndex }"
              @click="activeIndex = index"
            >
              {{ tab.label }}
            </button>
          </div>
          <NuxtLink :to="categoryUrl(activeTab.category)" class="home-block-more">Xem tất cả <span aria-hidden="true">›</span></NuxtLink>
        </div>
        <HomeProductCarousel :key="activeTab.category.id" :products="activeTab.products" variant="homepage" />
      </div>
    </div>
  </section>
</template>
