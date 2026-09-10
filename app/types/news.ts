export interface NewsArticleCategory {
  id: number
  name: string
  slug: string
  canonical_path?: string | null
  canonical_url?: string | null
}

export interface NewsArticleAuthor {
  name: string
}

export interface NewsArticle {
  id: number
  title: string
  slug: string
  public_url?: string | null
  excerpt: string | null
  featured_image: string | null
  published_at: string | null
  view_count: number
  is_featured: boolean
  category: NewsArticleCategory | null
  author: NewsArticleAuthor | null
}

export interface NewsCategory {
  id: number
  name: string
  slug: string
  posts_count: number
  description?: string | null
  canonical_path?: string | null
  canonical_url?: string | null
}

export interface NewsTopic {
  id: number
  name: string
  slug: string
  posts_count: number
  image: string | null
  canonical_path?: string | null
  canonical_url?: string | null
}

export interface NewsBuilderBanner {
  id: number
  title: string | null
  description: string | null
  badge: string | null
  image: string | null
  link: string | null
  metadata: Record<string, string | number | boolean | null> | null
}

export interface NewsHomeResponse {
  hero: NewsArticle[]
  featured: NewsArticle[]
  latest: NewsArticle[]
  trending: NewsArticle[]
  categories: NewsCategory[]
  topics: NewsTopic[]
  pc_builder: NewsBuilderBanner | null
}
