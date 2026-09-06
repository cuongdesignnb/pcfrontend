<script setup lang="ts">
import type { BuilderPreset } from '~/types/pc-builder'

defineProps<{ presets: BuilderPreset[] }>()
const emit = defineEmits<{ use: [preset: BuilderPreset] }>()
</script>

<template>
<section v-if="presets.length" class="builder-panel builder-presets" aria-labelledby="builder-presets-title">
  <div class="builder-panel-heading">
    <div><h2 id="builder-presets-title">Gợi ý cấu hình theo nhu cầu</h2><p>Chọn preset từ dữ liệu cấu hình đã được quản lý trong hệ thống.</p></div>
  </div>
  <div class="builder-preset-grid">
    <BuilderPresetCard v-for="preset in presets" :key="preset.id" :preset="preset" @use="emit('use', $event)" />
  </div>
</section>
</template>
