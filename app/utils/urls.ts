/**
 * Build URL for a product: /{category-slug}/{product-slug}
 */
export function productUrl(product: { slug: string; category?: { slug: string } | null; seo?: { canonical_path?: string | null } }): string | null {
  if (product.seo?.canonical_path?.startsWith('/') && !product.seo.canonical_path.startsWith('//')) {
    return product.seo.canonical_path
  }
  if (!product.category?.slug || !product.slug) return null
  return '/' + product.category.slug + '/' + product.slug
}

/**
 * Build URL for a category: /{category-slug}
 */
export function categoryUrl(category: { slug: string; canonical_path?: string | null }): string {
  if (category.canonical_path?.startsWith('/') && !category.canonical_path.startsWith('//')) {
    return category.canonical_path
  }
  return '/' + category.slug
}

/**
 * Normalize CMS/menu URLs to the current storefront route map.
 *
 * Legacy product detail URLs are intentionally preserved: a product's
 * canonical URL requires its real category and cannot be inferred from the
 * old one-segment /products/{slug} shape.
 */
export function storefrontPath(pathOrUrl: string | null | undefined): string {
  const value = pathOrUrl?.trim()
  if (!value || value === '#') return '/'
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value)) return value
  if (!value.startsWith('/')) return value

  const suffixIndex = value.search(/[?#]/)
  const pathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : value.slice(suffixIndex)
  const normalizedPath = pathname.replace(/\/{2,}/g, '/')

  const exactAliases: Record<string, string> = {
    '/products': '/san-pham',
    '/products/': '/san-pham',
    '/categories': '/danh-muc',
    '/categories/': '/danh-muc',
    '/configurator': '/cau-hinh',
    '/blog': '/tin-tuc',
    '/about': '/gioi-thieu',
    '/contact': '/lien-he',
    '/warranty': '/bao-hanh',
    '/shipping': '/van-chuyen',
    '/auth/login': '/dang-nhap',
    '/auth/register': '/dang-ky',
    '/auth/password/reset': '/quen-mat-khau',
    '/tim-kiem': '/san-pham',
    '/search': '/san-pham',
  }
  if (exactAliases[normalizedPath]) return exactAliases[normalizedPath] + suffix

  if (normalizedPath.startsWith('/categories/')) {
    const categorySlug = normalizedPath.slice('/categories/'.length).replace(/^\/+|\/+$/g, '')
    if (categorySlug && !categorySlug.includes('/')) return '/' + categorySlug + suffix
  }

  return value
}
