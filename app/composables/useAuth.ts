import { useCartSession } from './useCartSession'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  date_of_birth?: string | null
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  default_address?: Record<string, unknown> | null
  [key: string]: unknown
}

export interface CommerceMergeResult {
  cart_merged: boolean
  cart_warnings: Array<Record<string, unknown>>
}

interface AuthResponse {
  user: AuthUser
  token: string
  commerce?: CommerceMergeResult
}

const cookieMaxAge = 60 * 60 * 24 * 30

export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()
  const cartSession = useCartSession()
  const token = useCookie<string | null>('auth_token', {
    maxAge: cookieMaxAge,
    path: '/',
    sameSite: 'lax',
  })
  const userCookie = useCookie<string | null>('auth_user', {
    maxAge: cookieMaxAge,
    path: '/',
    sameSite: 'lax',
  })

  const user = computed<AuthUser | null>(() => {
    try {
      return userCookie.value ? JSON.parse(userCookie.value) as AuthUser : null
    } catch {
      return null
    }
  })
  const isAuthenticated = computed(() => Boolean(token.value))
  const lastCommerce = useState<CommerceMergeResult | null>('auth-last-commerce', () => null)

  const saveSession = (response: AuthResponse) => {
    token.value = response.token
    userCookie.value = JSON.stringify(response.user)
    lastCommerce.value = response.commerce ?? null
    return response
  }

  const login = async (email: string, password: string, remember = false) => {
    const response = await $fetch<AuthResponse>(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      headers: cartSession.getHeaders(),
      body: { email: email.trim().toLowerCase(), password, remember },
      cache: 'no-store',
    })
    return saveSession(response)
  }

  const register = async (data: {
    name: string
    email: string
    phone?: string
    password: string
    password_confirmation: string
    terms_accepted: boolean
  }) => {
    const response = await $fetch<AuthResponse>(`${config.public.apiBase}/auth/register`, {
      method: 'POST',
      headers: cartSession.getHeaders(),
      body: { ...data, email: data.email.trim().toLowerCase() },
      cache: 'no-store',
    })
    return saveSession(response)
  }

  const mergeCommerce = async () => {
    if (!token.value) return null
    const response = await authFetch<CommerceMergeResult>(`${config.public.apiBase}/auth/commerce/merge`, {
      method: 'POST',
    })
    lastCommerce.value = response
    return response
  }

  const logout = async () => {
    try {
      if (token.value) {
        await $fetch(`${config.public.apiBase}/auth/logout`, {
          method: 'POST',
          headers: { ...cartSession.getHeaders(), Authorization: `Bearer ${token.value}` },
          cache: 'no-store',
        })
      }
    } catch {
      // Local cleanup must still happen when the network is unavailable.
    }

    token.value = null
    userCookie.value = null
    lastCommerce.value = null
    cartSession.rotate()
    await router.replace('/')
  }

  const fetchUser = async () => {
    if (!token.value) return null

    try {
      const response = await authFetch<{ user: AuthUser }>(`${config.public.apiBase}/auth/me`, {
        method: 'GET',
      })
      userCookie.value = JSON.stringify(response.user)
      return response.user
    } catch {
      token.value = null
      userCookie.value = null
      return null
    }
  }

  const authFetch = <T>(url: string, options: Record<string, unknown> = {}) => {
    const optionHeaders = (options.headers as Record<string, string> | undefined) ?? {}
    const requestCache = options.cache as RequestCache | undefined
    return $fetch<T>(url, {
      ...options,
      cache: requestCache ?? 'no-store',
      headers: {
        ...cartSession.getHeaders(),
        ...optionHeaders,
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
    })
  }

  return {
    user,
    token,
    isAuthenticated,
    lastCommerce,
    login,
    register,
    mergeCommerce,
    logout,
    fetchUser,
    authFetch,
  }
}
