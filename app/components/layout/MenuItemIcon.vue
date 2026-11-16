<script setup lang="ts">
/**
 * The "Icon" field of a menu item in admin: an emoji (🖥️) or an image URL.
 * Plain class names ("fa fa-laptop") are skipped: the storefront has no icon font.
 */
const props = defineProps<{ icon?: string | null }>()
const broken = ref(false)

const value = computed(() => (props.icon || '').trim())
const isImage = computed(() => /^(https?:)?\/\//i.test(value.value) || value.value.startsWith('/'))
const isText = computed(() => value.value !== '' && !isImage.value && !/^[a-z0-9 _-]+$/i.test(value.value))
</script>

<template>
  <img v-if="isImage && !broken" :src="value" alt="" class="menu-item-icon menu-item-icon-image" loading="lazy" @error="broken = true">
  <span v-else-if="isText" class="menu-item-icon" aria-hidden="true">{{ value }}</span>
</template>

<style scoped>
.menu-item-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.25em;
  margin-right: 0.4em;
  font-size: 1.05em;
  line-height: 1;
}

.menu-item-icon-image {
  height: 1.25em;
  object-fit: contain;
}
</style>
