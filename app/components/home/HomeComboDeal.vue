<script setup lang="ts">
import type { HomepageBanner } from '~/types/homepage'
import { storefrontPath } from '~/utils/urls'

const props = defineProps<{ banners: HomepageBanner[] }>()
const bannerLink = computed(() => storefrontPath(props.banners[0]?.link || '/phu-kien'))
</script>

<template>
  <article v-if="props.banners.length" class="home-feature-card home-combo-deal">
    <div class="home-feature-card-heading">
      <div><h3>COMBO SIÊU ƯU ĐÃI</h3><p>Mua combo - tiết kiệm hơn</p></div>
      <NuxtLink :to="bannerLink">Xem tất cả <span aria-hidden="true">›</span></NuxtLink>
    </div>
    <NuxtLink :to="bannerLink" class="home-combo-content">
      <img v-if="props.banners[0]?.image" :src="props.banners[0].image" :alt="props.banners[0].title" loading="lazy">
      <div><strong>{{ props.banners[0]?.title }}</strong><small>{{ props.banners[0]?.description }}</small></div>
    </NuxtLink>
    <div class="home-feature-tags"><span>PC Gaming</span><span>Màn hình</span><span>Gear</span></div>
  </article>
</template>
