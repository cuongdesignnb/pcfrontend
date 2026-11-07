export type ContactKind = 'click_call' | 'click_zalo' | 'click_messenger'

/** Which contact event a link is, from its href (tel:, zalo.me, m.me / messenger). */
export function contactKind(href: string): ContactKind | null {
  const value = href.trim().toLowerCase()
  if (value.startsWith('tel:')) return 'click_call'
  if (/^(https?:)?\/\/(www\.)?zalo\.me\//.test(value) || value.startsWith('zalo:')) return 'click_zalo'
  if (/^(https?:)?\/\/(www\.)?(m\.me|messenger\.com)\//.test(value) || value.startsWith('fb-messenger:')) return 'click_messenger'
  return null
}

const NON_PRODUCT_ROOTS = new Set(['tin-tuc', 'tai-khoan', 'cau-hinh', 'don-hang'])

/** Where the link was tapped: a data-track-location mark, header, footer, product_page… */
export function clickLocation(link: Element, path: string): string {
  const marked = link.closest('[data-track-location]')?.getAttribute('data-track-location')
  if (marked) return marked
  if (link.closest('header')) return 'header'
  if (link.closest('footer')) return 'footer'
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 2 && !NON_PRODUCT_ROOTS.has(segments[0]!)) return 'product_page'
  return path === '/' ? 'homepage' : 'page'
}
