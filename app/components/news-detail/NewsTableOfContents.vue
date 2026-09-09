<script setup lang="ts">
import type { NewsTocItem } from '~/types/news-detail'

const props = defineProps<{
  items: NewsTocItem[]
}>()

const expanded = ref(false)

const scrollToHeading = (id: string) => {
  if (!import.meta.client) return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  expanded.value = false
}
</script>

<template>
  <aside v-if="items.length" class="news-detail-toc" aria-label="Mục lục bài viết">
    <div class="news-detail-toc-heading">
      <strong>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="3" width="16" height="18" rx="2" stroke-width="1.6" /><path d="M8 7h8M8 11h8M8 15h5" stroke-width="1.6" stroke-linecap="round" /></svg>
        Nội dung chính
      </strong>
      <button type="button" class="news-detail-toc-toggle" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? 'Thu gọn' : 'Xem mục lục' }} <span aria-hidden="true">⌄</span></button>
    </div>
    <nav class="news-detail-toc-list" :class="{ 'is-collapsed': !expanded }">
      <a v-for="(item, index) in items" :key="item.id" :href="`#${item.id}`" :class="`is-level-${item.level}`" @click.prevent="scrollToHeading(item.id)">
        <span>{{ index + 1 }}</span>
        <strong>{{ item.title }}</strong>
      </a>
    </nav>
  </aside>
</template>
