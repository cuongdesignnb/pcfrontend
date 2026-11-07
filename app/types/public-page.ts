export interface PublicPage {
  id: number
  title: string
  slug: string
  body: string
  meta_title: string | null
  meta_description: string | null
  canonical_path: string
  updated_at: string | null
  /** JSON-LD objects typed for this page in admin (LocalBusiness, FAQPage…). */
  schema: Record<string, unknown>[]
}
