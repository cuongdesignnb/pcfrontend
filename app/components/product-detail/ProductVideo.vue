<script setup lang="ts">
import type { ProductVideo } from '~/types/product-detail'

const props = defineProps<{ video: ProductVideo; title: string }>()

// The API already validates the link; re-check here so only a YouTube
// privacy-enhanced embed of an 11-character id can ever become an iframe.
const videoId = computed(() => (/^[A-Za-z0-9_-]{11}$/.test(props.video.id) ? props.video.id : ''))
const embedSrc = computed(() => (videoId.value ? `https://www.youtube-nocookie.com/embed/${videoId.value}?autoplay=1&rel=0` : ''))
const thumbnail = computed(() => (videoId.value ? `https://i.ytimg.com/vi/${videoId.value}/hqdefault.jpg` : ''))
const playing = ref(false)
</script>

<template>
  <section v-if="videoId" id="video" class="product-video" aria-labelledby="product-video-title">
    <h2 id="product-video-title" class="product-video__title">Video sản phẩm</h2>
    <div class="product-video__frame">
      <iframe
        v-if="playing"
        :src="embedSrc"
        :title="`Video ${title}`"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      />
      <button v-else type="button" class="product-video__poster" :aria-label="`Phát video ${title}`" @click="playing = true">
        <img :src="thumbnail" :alt="`Video ${title}`" loading="lazy" decoding="async">
        <span class="product-video__play" aria-hidden="true">
          <svg viewBox="0 0 68 48"><path d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7a8.6 8.6 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.6 8.6 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.6 8.6 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3Z" fill="#f00" /><path d="m45 24-18-10.4v20.8Z" fill="#fff" /></svg>
        </span>
      </button>
    </div>
    <a :href="video.watch_url" target="_blank" rel="noopener noreferrer" class="product-video__link">Xem trên YouTube</a>
  </section>
</template>

<style scoped>
.product-video {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.product-video__title {
  margin-bottom: 12px;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.product-video__frame {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: #0f172a;
  border-radius: 10px;
}

.product-video__frame iframe,
.product-video__poster,
.product-video__poster img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.product-video__poster {
  padding: 0;
  cursor: pointer;
  background: transparent;
}

.product-video__poster img {
  object-fit: cover;
}

.product-video__play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 68px;
  height: 48px;
  transform: translate(-50%, -50%);
  transition: transform .15s ease;
}

.product-video__poster:hover .product-video__play,
.product-video__poster:focus-visible .product-video__play {
  transform: translate(-50%, -50%) scale(1.08);
}

.product-video__link {
  display: inline-block;
  margin-top: 8px;
  color: #1264d8;
  font-size: 13px;
  font-weight: 600;
}

.product-video__link:hover {
  text-decoration: underline;
}
</style>
