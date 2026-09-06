<script setup lang="ts">
import type { CartItem } from '~/types/cart'

const props = defineProps<{
  items: CartItem[]
  itemCount: number
  allSelected: boolean
  selectedLineCount: number
  busyItemIds: number[]
  removingItemIds: number[]
  pendingQuantities: Record<number, number>
  bulkBusy: boolean
}>()

const emit = defineEmits<{
  'select-all': [selected: boolean]
  'remove-selected': []
  'update:quantity': [item: CartItem, quantity: number]
  'update:selected': [item: CartItem, selected: boolean]
  remove: [item: CartItem]
}>()

function eventChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked
}
</script>

<template>
  <section class="cart-item-list" aria-labelledby="cart-items-heading">
    <div class="cart-list-toolbar">
      <label class="cart-select-all">
        <input type="checkbox" :checked="allSelected" :disabled="bulkBusy || !items.length" @change="emit('select-all', eventChecked($event))">
        <span class="cart-checkbox" aria-hidden="true"><CartIcon v-if="allSelected" name="check" size="14" /></span>
        <strong id="cart-items-heading">Chọn tất cả</strong>
        <span>({{ itemCount }} sản phẩm)</span>
      </label>
      <button type="button" class="cart-toolbar-delete" :disabled="!selectedLineCount || bulkBusy" @click="emit('remove-selected')">
        <CartIcon name="trash" size="15" /> Xóa các sản phẩm đã chọn
      </button>
    </div>

    <div class="cart-list-rows">
      <CartItemRow
        v-for="item in items"
        :key="item.id"
        :item="item"
        :pending-quantity="pendingQuantities[item.id] ?? null"
        :busy="busyItemIds.includes(item.id)"
        :removing="removingItemIds.includes(item.id)"
        @update:quantity="emit('update:quantity', item, $event)"
        @update:selected="emit('update:selected', item, $event)"
        @remove="emit('remove', item)"
      />
    </div>
  </section>
</template>
