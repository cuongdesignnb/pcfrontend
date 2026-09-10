export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'noindex,nofollow'

export interface SeoDocumentInput {
  title: string
  description?: string | null
  path?: string | null
  robots?: RobotsDirective
  image?: string | null
  type?: 'website' | 'article' | 'product'
}

export interface TrustedRuntimeConfig {
  public: {
    siteUrl?: string
  }
}
