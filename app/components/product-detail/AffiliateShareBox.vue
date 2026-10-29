<script setup lang="ts">
// "Lấy link / Chia sẻ" for a signed-in, approved CTV. Rendered client-only:
// product pages can be cached, and this box is personal.
const props = defineProps<{ productId: number; productName: string; path: string }>()

const config = useRuntimeConfig()
const auth = useAuth()
const { copy, share, status, message } = useNewsShare()
const affiliate = computed(() => auth.user.value?.affiliate ?? null)
const commission = ref<{ commission: string | null; estimated_amount: number } | null>(null)

const link = computed(() => {
  if (!affiliate.value?.code || !import.meta.client) return ''
  const url = new URL(props.path, window.location.origin)
  url.searchParams.set('ref', affiliate.value.code)
  return url.toString()
})
const facebookHref = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.value)}`)
const zaloHref = computed(() => `https://zalo.me/share?url=${encodeURIComponent(link.value)}`)
const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`

watch(() => [affiliate.value?.status, props.productId] as const, async ([status]) => {
  commission.value = null
  if (status !== 'active') return
  try {
    commission.value = await auth.authFetch(`${config.public.apiBase}/affiliate/products/${props.productId}/commission`)
  } catch {
    commission.value = null
  }
}, { immediate: true })
</script>

<template>
  <section v-if="affiliate?.status === 'active' && link" class="affiliate-share-box" aria-label="Chia sẻ cho cộng tác viên">
    <div class="affiliate-share-head">
      <strong>Cộng tác viên {{ affiliate.code }}</strong>
      <span v-if="commission?.commission">Hoa hồng: {{ commission.commission }}<template v-if="commission.estimated_amount"> (~{{ formatMoney(commission.estimated_amount) }})</template></span>
      <span v-else-if="commission">Sản phẩm chưa có mức hoa hồng</span>
    </div>
    <div class="affiliate-share-link">
      <input :value="link" readonly aria-label="Link giới thiệu" @focus="($event.target as HTMLInputElement).select()">
      <button type="button" @click="copy(link)">Lấy link</button>
    </div>
    <div class="affiliate-share-actions">
      <a :href="facebookHref" target="_blank" rel="noopener">Facebook</a>
      <a :href="zaloHref" target="_blank" rel="noopener">Zalo</a>
      <button type="button" @click="share(productName, link)">Chia sẻ khác</button>
      <NuxtLink to="/tai-khoan/cong-tac-vien">Quản lý CTV</NuxtLink>
    </div>
    <p v-if="status !== 'idle'" class="affiliate-share-status" :class="`is-${status}`">{{ message }}</p>
  </section>
</template>

<style scoped>
.affiliate-share-box { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding: 12px; background: #fff8e8; border: 1px dashed #f0b44c; border-radius: 8px; font-size: 12px; }
.affiliate-share-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; color: #6b4a07; }
.affiliate-share-head strong { color: #8a5a00; }
.affiliate-share-link { display: flex; gap: 6px; }
.affiliate-share-link input { flex: 1; min-width: 0; height: 34px; padding: 0 10px; color: #334155; background: #fff; border: 1px solid #f1d29a; border-radius: 6px; font-size: 12px; }
.affiliate-share-link button { height: 34px; padding: 0 14px; color: #fff; background: #e08a00; border: 0; border-radius: 6px; font-weight: 700; white-space: nowrap; }
.affiliate-share-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.affiliate-share-actions a, .affiliate-share-actions button { display: inline-flex; align-items: center; height: 28px; padding: 0 10px; color: #8a5a00; background: #fff; border: 1px solid #f1d29a; border-radius: 999px; font-size: 11px; font-weight: 600; }
.affiliate-share-status { margin: 0; font-size: 11px; }
.affiliate-share-status.is-success { color: #138452; }
.affiliate-share-status.is-error { color: #c44955; }
</style>
