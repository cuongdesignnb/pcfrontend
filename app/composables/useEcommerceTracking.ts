import type { ProductDetail } from '~/types/product-detail'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export interface PurchasedOrder {
  id: number | string
  order_number?: string
  total: number | string
  items?: Array<{
    product_id: number
    catalog_content_id?: string | null
    product_name: string
    quantity: number
    price: number | string
  }>
}

/**
 * GA4 and Facebook Pixel e-commerce events. Pixel content_ids are the ids of
 * the catalog feed rows (kiot:123, kiot:123:variant:4) so Facebook can match
 * events to the products in the catalog for retargeting ads.
 */
export const useEcommerceTracking = () => {
  const { currency } = useSettings()
  const currencyCode = () => currency.value.toUpperCase()

  const contentId = (product: ProductDetail, variantId?: number | null) => {
    const id = product.catalog_content_id || String(product.id)
    return variantId && product.catalog_content_id ? `${id}:variant:${variantId}` : id
  }

  const track = (
    event: 'view_item' | 'add_to_cart' | 'begin_checkout',
    product: ProductDetail,
    quantity = 1,
    options: { variantId?: number | null, unitPrice?: number } = {},
  ) => {
    if (!import.meta.client) return
    const unitPrice = options.unitPrice ?? product.pricing.display_price
    const id = contentId(product, options.variantId)
    window.gtag?.('event', event, {
      currency: currencyCode(),
      value: unitPrice * quantity,
      items: [{
        item_id: id,
        item_name: product.name,
        item_brand: product.brand?.name,
        item_category: product.category?.name,
        price: unitPrice,
        quantity,
      }],
    })
    const facebookEvent = {
      view_item: 'ViewContent',
      add_to_cart: 'AddToCart',
      begin_checkout: 'InitiateCheckout',
    }[event]
    window.fbq?.('track', facebookEvent, {
      content_ids: [id],
      content_type: 'product',
      content_name: product.name,
      contents: [{ id, quantity }],
      value: unitPrice * quantity,
      currency: currencyCode(),
    })
  }

  /** Once per order, on the thank-you page. */
  const trackPurchase = (order: PurchasedOrder) => {
    if (!import.meta.client || !order?.id) return
    const key = `purchase_tracked_${order.id}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      // Storage blocked: the event may repeat on reload, which is acceptable.
    }
    const items = order.items ?? []
    const ids = items.map(item => item.catalog_content_id || String(item.product_id))
    const value = Number(order.total) || 0
    window.gtag?.('event', 'purchase', {
      transaction_id: order.order_number ?? String(order.id),
      currency: currencyCode(),
      value,
      items: items.map((item, index) => ({ item_id: ids[index], item_name: item.product_name, price: Number(item.price) || 0, quantity: item.quantity })),
    })
    window.fbq?.('track', 'Purchase', {
      content_ids: ids,
      content_type: 'product',
      contents: items.map((item, index) => ({ id: ids[index], quantity: item.quantity })),
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      value,
      currency: currencyCode(),
    }, { eventID: `order-${order.order_number ?? order.id}` })
  }

  /** "Lấy key ngay" click: the key comes from a partner page. */
  const trackInstantKeyClick = (product: ProductDetail, url: string) => {
    if (!import.meta.client) return
    window.gtag?.('event', 'click_affiliate', {
      item_id: contentId(product),
      item_name: product.name,
      item_category: product.category?.name,
      link_url: url,
    })
  }

  return { track, trackPurchase, trackInstantKeyClick }
}
