export type SocialNetwork = 'facebook' | 'youtube' | 'tiktok' | 'zalo' | 'messenger' | 'instagram'

/**
 * Turn the value configured in the admin into a safe telephone link.
 * Empty or malformed values stay empty so the storefront never renders a
 * made-up contact number.
 */
export const toTelHref = (value: string | null | undefined): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const phone = raw.replace(/[^\d+]/g, '')
  return /\d/.test(phone) ? `tel:${phone}` : ''
}

const directHttpUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) return value
  if (/^\/\//.test(value)) return `https:${value}`
  return ''
}

const cleanHandle = (value: string): string => value
  .trim()
  .replace(/^@/, '')
  .replace(/^\/+/, '')

/**
 * Social settings accept either a complete URL or a page/handle/ID. Only
 * http(s) links are returned; this prevents an accidental javascript: URL
 * from becoming a clickable storefront link.
 */
export const toSocialHref = (value: string | null | undefined, network: SocialNetwork): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const direct = directHttpUrl(raw)
  if (direct) return direct
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) return ''

  const withoutScheme = raw.replace(/^www\./i, '')
  const hosts: Record<SocialNetwork, RegExp> = {
    facebook: /^(?:facebook\.com|fb\.com)\//i,
    youtube: /^(?:youtube\.com|youtu\.be)\//i,
    tiktok: /^tiktok\.com\//i,
    zalo: /^zalo\.me\//i,
    messenger: /^(?:m\.me|messenger\.com)\//i,
    instagram: /^instagram\.com\//i,
  }
  if (hosts[network].test(withoutScheme)) return `https://${withoutScheme}`

  const handle = cleanHandle(raw)
  if (!handle) return ''

  switch (network) {
    case 'facebook': return `https://www.facebook.com/${handle}`
    case 'youtube': return `https://www.youtube.com/${raw.trim().startsWith('@') ? `@${handle}` : handle}`
    case 'tiktok': return `https://www.tiktok.com/@${handle}`
    case 'instagram': return `https://www.instagram.com/${handle}`
    case 'messenger': return `https://m.me/${encodeURIComponent(handle)}`
    case 'zalo': {
      const identifier = raw.replace(/[^\d]/g, '') || handle
      return identifier ? `https://zalo.me/${identifier}` : ''
    }
  }

  return ''
}
