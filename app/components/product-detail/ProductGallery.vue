<script setup lang="ts">
import type { ProductDetail } from '~/types/product-detail'

const props = defineProps<{ product: ProductDetail }>()
const selectedIndex = ref(0)
const open = ref(false)
const zoomed = ref(false)
const brokenImages = ref<Set<number>>(new Set())
const closeButton = ref<HTMLButtonElement | null>(null)
const toast = useToast()

const images = computed(() => props.product.images.filter(image => Boolean(image.url) && !brokenImages.value.has(image.id)))
const selected = computed(() => images.value[selectedIndex.value])

watch(() => props.product.id, () => {
  selectedIndex.value = 0
  brokenImages.value = new Set()
  open.value = false
  zoomed.value = false
})

watch(() => images.value.length, length => {
  if (!length) {
    selectedIndex.value = 0
    open.value = false
    return
  }
  selectedIndex.value = Math.min(selectedIndex.value, length - 1)
})

const selectImage = (index: number) => {
  selectedIndex.value = index
  zoomed.value = false
}

const markImageBroken = (imageId?: number) => {
  if (!imageId) return
  const next = new Set(brokenImages.value)
  next.add(imageId)
  brokenImages.value = next
}

const next = () => {
  if (images.value.length) selectedIndex.value = (selectedIndex.value + 1) % images.value.length
  zoomed.value = false
}
const previous = () => {
  if (images.value.length) selectedIndex.value = (selectedIndex.value - 1 + images.value.length) % images.value.length
  zoomed.value = false
}
const openModal = () => {
  if (!selected.value) return
  open.value = true
  nextTick(() => closeButton.value?.focus())
}
const shareProduct = async () => {
  if (!import.meta.client) return
  const shareData = { title: props.product.name, url: window.location.href }
  try {
    if (navigator.share) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    toast.add({ title: 'Đã sao chép liên kết', color: 'success' })
  } catch {
    // Closing the native share sheet is not an error worth surfacing.
  }
}
const onKeydown = (event: KeyboardEvent) => {
  if (!open.value) return
  if (event.key === 'Escape') open.value = false
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') previous()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="pdp-gallery" aria-label="Thư viện ảnh sản phẩm">
    <div v-if="images.length > 1" class="pdp-gallery-thumbs" aria-label="Ảnh thu nhỏ">
      <button
        v-for="(image, index) in images"
        :key="image.id"
        type="button"
        :aria-label="`Xem ảnh ${index + 1}`"
        :aria-pressed="selectedIndex === index"
        class="pdp-gallery-thumb"
        :class="selectedIndex === index ? 'border-blue-600' : 'border-slate-200 hover:border-blue-300'"
        @click="selectImage(index)"
      >
        <img :src="image.url!" :alt="image.alt || `${product.name} ${index + 1}`" loading="lazy" decoding="async" @error="markImageBroken(image.id)">
      </button>
    </div>
    <div class="pdp-gallery-main group">
      <button type="button" class="pdp-gallery-share" aria-label="Chia sẻ sản phẩm" @click="shareProduct">
        <span aria-hidden="true">↗</span>
      </button>
      <button type="button" class="pdp-gallery-main-trigger" :aria-label="`Phóng to ảnh ${product.name}`" @click="openModal">
        <img
          v-if="selected?.url"
          :src="selected.url"
          :alt="selected.alt || product.name"
          :width="selected.width || undefined"
          :height="selected.height || undefined"
          fetchpriority="high"
          decoding="async"
          @error="markImageBroken(selected?.id)"
        >
        <span v-else class="pdp-gallery-empty">Chưa có ảnh sản phẩm</span>
        <span v-if="images.length > 1" class="pdp-gallery-counter">{{ selectedIndex + 1 }}/{{ images.length }}</span>
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4" role="dialog" aria-modal="true" :aria-label="`Ảnh ${product.name}`" @click.self="open = false">
      <button ref="closeButton" type="button" class="absolute right-4 top-4 rounded-full bg-white/15 px-4 py-2 text-sm text-white hover:bg-white/25" aria-label="Đóng thư viện ảnh" @click="open = false">Đóng</button>
      <button v-if="images.length > 1" type="button" class="absolute left-3 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 md:left-8" aria-label="Ảnh trước" @click="previous">←</button>
      <button type="button" class="pdp-gallery-modal-image" :aria-label="zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh'" @click="zoomed = !zoomed">
        <img v-if="selected?.url" :src="selected.url" :alt="selected.alt || product.name" decoding="async" @error="markImageBroken(selected?.id)" :class="zoomed ? 'is-zoomed' : ''">
      </button>
      <button v-if="images.length > 1" type="button" class="absolute right-3 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 md:right-8" aria-label="Ảnh sau" @click="next">→</button>
    </div>
  </Teleport>
</template>

<style scoped>
.pdp-gallery {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
}

.pdp-gallery-thumbs {
  display: flex;
  max-height: 520px;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
}

.pdp-gallery-thumb {
  display: grid;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  place-items: center;
  overflow: hidden;
  border-width: 1px;
  border-style: solid;
  border-radius: 7px;
  background: #fff;
  padding: 4px;
}

.pdp-gallery-thumb img,
.pdp-gallery-main-trigger img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pdp-gallery-main {
  position: relative;
  min-width: 0;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  min-height: 320px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #fff;
}

.pdp-gallery-main-trigger {
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
  border: 0;
  color: inherit;
  background: transparent;
  padding: 0;
}

.pdp-gallery-main-trigger img {
  padding: clamp(14px, 2.8vw, 30px);
  transition: transform .3s ease;
}

.pdp-gallery-main:hover .pdp-gallery-main-trigger img {
  transform: scale(1.02);
}

.pdp-gallery-share {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #64748b;
  background: #fff;
  box-shadow: 0 2px 6px rgb(15 23 42 / 8%);
}

.pdp-gallery-share:hover {
  border-color: #93c5fd;
  color: #1264d8;
}

.pdp-gallery-counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border-radius: 4px;
  padding: 4px 8px;
  color: #fff;
  background: rgb(15 23 42 / 72%);
  font-size: 11px;
  font-weight: 600;
}

.pdp-gallery-empty {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
}

.pdp-gallery-modal-image {
  display: flex;
  max-width: min(90vw, 1200px);
  max-height: 85vh;
  align-items: center;
  justify-content: center;
  overflow: auto;
  cursor: zoom-in;
}

.pdp-gallery-modal-image img {
  display: block;
  max-width: 100%;
  max-height: 82vh;
  object-fit: contain;
  transition: transform .2s ease;
}

.pdp-gallery-modal-image img.is-zoomed {
  max-width: none;
  max-height: none;
  cursor: zoom-out;
  transform: scale(1.5);
}

@media (max-width: 767px) {
  .pdp-gallery {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .pdp-gallery-main {
    order: 1;
    aspect-ratio: 1 / .92;
    min-height: 0;
  }

  .pdp-gallery-thumbs {
    order: 2;
    max-height: none;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
  }

  .pdp-gallery-thumb {
    width: 58px;
    height: 58px;
    flex-basis: 58px;
  }

  .pdp-gallery-share,
  .pdp-gallery-counter {
    right: 10px;
  }

  .pdp-gallery-share { top: 10px; }
  .pdp-gallery-counter { bottom: 10px; }
}

@media (max-width: 420px) {
  .pdp-gallery-main { aspect-ratio: 1 / 1; }
  .pdp-gallery-main-trigger img { padding: 12px; }
  .pdp-gallery-modal-image { max-width: 96vw; }
}
</style>
