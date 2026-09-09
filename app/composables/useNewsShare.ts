export const useNewsShare = () => {
  const status = ref<'idle' | 'success' | 'error'>('idle')
  const message = ref('')
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  const clearStatusLater = () => {
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      status.value = 'idle'
      message.value = ''
    }, 3200)
  }

  const copy = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement('textarea')
        input.value = url
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
      }
      status.value = 'success'
      message.value = 'Đã sao chép liên kết.'
    } catch {
      status.value = 'error'
      message.value = 'Không thể sao chép liên kết.'
    }
    clearStatusLater()
  }

  const share = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // The user may close the native share sheet; do not show an error.
        return
      }
    }

    await copy(url)
  }

  return {
    status,
    message,
    copy,
    share,
  }
}
