export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'noindex,nofollow' | 'index,nofollow'

export interface SeoDocumentInput {
  title: string
  description?: string | null
  path?: string | null
  robots?: RobotsDirective
  /** Canonical set in admin (absolute https URL); wins over the one built from `path`. */
  canonicalUrl?: string | null
  image?: string | null
  type?: 'website' | 'article' | 'product'
}

export interface TrustedRuntimeConfig {
  public: {
    siteUrl?: string
  }
}
