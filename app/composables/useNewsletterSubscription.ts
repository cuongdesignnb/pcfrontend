export const useNewsletterSubscription = () => {
  const config = useRuntimeConfig()
  const email = ref('')
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const message = ref('')

  const errorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'data' in error) {
      const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data
      if (data?.message) return data.message
      const firstError = Object.values(data?.errors || {}).flat()[0]
      if (firstError) return firstError
    }

    return 'Không thể đăng ký lúc này. Vui lòng thử lại.'
  }

  const subscribe = async () => {
    status.value = 'loading'
    message.value = ''

    try {
      const response = await $fetch<{ message: string }>(`${config.public.apiBase}/newsletter/subscribe`, {
        method: 'POST',
        body: { email: email.value.trim() },
        cache: 'no-store',
      })
      status.value = 'success'
      message.value = response.message
      email.value = ''
    } catch (error: unknown) {
      status.value = 'error'
      message.value = errorMessage(error)
    }
  }

  return {
    email,
    status,
    message,
    subscribe,
  }
}
