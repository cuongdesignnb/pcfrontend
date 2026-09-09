<script setup lang="ts">
const props = defineProps<{
  title: string
  slug: string
}>()

const config = useRuntimeConfig()
const { status, message, copy, share } = useNewsShare()
const canNativeShare = ref(false)
const canonicalUrl = computed(() => `${String(config.public.siteUrl).replace(/\/$/, '')}/tin-tuc/${encodeURIComponent(props.slug)}`)
const facebookUrl = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl.value)}`)

onMounted(() => {
  canNativeShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})
</script>

<template>
  <div class="news-detail-share" aria-label="Chia sẻ bài viết">
    <span>Chia sẻ:</span>
    <a :href="facebookUrl" target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ bài viết lên Facebook" class="news-detail-share-button is-facebook">f</a>
    <button v-if="canNativeShare" type="button" class="news-detail-share-button is-share" aria-label="Mở bảng chia sẻ" @click="share(title, canonicalUrl)">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="18" cy="5" r="2.5" stroke-width="1.6" /><circle cx="6" cy="12" r="2.5" stroke-width="1.6" /><circle cx="18" cy="19" r="2.5" stroke-width="1.6" /><path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4" stroke-width="1.6" stroke-linecap="round" /></svg>
    </button>
    <button type="button" class="news-detail-share-button is-copy" aria-label="Sao chép liên kết bài viết" @click="copy(canonicalUrl)">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 15 15 9M7.5 19.5h-2A3.5 3.5 0 0 1 2 16v-1a3.5 3.5 0 0 1 1-2.5l3.5-3.5A3.5 3.5 0 0 1 9 8h2M16.5 4.5h2A3.5 3.5 0 0 1 22 8v1a3.5 3.5 0 0 1-1 2.5L17.5 15a3.5 3.5 0 0 1-2.5 1h-2" stroke-width="1.6" stroke-linecap="round" /></svg>
    </button>
    <span v-if="message" class="news-detail-share-message" :class="{ 'is-error': status === 'error' }" role="status">{{ message }}</span>
  </div>
</template>
