export const TEST_ORIGIN = 'https://storefront.example.test'

const category = {
  id: 10,
  name: 'Linh kiện fixture',
  slug: 'linh-kien',
  canonical_path: '/linh-kien',
}

const brand = {
  id: 20,
  name: 'Fixture Brand',
  slug: 'fixture-brand',
  logo: null,
}

const image = (id, url, alt, sortOrder = 0, isPrimary = sortOrder === 0) => ({
  id,
  url,
  alt,
  width: 640,
  height: 640,
  sort_order: sortOrder,
  is_primary: isPrimary,
})

const card = (id, name, slug, imageUrl, price) => ({
  id,
  name,
  slug,
  public_url: '/linh-kien/' + slug,
  seo: { canonical_path: '/linh-kien/' + slug, canonical_url: TEST_ORIGIN + '/linh-kien/' + slug, robots: 'index,follow' },
  sku: 'FIX-' + id,
  short_description: name + ' short description',
  brand,
  category,
  images: [image(id * 10, imageUrl, name)],
  pricing: { price, sale_price: null, display_price: price },
  inventory: { purchasable: true, availability_label: 'Còn hàng' },
  rating: { average: 4.8, count: 12 },
  sold_count: 42,
  warranty_months: 12,
  is_featured: true,
  has_variants: false,
})

export const productCardA = card(1001, 'Fixture Product A', 'fixture-a', '/seo-fixtures/product-a.svg', 1299000)
export const productCardB = card(1002, 'Fixture Product B', 'fixture-b', '/seo-fixtures/product-b.svg', 1499000)

const detail = (productCard, images) => ({
  ...productCard,
  component_type: null,
  is_featured: true,
  pricing: {
    ...productCard.pricing,
    discount_percent: 0,
    saving: 0,
  },
  inventory: { quantity: 10, purchasable: true, availability_label: 'Còn hàng' },
  rating: { average: 4.8, count: 12, breakdown: { '5': 10, '4': 2, '3': 0, '2': 0, '1': 0 } },
  questions_count: 0,
  images,
  variants: [],
  highlights: [{ id: 1, title: 'Fixture highlight', icon: null }],
  detail_blocks: [],
  specifications: [{ key: 'fixture', label: 'Nguồn test', value: 'Isolated fixture', unit: null }],
  short_description: productCard.name + ' short description',
  description: productCard.name + ' description from the isolated SEO fixture.',
  seo: {
    title: productCard.name + ' | Fixture Store',
    description: productCard.name + ' SEO description from the isolated fixture.',
    canonical_path: '/linh-kien/' + productCard.slug,
    canonical_url: TEST_ORIGIN + '/linh-kien/' + productCard.slug,
    robots: 'index,follow',
  },
})

export const productDetails = {
  'fixture-a': detail(productCardA, [image(10011, '/seo-fixtures/product-a.svg', 'Fixture Product A image')]),
  'fixture-b': detail(productCardB, [
    image(10021, 'javascript:alert(1)', 'Unsafe primary'),
    image(10022, '/seo-fixtures/product-b.svg', 'Fixture Product B image', 1, false),
  ]),
  'fixture-empty': detail(card(1003, 'Fixture Product Empty', 'fixture-empty', '/seo-fixtures/product-a.svg', 999000), []),
  'fixture-broken': detail(card(1004, 'Fixture Product Broken', 'fixture-broken', '/seo-fixtures/missing.svg', 899000), [
    image(10041, '/seo-fixtures/missing.svg', 'Broken fixture image'),
  ]),
  // The backend media contract omits an unmirrored provider image before it
  // reaches the public product payload. The frontend must keep this empty.
  'fixture-kiot': detail(card(1005, 'Fixture Product Unmirrored', 'fixture-kiot', '/seo-fixtures/product-a.svg', 799000), []),
}

const settingBase = {
  site_tagline: 'Built artifact and isolated API',
  site_description: 'Fixture storefront used for SEO regression only.',
  site_logo: '/seo-fixtures/logo.svg',
  site_logo_white: '/seo-fixtures/logo.svg',
  site_favicon: '/seo-fixtures/logo.svg',
  contact_hotline: '1900 0000',
  social_facebook: 'https://facebook.com/fixture-store',
  social_youtube: 'https://youtube.com/@fixture-store',
  currency: 'VND',
  payment_cod_enabled: true,
}

export function settingsFor(scenario) {
  if (scenario === 'identity-invalid') return []
  if (scenario === 'identity-empty') {
    return { ...settingBase, site_name: '   ', seo_title: '   ', seo_description: '   ', site_logo: '', site_logo_white: '' }
  }
  if (scenario === 'identity-fallback') {
    return { ...settingBase, site_name: '   ', seo_title: '   ' }
  }
  if (scenario === 'identity-updated') {
    return {
      ...settingBase,
      site_name: 'Updated Fixture Store',
      seo_title: 'Updated Fixture Store',
      seo_description: 'Updated fixture settings after revalidation.',
    }
  }
  return { ...settingBase, site_name: 'Fixture PC Center', seo_title: 'Fixture PC Center', seo_description: 'Fixture PC Center homepage.' }
}

const menuItem = (id, title, url) => ({
  id,
  title,
  url,
  type: 'custom',
  icon: null,
  badge_text: null,
  badge_color: null,
  css_class: null,
  target: '_self',
  is_mega: false,
  mega_columns: 1,
  description: null,
  image: null,
  children: [],
})

export const headerMenu = {
  menu: { id: 1, name: 'Header fixture', slug: 'header-fixture' },
  items: [
    menuItem(1, 'Linh kiện', '/linh-kien'),
    menuItem(2, 'Tin tức', '/tin-tuc'),
    menuItem(3, 'PC Builder', '/cau-hinh'),
  ],
}

export const footerMenu = {
  menu: { id: 2, name: 'Footer fixture', slug: 'footer-fixture' },
  items: [
    { ...menuItem(11, 'Về Fixture Store', '/gioi-thieu'), children: [menuItem(12, 'Liên hệ', '/lien-he')] },
    { ...menuItem(13, 'Chính sách', '/van-chuyen'), children: [
      menuItem(14, 'Vận chuyển', '/van-chuyen'),
      menuItem(15, 'Chính sách fixture', '/chinh-sach-fixture'),
      menuItem(16, 'Điều khoản fixture', '/dieu-khoan-fixture'),
      menuItem(17, 'Danh mục fixture', '/linh-kien'),
    ] },
  ],
}

export const publicPages = {
  'chinh-sach-fixture': {
    id: 501, title: 'Chính sách fixture', slug: 'chinh-sach-fixture',
    body: '<p>Nội dung chính sách từ CMS.</p><h2>Điều kiện áp dụng</h2>'
      + '<table><tbody><tr><th>Điều kiện</th><td>' + 'Dữ liệu kiểm thử '.repeat(12) + '</td></tr></tbody></table>'
      + '<p><a href="tel:0123456789">Hotline fixture</a></p>',
    meta_title: 'Chính sách SEO fixture', meta_description: 'Mô tả chính sách fixture.',
    canonical_path: '/chinh-sach-fixture', updated_at: '2026-10-09T05:19:04Z',
  },
  'dieu-khoan-fixture': {
    id: 502, title: 'Điều khoản fixture', slug: 'dieu-khoan-fixture',
    body: '<p>Điều khoản khác không được giữ nội dung trang trước.</p>',
    meta_title: '   ', meta_description: null,
    canonical_path: '/dieu-khoan-fixture', updated_at: null,
  },
}

export const categoryListing = {
  category: { ...category, parent_id: null, description: null, image: null, icon: null, meta_title: 'Linh kiện SEO fixture', meta_description: 'Danh mục fixture', children: [] },
  promo_banner: null,
  products: { data: [productCardA, productCardB], current_page: 1, last_page: 1, per_page: 24, total: 2 },
  recommendations: [],
  filters: { brands: [], price_range: { min: 0, max: 1500000 }, price_presets: [], groups: [], specs: [] },
}

const hero = (id, title, imageUrl) => ({
  id,
  title,
  description: 'Fixture banner description',
  badge: 'FIXTURE',
  image: imageUrl,
  link: null,
  position: 'home_hero',
  sort_order: id,
  metadata: { text_in_image: 'false' },
})

export function homepageFor(scenario) {
  const noBanner = scenario === 'identity-no-banner'
  return {
    hero_banners: noBanner ? [] : [
      hero(1, 'Fixture hero title', '/seo-fixtures/hero.svg'),
      hero(2, 'Second Fixture Hero', '/seo-fixtures/hero-two.svg'),
    ],
    sidebar_banners: [],
    category_sidebar: [{ id: 10, name: category.name, slug: category.slug, canonical_path: category.canonical_path, image: null, icon: null }],
    featured_categories: [],
    category_sections: [],
    flash_sale: { enabled: false, ends_at: null, products: [] },
    best_sellers: { laptop: [productCardA, productCardB], pc_gaming: [], components: [] },
    pc_builder_banner: null,
    combo_banners: [],
    setup_banners: [],
    featured_accessories: [],
    posts: [],
    testimonials: [],
  }
}

export function productRelations(slug, type) {
  if (slug === 'fixture-a' && type === 'related') return [productCardB]
  return []
}

export const emptyCart = {
  id: 0,
  cart: { id: 0, item_count: 0, quantity: 0, selected_quantity: 0 },
  items: [],
  summary: { item_count: 0, selected_item_count: 0, original_subtotal: 0, payable_before_shipping: 0, line_count: 0, selected_line_count: 0, quantity: 0, subtotal: 0, product_discount: 0, coupon_discount: 0, shipping_fee: 0, total: 0, shipping: { default_fee: 0, free_threshold: 0, amount_remaining_for_free_shipping: 0, eligible_for_free_shipping: false, estimated_fee: 0, free_shipping_remaining: 0, is_free: false } },
  accessories: [],
  recommendations: [],
  benefits: [],
  payment_methods: [],
  support: { hotline: '1900 0000', hours: '' },
  total: 0,
  count: 0,
  selected_count: 0,
  coupon: null,
}
