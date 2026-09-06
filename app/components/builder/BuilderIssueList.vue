<script setup lang="ts">
import type { BuilderComponentType, BuilderIssue } from '~/types/pc-builder'

const props = defineProps<{
  issues: BuilderIssue[]
  componentTypes: BuilderComponentType[]
}>()

const emit = defineEmits<{ focus: [typeId: number] }>()

const typeName = (id: number | null | undefined) => props.componentTypes.find(type => type.id === id)?.name || ''
const focusIssue = (issue: BuilderIssue) => {
  const typeId = issue.source_type_id || issue.target_type_id
  if (typeId) emit('focus', typeId)
}
</script>

<template>
<div v-if="issues.length" class="builder-issue-list" role="alert">
  <button
    v-for="(issue, index) in issues"
    :key="`${issue.code || issue.type}-${index}`"
    type="button"
    class="builder-issue"
    :class="`builder-issue--${issue.type}`"
    :disabled="!issue.source_type_id && !issue.target_type_id"
    @click="focusIssue(issue)"
  >
    <span class="builder-issue-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5m0 3h.01M10.3 3.8 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </span>
    <span>{{ issue.message }}</span>
    <small v-if="typeName(issue.source_type_id) || typeName(issue.target_type_id)">
      {{ typeName(issue.source_type_id) || typeName(issue.target_type_id) }}
    </small>
  </button>
</div>
</template>
