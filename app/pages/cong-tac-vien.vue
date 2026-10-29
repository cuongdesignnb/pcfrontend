<script setup lang="ts">
const { siteName } = useSettings()
const auth = useAuth()

const steps = [
  { title: 'Đăng ký tài khoản CTV', text: 'Điền số điện thoại và tài khoản ngân hàng. Cửa hàng duyệt và cấp mã riêng cho bạn, ví dụ CTV023.' },
  { title: 'Chia sẻ link sản phẩm', text: 'Ở mỗi trang sản phẩm, bấm "Lấy link" để copy hoặc chia sẻ lên Facebook, Zalo kèm mã của bạn.' },
  { title: 'Khách được giảm giá', text: 'Khách mua lần đầu qua link hoặc mã của bạn được giảm giá. Khách gắn với bạn cho mọi đơn sau, kể cả mua qua điện thoại hay tại cửa hàng.' },
  { title: 'Nhận hoa hồng về ví', text: 'Hoa hồng được duyệt sau khi khách nhận hàng. Bạn tự chọn 1–3 ngày rút tiền mỗi tháng.' },
]
const ctaTarget = computed(() => auth.isAuthenticated.value ? '/tai-khoan/cong-tac-vien' : '/dang-ky?redirect=/tai-khoan/cong-tac-vien')

useSeoDocument(() => ({
  title: `Cộng tác viên - ${siteName.value}`,
  description: `Trở thành cộng tác viên ${siteName.value}: chia sẻ link sản phẩm, khách được giảm giá, bạn nhận hoa hồng.`,
  path: '/cong-tac-vien',
  robots: 'index,follow',
}))
</script>

<template>
  <div class="product-directory-page">
    <div class="pc-container">
      <nav class="directory-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Trang chủ</NuxtLink><span aria-hidden="true">/</span><span>Cộng tác viên</span>
      </nav>
      <section class="ctv-hero">
        <span class="directory-kicker">{{ siteName }}</span>
        <h1>Chương trình Cộng tác viên</h1>
        <p>Giới thiệu khách mua laptop, linh kiện, phụ kiện và dịch vụ sửa chữa, nhận hoa hồng cho mọi đơn hàng của khách bạn giới thiệu.</p>
        <div class="ctv-hero-actions">
          <NuxtLink :to="ctaTarget" class="button button-primary">Đăng ký cộng tác viên</NuxtLink>
          <NuxtLink v-if="!auth.isAuthenticated.value" to="/dang-nhap?redirect=/tai-khoan/cong-tac-vien" class="ctv-login">Đã có tài khoản? Đăng nhập</NuxtLink>
        </div>
      </section>
      <ol class="ctv-steps">
        <li v-for="(step, index) in steps" :key="step.title">
          <span class="ctv-step-number">{{ index + 1 }}</span>
          <h2>{{ step.title }}</h2>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.ctv-hero { margin: 16px 0 24px; padding: 28px 24px; background: linear-gradient(135deg, #fff5e6, #fff); border: 1px solid #f6d9a6; border-radius: 12px; }
.ctv-hero h1 { margin: 6px 0 10px; color: #1e293b; font-size: 28px; font-weight: 800; }
.ctv-hero p { max-width: 640px; margin: 0; color: #475569; font-size: 15px; line-height: 1.6; }
.ctv-hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 18px; }
.ctv-login { color: #b45309; font-size: 14px; font-weight: 600; }
.ctv-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 0 0 32px; padding: 0; list-style: none; }
.ctv-steps li { padding: 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
.ctv-step-number { display: grid; width: 32px; height: 32px; place-items: center; color: #fff; background: #e08a00; border-radius: 50%; font-weight: 800; }
.ctv-steps h2 { margin: 12px 0 6px; color: #1e293b; font-size: 16px; font-weight: 700; }
.ctv-steps p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.55; }
@media (max-width: 900px) { .ctv-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .ctv-steps { grid-template-columns: 1fr; } .ctv-hero h1 { font-size: 22px; } }
</style>
