<script setup lang="ts">
// "Khuyến mại" lines set in admin on the product or its category (one offer per line).
defineProps<{ items?: string[] | null }>()
</script>

<template>
  <section v-if="items?.length" id="lp-km-full" class="pdp-promotions" aria-labelledby="pdp-promotions-title">
    <h2 id="pdp-promotions-title" class="pdp-promotions-title">
      <span aria-hidden="true">🎁</span> Khuyến mại
    </h2>
    <ul class="pdp-promotions-list">
      <li v-for="(item, index) in items" :key="index">
        <span class="pdp-promotions-check" aria-hidden="true">✓</span>
        <span>{{ item }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pdp-promotions {
  margin: 10px 0;
  padding: 10px 12px;
  border: 1px dashed var(--pc-red, #e30613);
  border-radius: 8px;
  background: #fff7f7;
}
.pdp-promotions-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  color: var(--pc-red, #e30613);
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}
.pdp-promotions-list {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.45;
}
.pdp-promotions-list li { display: flex; gap: 6px; }
.pdp-promotions-check { flex: 0 0 auto; color: #16a34a; font-weight: 800; }
</style>
