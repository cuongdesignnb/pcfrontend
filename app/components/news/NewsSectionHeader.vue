<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  icon?: 'featured' | 'latest' | 'tag'
  to?: string
  action?: string
}>(), {
  icon: 'featured',
  to: '/tin-tuc',
  action: 'Xem tất cả',
})
</script>

<template>
  <div class="news-section-header">
    <h2>
      <span class="news-section-icon" aria-hidden="true">
        <svg v-if="icon === 'featured'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke-width="1.7" />
          <path d="M8 7h8M8 11h8M8 15h5" stroke-width="1.7" stroke-linecap="round" />
        </svg>
        <svg v-else-if="icon === 'latest'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" stroke-width="1.7" />
          <path d="M12 7v5l3 2" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="m20 13-7 7-9-9V4h7l9 9Z" stroke-width="1.7" stroke-linejoin="round" />
          <circle cx="7.5" cy="7.5" r="1.2" stroke-width="1.5" />
        </svg>
      </span>
      {{ title }}
    </h2>
    <NuxtLink v-if="action" :to="to" class="news-section-action">
      {{ action }}
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="m9 5 7 7-7 7" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </NuxtLink>
  </div>
</template>
