<script setup lang="ts">
const { data: homepage } = useHomepage()
const { siteName, siteLogo, siteLogoWhite, siteTagline } = useSettings()

const promoImage = computed(() => homepage.value?.hero_banners?.find(banner => banner.image)?.image ?? '')
const promoAlt = computed(() => homepage.value?.hero_banners?.find(banner => banner.image)?.title || `${siteName.value} - Build Your Dream`)
const benefits = [
  { icon: 'receipt', title: 'Theo dõi đơn hàng', text: 'Cập nhật trạng thái đơn hàng mọi lúc, mọi nơi' },
  { icon: 'settings', title: 'Lưu cấu hình PC Builder', text: 'Lưu và quản lý các cấu hình yêu thích của bạn' },
  { icon: 'heart', title: 'Danh sách yêu thích', text: 'Dễ dàng lưu sản phẩm quan tâm để quay lại sau' },
  { icon: 'gift', title: 'Ưu đãi dành riêng', text: 'Nhận khuyến mãi và mã giảm giá độc quyền' },
]
</script>

<template>
  <aside class="auth-promo-panel">
    <div class="auth-promo-orb auth-promo-orb--one" aria-hidden="true" />
    <div class="auth-promo-orb auth-promo-orb--two" aria-hidden="true" />
    <div class="auth-promo-content">
      <NuxtLink to="/" class="auth-promo-brand">
        <template v-if="siteLogoWhite || siteLogo">
          <img :src="siteLogoWhite || siteLogo" :alt="siteName">
        </template>
        <template v-else>
          <span class="auth-promo-mark">PC</span>
          <span><strong>{{ siteName }}</strong><small>{{ siteTagline || 'Build Your Dream' }}</small></span>
        </template>
      </NuxtLink>

      <div class="auth-promo-copy">
        <h2>Đăng nhập để khám phá<br>thế giới công nghệ tại {{ siteName }}</h2>
        <p>Quản lý đơn hàng, lưu cấu hình yêu thích và nhận nhiều ưu đãi dành riêng cho thành viên.</p>
      </div>

      <div v-if="promoImage" class="auth-promo-visual">
        <img :src="promoImage" :alt="promoAlt" loading="lazy">
      </div>
      <div v-else class="auth-promo-visual auth-promo-visual--fallback" aria-hidden="true">
        <div class="auth-promo-fallback-screen"><span>PC</span></div>
        <div class="auth-promo-fallback-tower"><i /><i /><i /></div>
      </div>

      <div class="auth-promo-benefits">
        <div v-for="benefit in benefits" :key="benefit.title" class="auth-promo-benefit">
          <span class="auth-promo-benefit-icon"><CartIcon :name="benefit.icon" size="22" /></span>
          <span><strong>{{ benefit.title }}</strong><small>{{ benefit.text }}</small></span>
        </div>
      </div>
    </div>
  </aside>
</template>
