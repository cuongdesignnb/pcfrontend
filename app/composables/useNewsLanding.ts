import type { NewsHomeResponse } from '~/types/news'

const emptyNewsHome = (): NewsHomeResponse => ({
  hero: [],
  featured: [],
  latest: [],
  trending: [],
  categories: [],
  topics: [],
  pc_builder: null,
})

export const useNewsLanding = async () => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const category = computed(() => {
    const value = route.query.category
    return typeof value === 'string' && value.trim() !== '' ? value : undefined
  })

  const response = await useFetch<NewsHomeResponse>(`${config.public.apiBase}/blog/home`, {
    key: computed(() => `news-landing-${category.value || 'all'}`),
    params: computed(() => (category.value ? { category: category.value } : {})),
    watch: [category],
    default: emptyNewsHome,
  })

  return {
    ...response,
    category,
  }
}
