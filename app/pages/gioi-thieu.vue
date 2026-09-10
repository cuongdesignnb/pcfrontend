<script setup lang="ts">
const { siteName, siteAddress, siteHotline, siteEmail, businessHours } = useSettings()

useSeoDocument(() => ({
  title: `Giới thiệu - ${siteName.value}`,
  description: `Tìm hiểu về ${siteName.value} - chuyên cung cấp PC, Laptop và linh kiện máy tính chính hãng.`,
  path: '/gioi-thieu',
}))
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Giới thiệu về {{ siteName }}</h1>

    <div class="prose prose-lg max-w-none text-gray-700 space-y-6">
      <p>
        <strong>{{ siteName }}</strong> là hệ thống bán lẻ PC, Laptop và linh kiện máy tính hàng đầu,
        chuyên cung cấp các sản phẩm công nghệ chính hãng với giá cạnh tranh nhất thị trường.
      </p>

      <h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">Tầm nhìn & Sứ mệnh</h2>
      <p>
        Chúng tôi mong muốn trở thành đối tác công nghệ đáng tin cậy nhất cho mọi game thủ,
        nhà sáng tạo nội dung và doanh nghiệp tại Việt Nam. Với đội ngũ kỹ thuật viên giàu
        kinh nghiệm, chúng tôi cam kết tư vấn và hỗ trợ khách hàng lựa chọn cấu hình phù hợp nhất.
      </p>

      <h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">Tại sao chọn {{ siteName }}?</h2>
      <ul class="list-disc pl-6 space-y-2">
        <li>Hàng chính hãng 100%, bảo hành đầy đủ theo nhà sản xuất</li>
        <li>Đội ngũ kỹ thuật viên chuyên nghiệp, tư vấn nhiệt tình</li>
        <li>Công cụ build PC thông minh — kiểm tra tương thích tự động</li>
        <li>Giao hàng nhanh toàn quốc, miễn phí nội thành HCM & HN</li>
        <li>Thanh toán linh hoạt: QR Pay, chuyển khoản, COD</li>
        <li>Hỗ trợ kỹ thuật 24/7</li>
      </ul>

      <h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">Thông tin liên hệ</h2>
      <div class="bg-gray-50 rounded-xl p-6 space-y-2">
        <p v-if="siteAddress"><strong>Địa chỉ:</strong> {{ siteAddress }}</p>
        <p v-if="siteHotline"><strong>Hotline:</strong> {{ siteHotline }}</p>
        <p v-if="siteEmail"><strong>Email:</strong> {{ siteEmail }}</p>
        <p v-if="businessHours"><strong>Giờ làm việc:</strong> {{ businessHours }}</p>
      </div>
    </div>
  </div>
</template>
