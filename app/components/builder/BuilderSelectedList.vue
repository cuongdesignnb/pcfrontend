<script setup lang="ts">
import type { BuilderComponentType, BuilderIssue, BuilderProduct } from '~/types/pc-builder'

defineProps<{
  componentTypes: BuilderComponentType[]
  selectedProducts: Record<string, BuilderProduct>
  issues: BuilderIssue[]
  activeTypeSlug: string | null
}>()

const emit = defineEmits<{
  change: [type: BuilderComponentType]
  remove: [type: BuilderComponentType]
  reset: []
}>()
</script>

<template>
<section class="builder-panel builder-selected-list" aria-labelledby="builder-selected-title">
  <div class="builder-panel-heading">
    <h2 id="builder-selected-title">Danh sách linh kiện</h2>
    <button type="button" class="builder-text-button" @click="emit('reset')">Xóa tất cả <span aria-hidden="true">↻</span></button>
  </div>
  <div class="builder-selected-rows">
    <BuilderSelectedRow
      v-for="type in componentTypes"
      :key="type.id"
      :type="type"
      :product="selectedProducts[String(type.id)]"
      :issues="issues.filter(issue => issue.source_type_id === type.id || issue.target_type_id === type.id)"
      :active="activeTypeSlug === type.slug"
      @change="emit('change', type)"
      @remove="emit('remove', type)"
    />
  </div>
</section>
</template>
