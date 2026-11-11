<script setup lang="ts">
import { toTelHref } from '~/utils/contactLinks'

interface WarrantyRow {
  product_name: string | null
  serial: string
  purchase_date: string | null
  warranty_months: number
  warranty_end_date: string | null
  days_left: number | null
  status: 'active' | 'expired' | 'unknown'
  customer_phone: string | null
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      reset: (id?: string) => void
    }
  }
}

const config = useRuntimeConfig()
const { siteName, siteHotline, getString } = useSettings()

const mode = ref<'serial' | 'phone'>('serial')
const serial = ref('')
const phone = ref('')
const serialLast4 = ref('')
const loading = ref(false)
const errorMessage = ref('')
const results = ref<WarrantyRow[] | null>(null)
const captchaRequired = ref(false)
const captchaToken = ref('')
const captchaBox = ref<HTMLElement | null>(null)
let captchaWidgetId: string | undefined

const note = computed(() => getString('warranty_lookup_note'))
const turnstileSiteKey = computed(() => getString('turnstile_site_key'))
const hotlineHref = computed(() => toTelHref(siteHotline.value))

const canSubmit = computed(() => {
  if (loading.value) return false
  if (captchaRequired.value && turnstileSiteKey.value && !captchaToken.value) return false
  return mode.value === 'serial'
    ? serial.value.trim().length >= 4
    : phone.value.replace(/\D/g, '').length >= 9 && /^[\p{L}\p{N}]{4}$/u.test(serialLast4.value.trim())
})

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return d && m && y ? `${d}/${m}/${y}` : value
}

const loadTurnstile = () => new Promise<void>((resolve, reject) => {
  if (window.turnstile) return resolve()
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.onload = () => resolve()
  script.onerror = () => reject(new Error('turnstile'))
  document.head.appendChild(script)
})

const showCaptcha = async () => {
  captchaToken.value = ''
  if (!turnstileSiteKey.value) return
  try {
    await loadTurnstile()
    await nextTick()
    if (!captchaBox.value || !window.turnstile) return
    if (captchaWidgetId !== undefined) {
      window.turnstile.reset(captchaWidgetId)
      return
    }
    captchaWidgetId = window.turnstile.render(captchaBox.value, {
      sitekey: turnstileSiteKey.value,
      callback: (token: string) => { captchaToken.value = token },
      'expired-callback': () => { captchaToken.value = '' },
    })
  } catch {
    errorMessage.value = 'Không tải được bước xác minh. Vui lòng tải lại trang.'
  }
}

const submit = async () => {
  if (!canSubmit.value) return
  loading.value = true
  errorMessage.value = ''
  const query: Record<string, string> = mode.value === 'serial'
    ? { serial: serial.value.trim() }
    : { phone: phone.value.trim(), serial_last4: serialLast4.value.trim() }
  if (captchaToken.value) query.captcha_token = captchaToken.value

  try {
    const response = await $fetch<{ data: WarrantyRow[], captcha_required: boolean }>(`${config.public.apiBase}/warranty-lookup`, { query })
    results.value = response.data
    captchaRequired.value = response.captcha_required
  } catch (error: any) {
    const data = error?.data ?? {}
    results.value = null
    if (data.captcha_required) captchaRequired.value = true
    errorMessage.value = data.errors
      ? String(Object.values(data.errors as Record<string, string[]>)[0]?.[0] ?? '')
      : (data.message || 'Không tra cứu được. Vui lòng thử lại sau.')
  } finally {
    loading.value = false
    if (captchaRequired.value) void showCaptcha()
  }
}

useSeoDocument(() => ({
  title: `Tra cứu bảo hành - ${siteName.value}`,
  description: `Tra cứu thời hạn bảo hành máy mua tại ${siteName.value} bằng số serial / service tag hoặc số điện thoại mua hàng.`,
  path: '/tra-cuu-bao-hanh',
}))
</script>

<template>
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Tra cứu bảo hành</h1>
    <p v-if="note" class="mt-2 text-sm text-gray-600">{{ note }}</p>

    <form class="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" @submit.prevent="submit">
      <div class="mb-4 inline-flex rounded-lg bg-gray-100 p-1 text-sm" role="tablist">
        <button type="button" role="tab" :aria-selected="mode === 'serial'" class="rounded-md px-3 py-1.5 font-medium" :class="mode === 'serial' ? 'bg-white text-brand shadow-sm' : 'text-gray-600'" @click="mode = 'serial'">Số serial / Service tag</button>
        <button type="button" role="tab" :aria-selected="mode === 'phone'" class="rounded-md px-3 py-1.5 font-medium" :class="mode === 'phone' ? 'bg-white text-brand shadow-sm' : 'text-gray-600'" @click="mode = 'phone'">Số điện thoại</button>
      </div>

      <div v-if="mode === 'serial'">
        <label for="wl-serial" class="block text-sm font-medium text-gray-700">Số serial / Service tag</label>
        <input id="wl-serial" v-model="serial" type="text" autocomplete="off" maxlength="100" placeholder="VD: 9XK2ABC" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand focus:outline-none">
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <div>
          <label for="wl-phone" class="block text-sm font-medium text-gray-700">Số điện thoại mua hàng</label>
          <input id="wl-phone" v-model="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="09xx xxx xxx" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none">
        </div>
        <div>
          <label for="wl-last4" class="block text-sm font-medium text-gray-700">4 ký tự cuối serial</label>
          <input id="wl-last4" v-model="serialLast4" type="text" autocomplete="off" maxlength="4" placeholder="VD: 9XK2" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand focus:outline-none">
        </div>
      </div>

      <ClientOnly>
        <div v-show="captchaRequired && turnstileSiteKey" class="mt-4">
          <p class="mb-2 text-xs text-gray-600">Bạn đã tra cứu nhiều lần không có kết quả. Vui lòng xác minh để tiếp tục.</p>
          <div ref="captchaBox" />
        </div>
      </ClientOnly>

      <button type="submit" :disabled="!canSubmit" class="mt-4 h-10 w-full rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {{ loading ? 'Đang tra cứu…' : 'Tra cứu' }}
      </button>
      <p v-if="errorMessage" class="mt-3 text-sm text-red-600" role="alert">{{ errorMessage }}</p>
    </form>

    <section v-if="results" class="mt-6" aria-live="polite">
      <p v-if="!results.length" class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
        Không tìm thấy thông tin bảo hành. Vui lòng kiểm tra lại số serial
        <template v-if="siteHotline && hotlineHref">hoặc gọi <a :href="hotlineHref" class="font-semibold text-brand">{{ siteHotline }}</a></template>.
      </p>
      <div v-else class="space-y-3">
        <article v-for="(row, index) in results" :key="`${row.serial}-${index}`" class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <h2 class="text-base font-semibold text-gray-900">{{ row.product_name || 'Sản phẩm' }}</h2>
            <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'">
              {{ row.status === 'active' ? 'Còn bảo hành' : row.status === 'expired' ? 'Hết bảo hành' : 'Chưa rõ hạn' }}
            </span>
          </div>
          <dl class="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div class="flex justify-between gap-3 sm:block"><dt class="text-gray-500">Số serial</dt><dd class="font-mono font-medium text-gray-800">{{ row.serial }}</dd></div>
            <div class="flex justify-between gap-3 sm:block"><dt class="text-gray-500">Ngày mua</dt><dd class="font-medium text-gray-800">{{ formatDate(row.purchase_date) }}</dd></div>
            <div class="flex justify-between gap-3 sm:block"><dt class="text-gray-500">Gói bảo hành</dt><dd class="font-medium text-gray-800">{{ row.warranty_months }} tháng</dd></div>
            <div class="flex justify-between gap-3 sm:block"><dt class="text-gray-500">Hết hạn bảo hành</dt><dd class="font-medium text-gray-800">{{ formatDate(row.warranty_end_date) }}</dd></div>
            <div v-if="row.status === 'active' && row.days_left !== null" class="flex justify-between gap-3 sm:block"><dt class="text-gray-500">Còn lại</dt><dd class="font-semibold text-emerald-700">{{ row.days_left }} ngày</dd></div>
            <div v-if="row.customer_phone" class="flex justify-between gap-3 sm:block"><dt class="text-gray-500">SĐT mua hàng</dt><dd class="font-medium text-gray-800">{{ row.customer_phone }}</dd></div>
          </dl>
        </article>
      </div>
    </section>

    <p class="mt-8 text-sm text-gray-600">
      Xem <NuxtLink to="/bao-hanh" class="font-medium text-brand">chính sách bảo hành</NuxtLink>
      <template v-if="siteHotline && hotlineHref"> hoặc gọi <a :href="hotlineHref" class="font-medium text-brand">{{ siteHotline }}</a> để được hỗ trợ</template>.
    </p>
  </div>
</template>
