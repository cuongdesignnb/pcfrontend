/**
 * Load GA4, Google Tag Manager and the Facebook Pixel from the IDs saved in
 * the admin (SEO tab). IDs are validated against their documented formats
 * before they are written into a script, so a malformed or malicious value
 * never reaches the page.
 */
const GA4_ID = /^G-[A-Z0-9]{4,20}$/
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/
const PIXEL_ID = /^\d{6,20}$/

export const trackingId = (value: string, pattern: RegExp): string => {
  const id = value.trim().toUpperCase()
  return pattern.test(id) ? id : ''
}

export const useSiteTracking = () => {
  const { getString } = useSettings()
  const ga4 = computed(() => trackingId(getString('google_analytics_id'), GA4_ID))
  const gtm = computed(() => trackingId(getString('google_tag_manager_id'), GTM_ID))
  const pixel = computed(() => trackingId(getString('facebook_pixel_id'), PIXEL_ID))

  useHead(() => {
    const script: { key: string, src?: string, async?: boolean, innerHTML?: string }[] = []
    const noscript: { key: string, tagPosition: 'bodyOpen', innerHTML: string }[] = []

    if (ga4.value) {
      script.push({ key: 'ga4-loader', src: `https://www.googletagmanager.com/gtag/js?id=${ga4.value}`, async: true })
      script.push({
        key: 'ga4-config',
        innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4.value}');`,
      })
    }

    if (gtm.value) {
      script.push({
        key: 'gtm-loader',
        innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm.value}');`,
      })
      noscript.push({
        key: 'gtm-noscript',
        tagPosition: 'bodyOpen',
        innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtm.value}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      })
    }

    if (pixel.value) {
      script.push({
        key: 'fb-pixel',
        innerHTML: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel.value}');fbq('track','PageView');`,
      })
    }

    return { script, noscript }
  })
}
