import { clickLocation, contactKind } from '~/utils/contactTracking'

/**
 * Contact clicks for GA4 and the Facebook Pixel loaded from Cài đặt → SEO: a
 * tap on a tel:, zalo.me or m.me / messenger link anywhere on the site sends
 * click_call / click_zalo / click_messenger to GA4 with click_location
 * (header, footer, product_page, floating…) and Contact to the Pixel.
 */
export default defineNuxtPlugin(() => {
  const route = useRoute()
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]')
    if (!link) return
    const href = link.getAttribute('href') || ''
    const kind = contactKind(href)
    if (!kind) return
    const location = clickLocation(link, route.path)
    const w = window as unknown as { gtag?: (...args: unknown[]) => void, fbq?: (...args: unknown[]) => void }
    w.gtag?.('event', kind, { click_location: location, page_path: route.path, link_url: href })
    w.fbq?.('track', 'Contact', { content_category: kind.replace('click_', ''), content_name: location })
  }, { capture: true, passive: true })
})
