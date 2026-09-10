const privateRoots = new Set([
  'dang-nhap', 'dang-ky', 'tai-khoan', 'gio-hang', 'thanh-toan', 'don-hang', 'yeu-thich',
  'cau-hinh', 'cart', 'checkout', 'account', 'orders', 'wishlist', 'configurator',
  'auth', 'admin', 'api', 'payment', 'payments', 'tim-kiem', 'search',
])

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/+$/, '') || '/'
  const firstSegment = path.split('/').filter(Boolean)[0] || ''

  const exactAliases: Record<string, string> = {
    '/products': '/san-pham',
    '/categories': '/danh-muc',
    '/configurator': '/cau-hinh',
    '/blog': '/tin-tuc',
    '/about': '/gioi-thieu',
    '/contact': '/lien-he',
    '/warranty': '/bao-hanh',
    '/shipping': '/van-chuyen',
    '/cart': '/gio-hang',
    '/checkout': '/thanh-toan',
    '/account': '/tai-khoan',
    '/orders': '/tai-khoan/don-hang',
    '/wishlist': '/yeu-thich',
    '/auth/login': '/dang-nhap',
    '/auth/register': '/dang-ky',
    '/auth/password/reset': '/quen-mat-khau',
    '/tim-kiem': '/san-pham',
    '/search': '/san-pham',
  }
  if (exactAliases[path]) {
    const query = { ...to.query }
    if ((path === '/tim-kiem' || path === '/search') && query.search === undefined && typeof query.q === 'string') {
      query.search = query.q
      delete query.q
    }
    if (query.page === '1') delete query.page
    return navigateTo({ path: exactAliases[path], query }, { redirectCode: 301 })
  }

  const isPublicListing = path === '/san-pham'
    || path === '/tin-tuc'
    || path.startsWith('/tin-tuc/')
    || (path.split('/').filter(Boolean).length === 1 && !privateRoots.has(firstSegment))
  if (isPublicListing && to.query.page === '1') {
    const query = { ...to.query }
    delete query.page
    return navigateTo({ path: to.path, query }, { redirectCode: 301 })
  }
})
