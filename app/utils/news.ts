import type { NewsArticle, NewsCategory } from '~/types/news'

export type NewsBadgeTone = 'blue' | 'red' | 'orange' | 'coral' | 'purple' | 'violet' | 'cyan'

export function newsBadgeTone(slug: string | null | undefined): NewsBadgeTone {
  switch (slug) {
    case 'review-san-pham':
      return 'red'
    case 'huong-dan':
    case 'khuyen-mai':
      return 'orange'
    case 'huong-dan-build-pc':
      return 'coral'
    case 'gaming-gear':
      return 'purple'
    case 'gaming':
      return 'violet'
    case 'tips-tricks':
    case 'meo-toi-uu-game':
      return 'cyan'
    default:
      return 'blue'
  }
}

export function formatNewsDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatViewCount(value: number): string {
  const count = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
  let formatted = String(count)

  if (count >= 1_000_000) {
    formatted = `${trimDecimal(count / 1_000_000)}M`
  } else if (count >= 1_000) {
    formatted = `${trimDecimal(count / 1_000)}K`
  }

  return `${formatted} lượt xem`
}

export function newsArticleUrl(article: Pick<NewsArticle, 'slug'> & { public_url?: string | null }): string {
  return article.public_url || (article.slug ? `/tin-tuc/${encodeURIComponent(article.slug)}` : '/tin-tuc')
}

export function newsCategoryUrl(category: Pick<NewsCategory, 'slug' | 'canonical_path'>): string {
  return category.canonical_path || (category.slug ? `/tin-tuc/chuyen-muc/${encodeURIComponent(category.slug)}` : '/tin-tuc')
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}
