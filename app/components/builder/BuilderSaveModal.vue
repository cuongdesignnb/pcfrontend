<script setup lang="ts">
const props = defineProps<{ open: boolean; defaultName: string; saving: boolean }>()
const emit = defineEmits<{ close: []; save: [name: string] }>()
const name = ref(props.defaultName)
const input = ref<HTMLInputElement | null>(null)

watch(() => props.defaultName, (defaultName) => {
  if (defaultName) name.value = defaultName
})
watch(() => props.open, (open) => {
  if (open) nextTick(() => input.value?.focus())
})
const submit = () => {
  const value = name.value.trim()
  if (value) emit('save', value)
}
</script>

<template>
<Teleport to="body">
  <div v-if="open" class="builder-modal-backdrop" @click.self="emit('close')">
    <section class="builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-save-title">
      <button type="button" class="builder-modal-close" aria-label="Đóng" @click="emit('close')">×</button>
      <h2 id="builder-save-title">Lưu cấu hình</h2>
      <p>Đặt tên để bạn có thể mở lại cấu hình này trong tài khoản.</p>
      <label class="builder-modal-label" for="builder-save-name">Tên cấu hình</label>
      <input id="builder-save-name" ref="input" v-model="name" class="builder-modal-input" maxlength="255" @keyup.enter="submit" />
      <div class="builder-modal-actions"><button type="button" class="builder-outline-button" @click="emit('close')">Hủy</button><button type="button" class="builder-primary-button" :disabled="saving || !name.trim()" @click="submit">{{ saving ? 'Đang lưu…' : 'Lưu cấu hình' }}</button></div>
    </section>
  </div>
</Teleport>
</template>
