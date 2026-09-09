<script setup lang="ts">
definePageMeta({ middleware: 'auth', ssr: false })

await navigateTo('/tai-khoan/ho-so', { replace: true })
</script>

<template><span /></template>
