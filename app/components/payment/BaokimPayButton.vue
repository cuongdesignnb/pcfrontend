<script setup lang="ts">
/**
 * Bảo Kim (BKPlus) "Thanh toán / Trả góp" button.
 *
 * Bảo Kim's script reads the order from elements carrying its classes
 * (bk-product-name / -price / -image / -qty / -property) and fills `.bk-btn`.
 * Those elements live in a hidden block here, one set per line, so the data
 * it sends is exactly what the customer is buying (variant, warranty and
 * quantity included) instead of whatever text the page layout shows.
 *
 * The script was written for classic multi-page sites: it initialises once on
 * DOMContentLoaded and keeps its state in global `let` bindings, so it cannot
 * be loaded twice. It is loaded once; each time this button mounts (a new
 * product after client-side navigation) its state is reset and it is started
 * again, and every change of price/quantity/variant refreshes its data.
 */
import type { BaokimLine } from '~/composables/useBaokim'

const props = withDefaults(defineProps<{
  lines: BaokimLine[]
  property?: string
  variantId?: number | null
}>(), { property: '', variantId: null })

const { enabled, mount, refresh, unmount } = useBaokim()

const validLines = computed(() => props.lines.filter(line => line.name.trim() && line.price > 0 && line.quantity > 0))
const visible = computed(() => enabled.value && validLines.value.length > 0)
const signature = computed(() => JSON.stringify([validLines.value, props.property, props.variantId]))

useHead(() => visible.value
  ? { link: [{ key: 'baokim-css', rel: 'stylesheet', href: 'https://public-cdn.baokim.vn/js-server/baokim.css' }] }
  : {})

let started = false
const start = async () => {
  if (started || !visible.value) return
  started = true
  await nextTick()
  await mount(props.variantId)
}

onMounted(start)
watch(visible, (value) => { if (value) start() })
watch(signature, async () => {
  if (!started) return
  await nextTick()
  refresh(props.variantId)
})
onBeforeUnmount(() => { if (started) unmount() })
</script>

<template>
  <div v-if="visible" class="baokim-pay">
    <div class="bk-btn" />
    <div class="baokim-pay-data" hidden aria-hidden="true">
      <template v-for="(line, index) in validLines" :key="index">
        <span class="bk-product-name">{{ line.name }}</span>
        <span class="bk-product-price">{{ Math.round(line.price) }}</span>
        <img class="bk-product-image" :src="line.image || ''" alt="" loading="lazy">
        <input type="hidden" class="bk-product-qty" :value="line.quantity">
      </template>
      <!-- Bảo Kim appends " " to a span's text and then drops two characters, so keep one spare space. -->
      <span v-if="property" class="bk-product-property">{{ `${property} ` }}</span>
    </div>
  </div>
</template>

<style scoped>
.baokim-pay { margin-top: 12px; }
.baokim-pay:has(.bk-btn:empty) { display: none; }
</style>
