<script setup lang="ts">
import type { BuilderPreset } from '~/types/pc-builder'

defineProps<{ preset: BuilderPreset }>()
const emit = defineEmits<{ use: [preset: BuilderPreset] }>()
</script>

<template>
<article class="builder-preset-card">
  <div class="builder-preset-image">
    <NuxtImg v-if="preset.image" :src="preset.image" :alt="preset.name" width="150" height="100" loading="lazy" />
    <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" /><path d="M8 8h8M8 12h5M8 16h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
  </div>
  <div class="builder-preset-copy">
    <h3>{{ preset.name }}</h3>
    <p>{{ preset.description }}</p>
    <strong v-if="preset.starting_price !== null">Từ {{ new Intl.NumberFormat('vi-VN').format(preset.starting_price) }}đ</strong>
    <button type="button" class="builder-outline-button" @click="emit('use', preset)">Dùng cấu hình này</button>
  </div>
</article>
</template>
