<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  lastPage: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

const pageItems = computed<Array<number | 'ellipsis'>>(() => {
  if (props.lastPage <= 7) return Array.from({ length: props.lastPage }, (_, index) => index + 1)

  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, props.currentPage - 1)
  const end = Math.min(props.lastPage - 1, props.currentPage + 1)
  if (start > 2) items.push('ellipsis')
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < props.lastPage - 1) items.push('ellipsis')
  items.push(props.lastPage)
  return items
})

function goTo(page: number) {
  if (page >= 1 && page <= props.lastPage && page !== props.currentPage) emit('change', page)
}
</script>

<template>
  <nav v-if="lastPage > 1" class="category-pagination" aria-label="Phân trang sản phẩm">
    <button type="button" :disabled="currentPage <= 1" aria-label="Trang trước" @click="goTo(currentPage - 1)">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m14 6-6 6 6 6" /></svg>
    </button>
    <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
      <span v-if="item === 'ellipsis'" class="category-pagination-ellipsis" aria-hidden="true">…</span>
      <button v-else type="button" :class="{ 'is-active': item === currentPage }" :aria-current="item === currentPage ? 'page' : undefined" @click="goTo(item)">{{ item }}</button>
    </template>
    <button type="button" :disabled="currentPage >= lastPage" aria-label="Trang sau" @click="goTo(currentPage + 1)">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m10 6 6 6-6 6" /></svg>
    </button>
  </nav>
</template>
