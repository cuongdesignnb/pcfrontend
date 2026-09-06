<script setup lang="ts">
import type { BuilderComponentType } from '~/types/pc-builder'

defineProps<{ componentTypes: BuilderComponentType[]; activeTypeSlug: string | null }>()
const emit = defineEmits<{ select: [slug: string] }>()
</script>

<template>
<div class="builder-component-tabs" role="tablist" aria-label="Nhóm linh kiện">
  <button
    v-for="type in componentTypes"
    :key="type.id"
    type="button"
    role="tab"
    :aria-selected="activeTypeSlug === type.slug"
    :class="{ 'is-active': activeTypeSlug === type.slug }"
    @click="emit('select', type.slug)"
  >
    {{ type.name }}
  </button>
</div>
</template>
