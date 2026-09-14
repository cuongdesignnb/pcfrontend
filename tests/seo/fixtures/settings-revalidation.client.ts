declare global {
  interface Window {
    __SEO_SETTINGS_REFRESH__?: () => Promise<void>
  }
}

export default defineNuxtPlugin(() => {
  const { fetchSettings } = useSettings()
  window.__SEO_SETTINGS_REFRESH__ = () => fetchSettings(true)
})
