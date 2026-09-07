<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: string
}>(), {
  size: '20',
})
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="1.7"
    aria-hidden="true"
  >
    <template v-if="props.name === 'truck'">
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
    </template>
    <template v-else-if="props.name === 'shield'">
      <path d="M12 3 20 6v5c0 5-3.2 8-8 10-4.8-2-8-5-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </template>
    <template v-else-if="props.name === 'coin'">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v10M15 9.5c-.7-.7-1.7-1-3-1-1.6 0-2.7.7-2.7 1.8 0 2.8 5.7 1 5.7 3.8 0 1.2-1.1 2-3 2-1.3 0-2.4-.4-3.1-1.1" />
    </template>
    <template v-else-if="props.name === 'headset'">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13h3v5H5a1 1 0 0 1-1-1v-4ZM20 13h-3v5h2a1 1 0 0 0 1-1v-4ZM17 18c0 1.2-1.8 2-4 2" />
    </template>
    <template v-else-if="props.name === 'receipt'">
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" /><path d="M8 8h8M8 12h8M8 16h5" />
    </template>
    <template v-else-if="props.name === 'cart'">
      <path d="M3 4h2l1.4 10.2a2 2 0 0 0 2 1.8h8.8a2 2 0 0 0 1.9-1.4L21 7H6" />
      <circle cx="9" cy="20" r="1.2" /><circle cx="18" cy="20" r="1.2" />
    </template>
    <template v-else-if="props.name === 'user'">
      <circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" />
    </template>
    <template v-else-if="props.name === 'location'">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.4" />
    </template>
    <template v-else-if="props.name === 'card'">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h4" />
    </template>
    <template v-else-if="props.name === 'file'">
      <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h4M9 13h6M9 17h6" />
    </template>
    <template v-else-if="props.name === 'package'">
      <path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" />
    </template>
    <template v-else-if="props.name === 'qr'">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2h4z" />
    </template>
    <template v-else-if="props.name === 'cash'">
      <rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 9h.01M18 15h.01" />
    </template>
    <template v-else-if="props.name === 'info'">
      <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />
    </template>
    <template v-else-if="props.name === 'trash'">
      <path d="M5 7h14M10 11v6M14 11v6M9 7V4h6v3M7 7l1 14h8l1-14" />
    </template>
    <template v-else-if="props.name === 'heart'">
      <path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
    </template>
    <template v-else-if="props.name === 'lock'">
      <rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </template>
    <template v-else-if="props.name === 'mail'">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" />
    </template>
    <template v-else-if="props.name === 'eye'">
      <path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" />
    </template>
    <template v-else-if="props.name === 'eye-off'">
      <path d="m3 3 18 18M10.6 6.9A10.8 10.8 0 0 1 12 6.8c6.3 0 9.5 5.2 9.5 5.2a17 17 0 0 1-3.1 3.4M6.4 6.7C3.7 8.2 2.5 12 2.5 12s3.2 5.2 9.5 5.2c.6 0 1.2-.1 1.7-.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </template>
    <template v-else-if="props.name === 'settings'">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.4h.9a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </template>
    <template v-else-if="props.name === 'badge'">
      <path d="m12 3 2.2 1.2 2.5-.1 1.2 2.2 2.1 1.3-.4 2.4.9 2.3-1.7 1.8-.3 2.5-2.5.5-2 1.5-2-1.5-2.5-.5-.3-2.5-1.7-1.8.9-2.3-.4-2.4 2.1-1.3 1.2-2.2 2.5.1L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" />
    </template>
    <template v-else-if="props.name === 'logout'">
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 16l4-4-4-4M18 12H8" />
    </template>
    <template v-else-if="props.name === 'phone'">
      <path d="M6.5 3.5h3l1.2 4-2 1.5a14 14 0 0 0 6.3 6.3l1.5-2 4 1.2v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
    </template>
    <template v-else-if="props.name === 'gift'">
      <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7H8.5a2.5 2.5 0 1 1 2.1-3.9C11.7 4.1 12 7 12 7ZM12 7h3.5a2.5 2.5 0 1 0-2.1-3.9C12.3 4.1 12 7 12 7Z" />
    </template>
    <template v-else-if="props.name === 'refresh'">
      <path d="M20 11a8 8 0 0 0-14.8-3L3 10M4 4v6h6M4 13a8 8 0 0 0 14.8 3L21 14m-1 6v-6h-6" />
    </template>
    <template v-else-if="props.name === 'ticket'">
      <path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" /><path d="M12 8v2M12 14v2" />
    </template>
    <template v-else-if="props.name === 'tag'">
      <path d="m4 5 7-2 9 9-7 7-9-9V5Z" /><circle cx="8" cy="8" r="1" />
    </template>
    <template v-else-if="props.name === 'help'">
      <circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.8 1.9c-1 .7-1.6 1.2-1.6 2.5M12 17h.01" />
    </template>
    <template v-else-if="props.name === 'arrow-right'">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </template>
    <template v-else-if="props.name === 'arrow-left'">
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </template>
    <template v-else-if="props.name === 'check'">
      <path d="m5 12 4 4L19 6" />
    </template>
    <template v-else-if="props.name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="props.name === 'minus'">
      <path d="M5 12h14" />
    </template>
    <template v-else-if="props.name === 'close'">
      <path d="m6 6 12 12M18 6 6 18" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </template>
  </svg>
</template>
