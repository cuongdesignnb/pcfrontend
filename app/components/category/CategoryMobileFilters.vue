<script setup lang="ts">
const props = defineProps<{
  open: boolean
  activeCount: number
  resultCount: number
}>()

const emit = defineEmits<{
  close: []
  clear: []
}>()
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(panel.value.querySelectorAll<HTMLElement>('button, input, select, a, [tabindex]:not([tabindex="-1"])')).filter(element => !element.hasAttribute('disabled'))
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function restoreFocus() {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  previouslyFocused?.focus()
  previouslyFocused = null
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return
  if (open) {
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeButton.value?.focus()
  } else {
    restoreFocus()
  }
})

onBeforeUnmount(restoreFocus)
</script>

<template>
  <Teleport to="body">
    <Transition name="category-mobile-filter-fade">
      <div v-if="open" class="category-mobile-filter-backdrop" @click.self="emit('close')">
        <section ref="panel" class="category-mobile-filter-panel" role="dialog" aria-modal="true" aria-labelledby="category-mobile-filter-title">
          <header class="category-mobile-filter-header">
            <h2 id="category-mobile-filter-title">Bộ lọc{{ activeCount ? ` (${activeCount})` : '' }}</h2>
            <button ref="closeButton" type="button" aria-label="Đóng bộ lọc" @click="emit('close')">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-width="1.8" d="m7 7 10 10M17 7 7 17" /></svg>
            </button>
          </header>
          <div class="category-mobile-filter-content"><slot /></div>
          <footer class="category-mobile-filter-footer">
            <button type="button" @click="emit('clear')">Xóa lọc</button>
            <button type="button" @click="emit('close')">Xem {{ resultCount }} sản phẩm</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
