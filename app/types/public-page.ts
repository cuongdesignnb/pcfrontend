export interface PublicPage {
  id: number
  title: string
  slug: string
  body: string
  meta_title: string | null
  meta_description: string | null
  canonical_path: string
  /** Admin overrides: canonical link target and robots directive. */
  canonical_url?: string | null
  robots?: string | null
  updated_at: string | null
  /** JSON-LD objects typed for this page in admin (LocalBusiness, FAQPage…). */
  schema: Record<string, unknown>[]
}
