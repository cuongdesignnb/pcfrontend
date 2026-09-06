<script setup lang="ts">
import type { NewsBuilderBanner } from '~/types/news'

defineProps<{
  banner: NewsBuilderBanner | null
}>()
</script>

<template>
  <section class="news-pc-builder">
    <NuxtImg
      v-if="banner?.image"
      :src="banner.image"
      :alt="banner.title || 'PC Builder'"
      class="news-pc-builder-image"
      width="900"
      height="460"
      loading="lazy"
      sizes="sm:100vw lg:330px"
    />
    <span class="news-pc-builder-overlay" aria-hidden="true" />
    <div class="news-pc-builder-copy">
      <span class="news-pc-builder-kicker">PC BUILDER</span>
      <h2>Tự do lắp ráp theo phong cách của bạn</h2>
      <ul>
        <li>Chọn linh kiện theo nhu cầu và ngân sách</li>
        <li>Kiểm tra tương thích cấu hình</li>
        <li>Lưu cấu hình để dễ dàng nâng cấp</li>
      </ul>
      <NuxtLink to="/cau-hinh" class="news-pc-builder-button">Bắt đầu build PC ngay <span aria-hidden="true">→</span></NuxtLink>
    </div>
    <svg v-if="!banner?.image" class="news-pc-builder-art" aria-hidden="true" viewBox="0 0 220 180" fill="none">
      <rect x="112" y="30" width="74" height="118" rx="5" fill="#0d4b92" stroke="#62a8ff" stroke-width="2" />
      <rect x="124" y="45" width="50" height="74" rx="3" fill="#092e60" stroke="#6fc1ff" stroke-width="1.5" />
      <circle cx="149" cy="133" r="8" fill="#ff6700" fill-opacity=".9" />
      <path d="M26 124h70l19 17H7l19-17Z" fill="#0b407d" stroke="#73b9ff" stroke-width="2" />
      <rect x="37" y="61" width="55" height="56" rx="3" fill="#0a376d" stroke="#62a8ff" stroke-width="2" />
      <circle cx="54" cy="78" r="8" stroke="#ff8c42" stroke-width="2" />
      <circle cx="76" cy="78" r="8" stroke="#4ee1ff" stroke-width="2" />
      <path d="M48 101h34M54 95v12M76 95v12" stroke="#9bd1ff" stroke-width="2" stroke-linecap="round" />
    </svg>
  </section>
</template>
