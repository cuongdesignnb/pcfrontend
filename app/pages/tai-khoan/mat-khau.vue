<script setup lang="ts">
definePageMeta({ middleware: 'auth', ssr: false })

const { siteName } = useSettings()

useSeoMeta({ title: () => `Đổi mật khẩu - ${siteName.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <AccountShell>
    <div class="account-subpage-heading"><div><h1>Đổi mật khẩu</h1><p>Bảo vệ tài khoản bằng một mật khẩu riêng và đủ mạnh.</p></div></div>
    <AccountPasswordForm />
  </AccountShell>
</template>
