import type { AccountDashboard } from '~/types/account'

export const useAccountDashboard = () => {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const wishlist = useWishlist()
  const data = useState<AccountDashboard | null>('account-dashboard-data', () => null)
  const loading = useState<boolean>('account-dashboard-loading', () => false)
  const error = useState<string>('account-dashboard-error', () => '')

  const load = async (): Promise<AccountDashboard | null> => {
    if (loading.value) return data.value
    loading.value = true
    error.value = ''
    try {
      const currentUser = await auth.fetchUser()
      if (!currentUser) return null

      const [response] = await Promise.all([
        auth.authFetch<AccountDashboard>(`${config.public.apiBase}/account/dashboard`),
        wishlist.ready(),
      ])
      data.value = response
      return response
    } catch {
      error.value = 'Không thể tải dữ liệu tài khoản. Vui lòng thử lại.'
      return null
    } finally {
      loading.value = false
    }
  }

  const clear = () => {
    data.value = null
    error.value = ''
  }

  if (import.meta.client) {
    watch(() => auth.isAuthenticated.value, (authenticated) => {
      if (!authenticated) clear()
    })
  }

  return { data, loading, error, load, clear }
}
