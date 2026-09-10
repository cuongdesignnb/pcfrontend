<script setup lang="ts">
import type { HomepageBanner } from '~/types/homepage'
import { storefrontPath } from '~/utils/urls'

defineProps<{ banners: HomepageBanner[] }>()

function linkFor(banner: HomepageBanner): string {
  return storefrontPath(banner.link || '/phu-kien')
}
</script>

<template>
  <aside v-if="banners.length" class="home-side-promotions" aria-label="Khuyến mãi nổi bật">
    <NuxtLink v-for="banner in banners.slice(0, 3)" :key="banner.id" :to="linkFor(banner)" class="home-side-promotion">
      <img :src="banner.image || ''" :alt="banner.title" loading="lazy">
      <span v-if="banner.badge || banner.title" class="home-side-promotion-caption">
        <b v-if="banner.badge">{{ banner.badge }}</b>
        <strong>{{ banner.title }}</strong>
      </span>
    </NuxtLink>
  </aside>
</template>
