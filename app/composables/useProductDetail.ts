import type { MaybeRef } from 'vue'
import type { ProductDetailResponse } from '~/types/product-detail'

export const useProductDetail = (slug: MaybeRef<string>, category?: MaybeRef<string | undefined>) => {
  const config = useRuntimeConfig()
  const value = toValue(slug)
  const categoryValue = toValue(category)

  return useFetch<ProductDetailResponse>(() => `${config.public.apiBase}/products/${encodeURIComponent(toValue(slug))}`, {
    key: `product-detail:${categoryValue || ''}:${value}`,
    query: computed(() => categoryValue ? { category_path: categoryValue } : undefined),
  })
}
