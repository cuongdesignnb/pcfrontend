<script setup lang="ts">
definePageMeta({ middleware: 'auth', ssr: false })

interface AffiliateProfile {
  code: string | null
  status: 'pending' | 'active' | 'locked'
  phone: string
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  payout_days: number[]
}
interface AffiliateCommissionRow {
  id: number
  order_number: string
  base_amount: number
  amount: number
  status: 'pending' | 'approved' | 'cancelled'
  approve_after: string | null
  cancelled_reason: string | null
  created_at: string
}
interface AffiliateDashboard {
  affiliate: AffiliateProfile | null
  id_card_required: boolean
  stats?: { clicks: number; customers: number; orders: number }
  wallet?: { available: number; pending: number; next_approval_at: string | null; total_earned: number; min_payout: number }
  commissions?: { data: AffiliateCommissionRow[]; meta: { current_page: number; last_page: number; total: number } }
}

const config = useRuntimeConfig()
const auth = useAuth()
const { siteName } = useSettings()
const { copy, status: copyStatus, message: copyMessage } = useNewsShare()

const dashboard = ref<AffiliateDashboard | null>(null)
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const formError = ref('')
const savedNote = ref('')
const page = ref(1)
const form = reactive({ phone: auth.user.value?.phone ?? '', bank_name: '', bank_account_number: '', bank_account_name: '', id_card_number: '' })
const payoutCount = ref(1)
const payoutDays = ref<number[]>([10, 20, 28])

const affiliate = computed(() => dashboard.value?.affiliate ?? null)
const referralLink = computed(() => affiliate.value?.code && import.meta.client ? `${window.location.origin}/?ref=${affiliate.value.code}` : '')
const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : ''
const statusLabel = { pending: 'Chờ duyệt', approved: 'Được rút', cancelled: 'Đã huỷ' } as const

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    dashboard.value = await auth.authFetch<AffiliateDashboard>(`${config.public.apiBase}/affiliate/me?page=${page.value}`)
    const profile = dashboard.value.affiliate
    if (profile) {
      Object.assign(form, { phone: profile.phone, bank_name: profile.bank_name ?? '', bank_account_number: profile.bank_account_number ?? '', bank_account_name: profile.bank_account_name ?? '' })
      if (profile.payout_days.length) {
        payoutCount.value = profile.payout_days.length
        payoutDays.value = [...profile.payout_days, 10, 20, 28].slice(0, 3)
      }
    }
  } catch {
    loadError.value = 'Không thể tải thông tin cộng tác viên.'
  } finally {
    loading.value = false
  }
}

const submitRegistration = async () => {
  saving.value = true
  formError.value = ''
  try {
    await auth.authFetch(`${config.public.apiBase}/affiliate/register`, { method: 'POST', body: { ...form, id_card_number: form.id_card_number || undefined } })
    await auth.fetchUser()
    await load()
  } catch (error: unknown) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data
    formError.value = Object.values(data?.errors ?? {})[0]?.[0] ?? data?.message ?? 'Không thể gửi đăng ký. Vui lòng thử lại.'
  } finally {
    saving.value = false
  }
}

const savePayoutSchedule = async () => {
  saving.value = true
  savedNote.value = ''
  formError.value = ''
  try {
    const days = [...new Set(payoutDays.value.slice(0, payoutCount.value).map(Number))]
    await auth.authFetch(`${config.public.apiBase}/affiliate/me/payout-schedule`, { method: 'PUT', body: { payout_days: days } })
    savedNote.value = 'Đã lưu lịch rút tiền.'
    await load()
  } catch {
    formError.value = 'Ngày rút phải khác nhau và trong khoảng 1–28.'
  } finally {
    saving.value = false
  }
}

const goToPage = (next: number) => { page.value = next; void load() }

onMounted(() => { void load() })
useSeoMeta({ title: () => `Cộng tác viên - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Cộng tác viên</h1><p>Chia sẻ link sản phẩm, khách mua qua link của bạn được giảm giá và bạn nhận hoa hồng.</p></div></div>
    <div v-if="loading && !dashboard" class="account-loading-card">Đang tải…</div>
    <div v-else-if="loadError" class="account-error-card"><CartIcon name="help" size="22" /><span>{{ loadError }}</span><button type="button" @click="load">Thử lại</button></div>

    <form v-else-if="!affiliate || affiliate.status === 'pending'" class="account-form-card" @submit.prevent="submitRegistration">
      <p v-if="affiliate?.status === 'pending'" class="account-success-note">Đăng ký của bạn đang chờ cửa hàng duyệt. Bạn vẫn có thể sửa thông tin bên dưới.</p>
      <h2 class="ctv-title">{{ affiliate ? 'Thông tin đăng ký' : 'Đăng ký làm cộng tác viên' }}</h2>
      <div class="account-form-grid">
        <div class="account-form-field"><label for="ctv-phone">Số điện thoại *</label><input id="ctv-phone" v-model="form.phone" type="tel" maxlength="20" required></div>
        <div class="account-form-field"><label for="ctv-bank">Ngân hàng *</label><input id="ctv-bank" v-model="form.bank_name" maxlength="100" placeholder="VD: Vietcombank" required></div>
        <div class="account-form-field"><label for="ctv-account">Số tài khoản *</label><input id="ctv-account" v-model="form.bank_account_number" maxlength="50" required></div>
        <div class="account-form-field"><label for="ctv-holder">Chủ tài khoản *</label><input id="ctv-holder" v-model="form.bank_account_name" maxlength="100" required></div>
        <div v-if="dashboard?.id_card_required" class="account-form-field"><label for="ctv-id">Số CCCD *</label><input id="ctv-id" v-model="form.id_card_number" maxlength="20" required></div>
      </div>
      <p v-if="formError" class="account-form-error">{{ formError }}</p>
      <div class="account-form-actions"><button type="submit" class="account-primary-button" :disabled="saving">{{ saving ? 'Đang gửi…' : (affiliate ? 'Cập nhật' : 'Gửi đăng ký') }}</button></div>
    </form>

    <div v-else-if="affiliate.status === 'locked'" class="account-error-card"><CartIcon name="lock" size="22" /><span>Tài khoản cộng tác viên đang bị khoá. Vui lòng liên hệ cửa hàng.</span></div>

    <template v-else>
      <section class="account-form-card ctv-link-card">
        <div><span class="ctv-muted">Mã giới thiệu</span><strong class="ctv-code">{{ affiliate.code }}</strong></div>
        <div class="ctv-link-row"><input :value="referralLink" readonly aria-label="Link giới thiệu"><button type="button" class="account-primary-button" @click="copy(referralLink)">Sao chép link</button></div>
        <p v-if="copyStatus !== 'idle'" class="ctv-muted">{{ copyMessage }}</p>
        <p class="ctv-muted">Vào trang sản phẩm bất kỳ (đang đăng nhập) để lấy link riêng của sản phẩm đó và xem mức hoa hồng.</p>
      </section>

      <div class="account-stat-grid ctv-stats">
        <div class="account-stat-card"><span class="ctv-muted">Số dư được rút</span><strong>{{ formatMoney(dashboard?.wallet?.available ?? 0) }}</strong><small class="ctv-muted">Rút tối thiểu {{ formatMoney(dashboard?.wallet?.min_payout ?? 0) }}</small></div>
        <div class="account-stat-card"><span class="ctv-muted">Hoa hồng đang chờ về</span><strong>{{ formatMoney(dashboard?.wallet?.pending ?? 0) }}</strong><small v-if="dashboard?.wallet?.next_approval_at" class="ctv-muted">Dự kiến duyệt từ {{ formatDate(dashboard.wallet.next_approval_at) }}</small><small v-else class="ctv-muted">Duyệt sau khi đơn giao thành công</small></div>
        <div class="account-stat-card"><span class="ctv-muted">Lượt bấm · Khách · Đơn</span><strong>{{ dashboard?.stats?.clicks ?? 0 }} · {{ dashboard?.stats?.customers ?? 0 }} · {{ dashboard?.stats?.orders ?? 0 }}</strong></div>
      </div>

      <form class="account-form-card" @submit.prevent="savePayoutSchedule">
        <h2 class="ctv-title">Lịch rút tiền</h2>
        <div class="ctv-payout-row">
          <label>Số lần mỗi tháng
            <select v-model.number="payoutCount"><option :value="1">1 lần</option><option :value="2">2 lần</option><option :value="3">3 lần</option></select>
          </label>
          <label v-for="index in payoutCount" :key="index">Ngày
            <select v-model.number="payoutDays[index - 1]"><option v-for="day in 28" :key="day" :value="day">{{ day }}</option></select>
          </label>
          <button type="submit" class="account-primary-button" :disabled="saving">Lưu lịch</button>
        </div>
        <p v-if="savedNote" class="account-success-note">{{ savedNote }}</p>
        <p v-if="formError" class="account-form-error">{{ formError }}</p>
        <p class="ctv-muted">Đến ngày đã chọn, cửa hàng chuyển số dư được rút vào tài khoản {{ affiliate.bank_name }} {{ affiliate.bank_account_number }}.</p>
      </form>

      <section class="account-list-card">
        <h2 class="ctv-title">Lịch sử hoa hồng</h2>
        <div v-if="!dashboard?.commissions?.data.length" class="account-empty-state"><CartIcon name="coin" size="31" /><h3>Chưa có hoa hồng</h3><p>Chia sẻ link sản phẩm để bắt đầu nhận hoa hồng.</p></div>
        <table v-else class="ctv-table">
          <thead><tr><th>Đơn</th><th>Giá trị</th><th>Hoa hồng</th><th>Trạng thái</th></tr></thead>
          <tbody>
            <tr v-for="row in dashboard.commissions.data" :key="row.id">
              <td>{{ row.order_number }}<small>{{ formatDate(row.created_at) }}</small></td>
              <td>{{ formatMoney(row.base_amount) }}</td>
              <td><strong>{{ formatMoney(row.amount) }}</strong></td>
              <td :class="`is-${row.status}`">{{ statusLabel[row.status] }}<small v-if="row.status === 'pending' && row.approve_after">dự kiến {{ formatDate(row.approve_after) }}</small><small v-if="row.cancelled_reason">{{ row.cancelled_reason }}</small></td>
            </tr>
          </tbody>
        </table>
        <div v-if="(dashboard?.commissions?.meta.last_page ?? 1) > 1" class="ctv-pager">
          <button type="button" class="account-secondary-button" :disabled="page <= 1" @click="goToPage(page - 1)">Trang trước</button>
          <span>{{ page }} / {{ dashboard?.commissions?.meta.last_page }}</span>
          <button type="button" class="account-secondary-button" :disabled="page >= (dashboard?.commissions?.meta.last_page ?? 1)" @click="goToPage(page + 1)">Trang sau</button>
        </div>
      </section>
    </template>
  </AccountShell>
</template>

<style scoped>
.ctv-title { margin: 0 0 12px; color: var(--pc-secondary); font-size: 15px; font-weight: 800; }
.ctv-muted { color: #73829d; font-size: 11px; }
.ctv-link-card { display: flex; flex-direction: column; gap: 10px; }
.ctv-code { display: block; color: var(--pc-primary); font-size: 24px; font-weight: 850; letter-spacing: .04em; }
.ctv-link-row { display: flex; gap: 8px; }
.ctv-link-row input { flex: 1; min-width: 0; min-height: 36px; padding: 0 10px; border: 1px solid #d5e0ed; border-radius: 5px; font-size: 12px; }
.ctv-stats { margin: 12px 0; }
.ctv-stats .account-stat-card { min-height: 0; }
.ctv-payout-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-bottom: 10px; }
.ctv-payout-row label { display: flex; flex-direction: column; gap: 4px; color: #30466f; font-size: 11px; font-weight: 700; }
.ctv-payout-row select { min-height: 36px; padding: 0 10px; border: 1px solid #d5e0ed; border-radius: 5px; }
.ctv-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ctv-table th { padding: 8px 6px; color: #73829d; font-weight: 700; text-align: left; border-bottom: 1px solid #e2eaf4; }
.ctv-table td { padding: 9px 6px; color: #29416d; border-bottom: 1px solid #eef3f9; vertical-align: top; }
.ctv-table small { display: block; color: #8a97ab; font-size: 10px; }
.ctv-table .is-approved { color: #138452; }
.ctv-table .is-pending { color: #b7791f; }
.ctv-table .is-cancelled { color: #c44955; }
.ctv-pager { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 12px; font-size: 12px; }
@media (max-width: 640px) {
  .ctv-link-row { flex-direction: column; }
  .account-form-grid { grid-template-columns: 1fr; }
}
</style>
