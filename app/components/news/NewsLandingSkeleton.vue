<template>
  <div class="news-loading-skeleton" aria-label="Đang tải nội dung tin tức" aria-live="polite">
    <div class="news-skeleton-hero">
      <div class="news-skeleton-hero-main" />
      <div class="news-skeleton-hero-side"><div /><div /></div>
    </div>
    <div class="news-skeleton-tabs"><i v-for="item in 7" :key="item" /></div>
    <div class="news-skeleton-content">
      <div class="news-skeleton-main">
        <div class="news-skeleton-heading" />
        <div class="news-skeleton-featured"><div v-for="item in 3" :key="item" /></div>
        <div class="news-skeleton-heading" />
        <div class="news-skeleton-latest"><div v-for="item in 8" :key="item" /></div>
      </div>
      <div class="news-skeleton-sidebar"><div v-for="item in 6" :key="item" /></div>
    </div>
  </div>
</template>
