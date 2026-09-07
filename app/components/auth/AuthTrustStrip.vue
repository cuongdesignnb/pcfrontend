<script setup lang="ts">
const items = [
  { icon: 'shield', title: 'Mua sắm an toàn', text: 'Bảo mật thông tin khách hàng' },
  { icon: 'truck', title: 'Giao hàng toàn quốc', text: 'Nhanh chóng, đúng hẹn' },
  { icon: 'headset', title: 'Hỗ trợ 24/7', text: 'Luôn sẵn sàng phục vụ' },
  { icon: 'badge', title: 'Thương hiệu uy tín', text: 'Hơn 100.000+ khách hàng tin chọn' },
]
</script>

<template>
  <div class="auth-trust-strip" aria-label="Cam kết dịch vụ">
    <div v-for="item in items" :key="item.title" class="auth-trust-item">
      <span class="auth-trust-icon"><CartIcon :name="item.icon" size="26" /></span>
      <span><strong>{{ item.title }}</strong><small>{{ item.text }}</small></span>
    </div>
  </div>
</template>
