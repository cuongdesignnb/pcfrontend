<script setup lang="ts">
defineProps<{
  price: number
  purchasable: boolean
  contactOnly: boolean
  zaloHref: string
  messengerHref: string
}>()
const emit = defineEmits<{ add: []; buy: [] }>()
const { formatMoney } = useSettings()
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-lg lg:hidden">
    <div v-if="contactOnly" class="mx-auto flex max-w-xl items-center gap-2"><strong class="min-w-0 flex-1 text-lg text-red-600">Liên hệ</strong><a v-if="zaloHref" :href="zaloHref" target="_blank" rel="noopener noreferrer" class="rounded-lg bg-[#0068ff] px-3 py-2.5 text-sm font-bold text-white">Zalo</a><a v-if="messengerHref" :href="messengerHref" target="_blank" rel="noopener noreferrer" class="rounded-lg bg-[#1684fb] px-3 py-2.5 text-sm font-bold text-white">Messenger</a></div>
    <div v-else class="mx-auto flex max-w-xl items-center gap-3"><strong class="min-w-0 flex-1 text-lg text-blue-700">{{ formatMoney(price) }}</strong><button type="button" :disabled="!purchasable" class="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-45" @click="emit('buy')">Mua ngay</button><button type="button" :disabled="!purchasable" class="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-45" @click="emit('add')">Thêm giỏ</button></div>
  </div>
</template>
