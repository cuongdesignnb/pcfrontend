<script setup lang="ts">
definePageMeta({ middleware: 'auth', ssr: false })

const { siteName } = useSettings()

useSeoMeta({ title: () => `Hồ sơ tài khoản - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Hồ sơ tài khoản</h1><p>Cập nhật thông tin liên hệ và bảo mật tài khoản của bạn.</p></div></div>
    <AccountProfileForm />
    <AccountPasswordForm />
  </AccountShell>
</template>
