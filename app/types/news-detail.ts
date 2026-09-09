import type { NewsArticle, NewsBuilderBanner } from '~/types/news'

export interface NewsDetailCategory {
  id: number
  name: string
  slug: string
}

export interface NewsDetailAuthor {
  id: number
  name: string
  avatar: string | null
}

export interface NewsTocItem {
  id: string
  level: 2 | 3 | 4
  title: string
}

export interface NewsDetailPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  body: string
  featured_image: string | null
  published_at: string | null
  updated_at: string | null
  view_count: number
  category: NewsDetailCategory | null
  author: NewsDetailAuthor | null
  seo: {
    title: string
    description: string | null
    image: string | null
  }
  toc: NewsTocItem[]
}

export interface NewsArticleDetailResponse {
  post: NewsDetailPost
  related: NewsArticle[]
  sidebar: {
    trending: NewsArticle[]
    reviews: NewsArticle[]
    pc_builder: NewsBuilderBanner | null
  }
}

export interface NewsViewResponse {
  tracked: boolean
  view_count: number
}
