import type { Ref } from 'vue'
import { publicAbsoluteUrl } from '~/composables/useSeoDocument'
import { toSocialHref } from '~/utils/contactLinks'

/**
 * Turn a free-text range such as "8:00–20:00 hằng ngày" into the schema.org
 * openingHours form ("Mo-Su 08:00-20:00"). Text naming specific days is not
 * guessed at; the shop sets "Giờ mở cửa cho Google" for those cases.
 */
export const openingHoursFromText = (text: string): string => {
  const match = text.match(/(\d{1,2})[:h.](\d{2})\s*[-–—]\s*(\d{1,2})[:h.](\d{2})/i)
  if (!match) return ''
  const days = /th[ứu]\s*\d|ch[ủu]\s*nh[ậa]t|t\d\s*[-–]/i.test(text) && !/h[ằa]ng\s*ng[àa]y|m[ọo]i\s*ng[àa]y/i.test(text)
  if (days) return ''
  const pad = (value: string) => value.padStart(2, '0')
  return `Mo-Su ${pad(match[1]!)}:${match[2]}-${pad(match[3]!)}:${match[4]}`
}

const SCHEMA_OPENING_HOURS = /^(?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)* \d{2}:\d{2}-\d{2}:\d{2})$/

const httpsUrl = (value: string): string => /^https:\/\/[^\s"'<>]+$/i.test(value.trim()) ? value.trim() : ''

/**
 * The shop's Organization / LocalBusiness node for JSON-LD, built only from
 * values saved in the admin settings so every site using this storefront
 * describes its own store.
 */
export const useBusinessSchema = (origin: Ref<string | null>) => {
  const {
    getString,
    siteName,
    siteLogo,
    siteHotline,
    siteEmail,
    siteAddress,
    businessHours,
    socialFacebook,
    socialYoutube,
    socialTiktok,
    socialInstagram,
    socialMessenger,
    seoOgImage,
  } = useSettings()

  return computed<Record<string, unknown> | null>(() => {
    if (!origin.value || !siteName.value) return null
    const url = `${origin.value}/`
    const type = getString('business_schema_type', 'ComputerStore').trim()
    const logo = publicAbsoluteUrl(origin.value, siteLogo.value || seoOgImage.value)

    // sameAs must be profile URLs; the admin may store bare handles or a
    // Messenger page ID, so normalise them and fall back to the Facebook page
    // behind a numeric Messenger ID. Chat links (Zalo) are not profiles.
    const messengerId = socialMessenger.value.trim()
    const sameAs = [...new Set([
      toSocialHref(socialFacebook.value, 'facebook') || (/^\d+$/.test(messengerId) ? `https://www.facebook.com/${messengerId}` : ''),
      toSocialHref(socialYoutube.value, 'youtube'),
      toSocialHref(socialTiktok.value, 'tiktok'),
      toSocialHref(socialInstagram.value, 'instagram'),
    ].filter(Boolean))]

    const configuredHours = getString('business_opening_hours').trim()
    const openingHours = SCHEMA_OPENING_HOURS.test(configuredHours) ? configuredHours : openingHoursFromText(businessHours.value)
    const map = httpsUrl(getString('contact_maps_url')) || httpsUrl(getString('storefront_product_contact_footer_maps_url'))

    // A LocalBusiness needs a street address; until one is saved the shop is
    // described as a plain Organization.
    const isLocal = Boolean(siteAddress.value) && /^[A-Z][A-Za-z]+$/.test(type)
    const node: Record<string, unknown> = {
      '@type': isLocal ? type : 'Organization',
      '@id': `${url}#organization`,
      name: siteName.value,
      url,
    }
    if (logo) {
      node.logo = { '@type': 'ImageObject', url: logo }
      if (isLocal) node.image = logo
    }
    if (siteHotline.value) {
      node.telephone = siteHotline.value
      node.contactPoint = { '@type': 'ContactPoint', telephone: siteHotline.value, contactType: 'customer service', areaServed: 'VN', availableLanguage: 'vi' }
    }
    if (siteEmail.value) node.email = siteEmail.value
    if (siteAddress.value) node.address = { '@type': 'PostalAddress', streetAddress: siteAddress.value, addressCountry: 'VN' }
    if (isLocal && openingHours) node.openingHours = openingHours
    if (isLocal && map) node.hasMap = map
    if (sameAs.length) node.sameAs = sameAs
    return node
  })
}
