import type { NewsArticleDetailResponse, NewsViewResponse } from '~/types/news-detail'

export const useNewsArticle = async (slug: string) => {
  const config = useRuntimeConfig()
  const encodedSlug = encodeURIComponent(slug)
  const response = await useFetch<NewsArticleDetailResponse>(
    `${config.public.apiBase}/blog/${encodedSlug}`,
    {
      key: `news-article-${slug}`,
      cache: 'no-store',
    },
  )

  const trackView = async () => {
    if (!import.meta.client || !response.data.value?.post) return

    try {
      const view = await $fetch<NewsViewResponse>(`${config.public.apiBase}/blog/${encodedSlug}/view`, {
        method: 'POST',
        cache: 'no-store',
      })
      if (response.data.value?.post && Number.isFinite(view.view_count)) {
        response.data.value.post.view_count = view.view_count
      }
    } catch {
      // View tracking is deliberately best-effort and must not block reading.
    }
  }

  return {
    ...response,
    trackView,
  }
}
