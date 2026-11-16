export interface ContactFormFields {
  name: string
  phone: string
  email: string
  message: string
  website: string
}

const SUCCESS_MESSAGE = 'Cảm ơn anh/chị, Laptop Plus sẽ liên hệ lại sớm.'

/** The /lien-he form: sends to POST /contact-messages. "website" is a hidden honeypot for bots. */
export const useContactForm = () => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const form = reactive<ContactFormFields>({ name: '', phone: '', email: '', message: '', website: '' })
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const message = ref('')

  const errorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'data' in error) {
      const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data
      const firstError = Object.values(data?.errors || {}).flat()[0]
      if (firstError) return firstError
      if (data?.message) return data.message
    }

    return 'Chưa gửi được tin nhắn. Anh/chị vui lòng thử lại hoặc gọi hotline.'
  }

  const submit = async () => {
    if (status.value === 'loading') return
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      status.value = 'error'
      message.value = 'Vui lòng nhập họ tên, số điện thoại và nội dung.'
      return
    }
    status.value = 'loading'
    message.value = ''

    try {
      await $fetch(`${config.public.apiBase}/contact-messages`, {
        method: 'POST',
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          message: form.message.trim(),
          page_url: import.meta.client ? window.location.href : route.fullPath,
          website: form.website,
        },
        cache: 'no-store',
      })
      status.value = 'success'
      message.value = SUCCESS_MESSAGE
      Object.assign(form, { name: '', phone: '', email: '', message: '', website: '' })
    } catch (error: unknown) {
      status.value = 'error'
      message.value = errorMessage(error)
    }
  }

  return { form, status, message, submit }
}
