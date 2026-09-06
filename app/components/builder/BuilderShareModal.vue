<script setup lang="ts">
defineProps<{ open: boolean; url: string }>()
const emit = defineEmits<{ close: [] }>()
const copied = ref(false)
const copy = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 1800)
  } catch {
    copied.value = false
  }
}
</script>

<template>
<Teleport to="body">
  <div v-if="open" class="builder-modal-backdrop" @click.self="emit('close')">
    <section class="builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-share-title">
      <button type="button" class="builder-modal-close" aria-label="Đóng" @click="emit('close')">×</button>
      <h2 id="builder-share-title">Chia sẻ cấu hình</h2>
      <p>Liên kết này chứa mã sản phẩm của cấu hình hiện tại.</p>
      <input :value="url" class="builder-modal-input" readonly @focus="($event.target as HTMLInputElement).select()" />
      <div class="builder-modal-actions"><button type="button" class="builder-outline-button" @click="emit('close')">Đóng</button><button type="button" class="builder-primary-button" @click="copy(url)">{{ copied ? 'Đã sao chép' : 'Sao chép liên kết' }}</button></div>
    </section>
  </div>
</Teleport>
</template>
