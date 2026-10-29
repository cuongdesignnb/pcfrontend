import type { HomepageResponse } from '~/types/homepage'

const emptyHomepage = (): HomepageResponse => ({
  hero_banners: [],
  sidebar_banners: [],
  category_sidebar: [],
  category_sections: [],
  flash_sale: { enabled: false, ends_at: null, products: [] },
  product_tabs: [],
  store_activities: [],
  posts: [],
  testimonials: [],
})

export const useHomepage = () => {
  const config = useRuntimeConfig()

  return useFetch<HomepageResponse>(`${config.public.apiBase}/homepage`, {
    default: emptyHomepage,
    key: 'homepage-reference-payload',
  })
}
