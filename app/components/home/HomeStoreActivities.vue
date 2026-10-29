<script setup lang="ts">
import type { HomepageStoreActivity } from '~/types/homepage'
import { toSocialHref } from '~/utils/contactLinks'

// Photos and videos posted in Admin → Hoạt động cửa hàng: one large tile and
// six small ones, filtered by type.
const props = defineProps<{ activities: HomepageStoreActivity[] }>()

const { getString, socialYoutube } = useSettings()
const title = computed(() => getString('homepage_store_activity_title').trim() || 'Hoạt động tại cửa hàng')
const subtitle = computed(() => getString('homepage_store_activity_subtitle').trim())
const youtubeHref = computed(() => toSocialHref(socialYoutube.value, 'youtube'))

type Filter = 'all' | 'video' | 'image'
const filter = ref<Filter>('all')
const filters = computed(() => {
  const hasVideo = props.activities.some(item => item.type === 'video')
  const hasImage = props.activities.some(item => item.type === 'image')
  return hasVideo && hasImage
    ? [{ key: 'all' as Filter, label: 'Tất cả' }, { key: 'video' as Filter, label: 'Video' }, { key: 'image' as Filter, label: 'Hình ảnh' }]
    : []
})
const visible = computed(() => props.activities
  .filter(item => filter.value === 'all' || item.type === filter.value)
  .slice(0, 7))

const opened = ref<HomepageStoreActivity | null>(null)
function close() { opened.value = null }
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') close() }
watch(opened, value => {
  if (!import.meta.client) return
  document.body.style.overflow = value ? 'hidden' : ''
  if (value) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})

function embedSrc(item: HomepageStoreActivity): string | null {
  const url = item.video?.embed_url
  if (!url) return null
  return `${url}${url.includes('?') ? '&' : '?'}autoplay=1`
}
</script>

<template>
  <section v-if="activities.length" class="home-section">
    <div class="pc-container">
      <div class="home-block">
        <div class="home-block-heading">
          <div class="home-block-title">
            <h2>{{ title }}</h2>
            <small v-if="subtitle">{{ subtitle }}</small>
          </div>
          <div v-if="filters.length" class="home-chips" role="tablist" aria-label="Lọc hoạt động">
            <button
              v-for="item in filters"
              :key="item.key"
              type="button"
              role="tab"
              :aria-selected="filter === item.key"
              :class="{ 'is-active': filter === item.key }"
              @click="filter = item.key"
            >
              {{ item.label }}
            </button>
          </div>
          <a v-if="youtubeHref" :href="youtubeHref" target="_blank" rel="noopener noreferrer" class="home-block-more">Xem kênh YouTube <span aria-hidden="true">›</span></a>
        </div>

        <div class="store-activity-grid" :class="{ 'is-single': visible.length === 1 }">
          <button
            v-for="(item, index) in visible"
            :key="item.id"
            type="button"
            class="store-activity-tile"
            :class="{ 'is-featured': index === 0 }"
            :aria-label="`${item.type === 'video' ? 'Xem video' : 'Xem ảnh'}: ${item.title}`"
            @click="opened = item"
          >
            <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy">
            <span v-else class="store-activity-placeholder" aria-hidden="true" />
            <span v-if="item.type === 'video'" class="store-activity-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            </span>
            <span class="store-activity-caption">{{ item.title }}</span>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="opened" class="store-activity-modal" role="dialog" aria-modal="true" :aria-label="opened.title" @click.self="close">
        <div class="store-activity-modal-body">
          <button type="button" class="store-activity-modal-close" aria-label="Đóng" @click="close">×</button>
          <div v-if="opened.type === 'video'" class="store-activity-player">
            <iframe
              v-if="embedSrc(opened)"
              :src="embedSrc(opened) || undefined"
              :title="opened.title"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowfullscreen
            />
            <video v-else-if="opened.video?.file_url" :src="opened.video.file_url" :poster="opened.image || undefined" controls autoplay playsinline />
          </div>
          <img v-else-if="opened.image" :src="opened.image" :alt="opened.title" class="store-activity-photo">
          <p>{{ opened.title }}</p>
        </div>
      </div>
    </Teleport>
  </section>
</template>
