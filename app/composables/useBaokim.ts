/**
 * Loader for Bảo Kim's BKPlus script (https://public-cdn.baokim.vn/js-server/baokim.min.js).
 *
 * The script keeps its state in global `let` bindings (initialProductData,
 * dataObserver, token, productConfigBk…) and exposes its entry points as
 * global functions (getConfigMerchant, getData). Those bindings are not on
 * `window`, but code compiled with `new Function` runs in the global scope
 * and can see them, which is how the state is reset between product pages.
 * Every call is guarded: if Bảo Kim changes its script the button simply
 * does not show, the page keeps working.
 */
export interface BaokimLine {
  name: string
  /** Unit price in đồng (what one item costs, warranty included). */
  price: number
  image: string | null
  quantity: number
}

const SCRIPT_SRC = 'https://public-cdn.baokim.vn/js-server/baokim.min.js'

let scriptPromise: Promise<boolean> | null = null

const loadScript = (): Promise<boolean> => {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.dataset.baokim = '1'
    script.onload = () => resolve(true)
    script.onerror = () => {
      script.remove()
      scriptPromise = null
      resolve(false)
    }
    document.body.appendChild(script)
  })
  return scriptPromise
}

const runInGlobalScope = (code: string): void => {
  try {
    new Function(code)()
  } catch (error) {
    console.warn('[baokim]', error)
  }
}

const setVariantId = (variantId: number | null) => {
  // Bảo Kim reads the variant from a global `variant_id_pro` when it exists.
  const target = window as unknown as Record<string, unknown>
  if (variantId) target.variant_id_pro = variantId
  else delete target.variant_id_pro
}

// Clear what the previous product page left behind, then start again.
const RESTART = `
  if (typeof getConfigMerchant !== 'function') return;
  if (typeof dataObserver !== 'undefined' && dataObserver) { dataObserver.disconnect(); dataObserver = undefined; }
  if (typeof token !== 'undefined') token = null;
  if (typeof initialProductData !== 'undefined') initialProductData = { productNames: [], productPrices: [], productQuantities: [], productImages: [], platformProductId: null, platformVariantId: null };
  if (typeof productConfigBk !== 'undefined') productConfigBk = {};
  getConfigMerchant();
`

// Re-read the lines after the customer changes variant, warranty or quantity.
const REFRESH = `
  if (typeof getData !== 'function' || typeof productConfigBk === 'undefined' || !productConfigBk || !productConfigBk.nameClass) return;
  if (typeof configBtn === 'undefined' || !configBtn) return;
  token = null;
  getData();
`

export const useBaokim = () => {
  const { getBoolean } = useSettings()
  const enabled = computed(() => getBoolean('baokim_button_enabled'))

  const mount = async (variantId: number | null) => {
    if (!import.meta.client) return
    setVariantId(variantId)
    const firstLoad = !scriptPromise
    const loaded = await loadScript()
    if (!loaded) return
    // A script added while the document is still loading starts itself on
    // DOMContentLoaded; otherwise (the usual case) it has to be started here.
    if (firstLoad && document.readyState === 'loading') return
    // getConfigMerchant uses a synchronous request; let the page paint first.
    window.setTimeout(() => runInGlobalScope(RESTART), 0)
  }

  const refresh = (variantId: number | null) => {
    if (!import.meta.client || !scriptPromise) return
    setVariantId(variantId)
    runInGlobalScope(REFRESH)
  }

  const unmount = () => {
    if (!import.meta.client) return
    setVariantId(null)
    const modal = document.getElementById('bk-modal-b2b')
    if (modal && modal.style.display !== 'none') {
      modal.style.display = 'none'
      document.body.style.overflow = ''
    }
  }

  return { enabled, mount, refresh, unmount }
}
