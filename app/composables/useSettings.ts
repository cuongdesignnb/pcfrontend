import { resolveSiteName } from '~/utils/seoIdentity'

export type SettingValue = string | number | boolean | null | SettingValue[] | { [key: string]: SettingValue }

function isSettingRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSettingValue(value: unknown): value is SettingValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.every(isSettingValue)
  return isSettingRecord(value) && Object.values(value).every(isSettingValue)
}

function parseSettingsPayload(value: unknown): Record<string, SettingValue> {
  if (!isSettingRecord(value) || !Object.entries(value).every(([key, entry]) => key.trim() !== '' && isSettingValue(entry))) {
    throw new Error('INVALID_SETTINGS_PAYLOAD')
  }
  return value as Record<string, SettingValue>
}

export const useSettings = () => {
  const config = useRuntimeConfig()
  const settings = useState<Record<string, SettingValue>>('site_settings', () => ({}))
  const loaded = useState<boolean>('site_settings_loaded', () => false)
  const settingsError = useState<string | null>('site_settings_error', () => null)

  const fetchSettings = async (force = false) => {
    if (loaded.value && !force) return

    try {
      const payload = await $fetch<unknown>(
        `${config.public.apiBase}/settings`,
        { cache: 'no-store' },
      )
      settings.value = parseSettingsPayload(payload)
      settingsError.value = null
      loaded.value = true
    } catch (error) {
      settingsError.value = error instanceof Error && error.message === 'INVALID_SETTINGS_PAYLOAD'
        ? 'invalid_payload'
        : 'unavailable'
      console.error('[useSettings] Failed to load settings:', error)
    }
  }

  const get = (key: string): SettingValue => settings.value[key] ?? null

  const getString = (key: string, fallback = ''): string => {
    const value = get(key)
    return typeof value === 'string' && value.trim() !== '' ? value : fallback
  }

  const getNumber = (key: string, fallback = 0): number => {
    const value = get(key)
    if (value === null || value === '') return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const getBoolean = (key: string, fallback = false): boolean => {
    const value = get(key)
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') {
      if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true
      if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false
    }
    return fallback
  }

  const runtimeAppName = computed(() => resolveSiteName('', config.public.appName))
  const siteName = computed(() => resolveSiteName(getString('site_name'), runtimeAppName.value))
  const siteTagline = computed(() => getString('site_tagline'))
  const siteDescription = computed(() => getString('site_description'))
  const siteLogo = computed(() => getString('site_logo'))
  const siteLogoWhite = computed(() => getString('site_logo_white'))
  const siteFavicon = computed(() => getString('site_favicon'))
  const currency = computed(() => getString('currency', 'VND'))

  // Contact details must come from the public settings endpoint. Do not show
  // a placeholder number when an administrator has not configured one yet.
  const sitePhone = computed(() => getString('contact_phone'))
  const siteHotline = computed(() => getString('contact_hotline', sitePhone.value))
  const siteEmail = computed(() => getString('contact_email'))
  const siteAddress = computed(() => getString('contact_address'))
  const warehouseAddresses = computed(() => getString('warehouse_addresses', siteAddress.value))
  const businessHours = computed(() => getString('business_hours'))
  const contactMap = computed(() => getString('contact_map'))

  const socialFacebook = computed(() => getString('social_facebook'))
  const socialYoutube = computed(() => getString('social_youtube'))
  const socialTiktok = computed(() => getString('social_tiktok'))
  const socialZalo = computed(() => getString('social_zalo'))
  const socialMessenger = computed(() => getString('social_messenger'))
  const socialInstagram = computed(() => getString('social_instagram'))

  const seoTitle = computed(() => getString('seo_title', siteName.value))
  const seoDescription = computed(() => getString('seo_description', siteDescription.value))
  const seoKeywords = computed(() => getString('seo_keywords'))
  const seoOgImage = computed(() => getString('seo_og_image', siteLogo.value))

  const heroAutoplay = computed(() => getBoolean('homepage_hero_autoplay', true))
  const heroInterval = computed(() => Math.max(1000, getNumber('homepage_hero_interval', 5000)))

  const paymentCodEnabled = computed(() => getBoolean('payment_cod_enabled', true))
  const shippingFreeThreshold = computed(() => Math.max(0, getNumber('shipping_free_threshold', 500000)))
  const shippingDefaultFee = computed(() => Math.max(0, getNumber('shipping_default_fee', 30000)))
  const shippingExpressFee = computed(() => Math.max(0, getNumber('shipping_express_fee', 50000)))

  const formatMoney = (amount: number): string => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency.value,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)

  return {
    settings,
    loaded,
    settingsError,
    fetchSettings,
    get,
    getString,
    getNumber,
    getBoolean,
    siteName,
    siteTagline,
    siteDescription,
    siteLogo,
    siteLogoWhite,
    siteFavicon,
    currency,
    sitePhone,
    siteHotline,
    siteEmail,
    siteAddress,
    warehouseAddresses,
    businessHours,
    contactMap,
    socialFacebook,
    socialYoutube,
    socialTiktok,
    socialZalo,
    socialMessenger,
    socialInstagram,
    seoTitle,
    seoDescription,
    seoKeywords,
    seoOgImage,
    heroAutoplay,
    heroInterval,
    paymentCodEnabled,
    shippingFreeThreshold,
    shippingDefaultFee,
    shippingExpressFee,
    formatMoney,
  }
}
