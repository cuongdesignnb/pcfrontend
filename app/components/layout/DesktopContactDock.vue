<script setup lang="ts">
import { toSocialHref, toTelHref } from '~/utils/contactLinks'

// Desktop counterpart of the mobile bottom bar: floating call / Zalo /
// Messenger buttons. Each button only appears once its setting is filled.
const { siteHotline, socialZalo, socialMessenger } = useSettings()

const telHref = computed(() => toTelHref(siteHotline.value))
const zaloHref = computed(() => toSocialHref(socialZalo.value, 'zalo'))
const messengerHref = computed(() => toSocialHref(socialMessenger.value, 'messenger'))
const visible = computed(() => Boolean(telHref.value || zaloHref.value || messengerHref.value))
</script>

<template>
  <aside v-if="visible" class="contact-dock" aria-label="Liên hệ nhanh">
    <a v-if="messengerHref" :href="messengerHref" target="_blank" rel="noopener noreferrer" class="contact-dock__item contact-dock__item--messenger" aria-label="Chat Messenger">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.4 2 2 6.1 2 11.4c0 2.8 1.2 5.3 3.2 7v3.3l3-1.7c1.1.3 2.3.5 3.8.5 5.6 0 10-4.1 10-9.2S17.6 2 12 2Zm1 12.3-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8Z" /></svg>
      <span class="contact-dock__label">Messenger</span>
    </a>
    <a v-if="zaloHref" :href="zaloHref" target="_blank" rel="noopener noreferrer" class="contact-dock__item contact-dock__item--zalo" aria-label="Chat Zalo">
      <span class="contact-dock__zalo" aria-hidden="true">Zalo</span>
      <span class="contact-dock__label">Chat Zalo</span>
    </a>
    <a v-if="telHref" :href="telHref" class="contact-dock__item contact-dock__item--call" :aria-label="`Gọi ${siteHotline}`">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 4h3.3l1.6 4.2-2.1 1.3a11 11 0 0 0 6.7 6.7l1.3-2.1L20 15.7V19a1.5 1.5 0 0 1-1.6 1.5C10.7 20 4 13.3 3.5 5.6A1.5 1.5 0 0 1 5 4Z" /></svg>
      <span class="contact-dock__label contact-dock__label--call">{{ siteHotline }}</span>
    </a>
  </aside>
</template>

<style scoped>
.contact-dock {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 45;
  display: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

@media (min-width: 1024px) {
  .contact-dock {
    display: flex;
  }
}

.contact-dock__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 14px;
  color: #fff;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, .22);
  font-size: 13px;
  font-weight: 700;
  transition: transform .15s ease, box-shadow .15s ease;
}

.contact-dock__item:hover,
.contact-dock__item:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, .28);
}

.contact-dock__item svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.contact-dock__item--call {
  background: #dc2626;
  animation: contact-dock-pulse 2.4s ease-out infinite;
}

.contact-dock__item--zalo {
  background: #0068ff;
}

.contact-dock__item--messenger {
  background: linear-gradient(135deg, #0a7cff, #a033ff);
}

.contact-dock__zalo {
  display: grid;
  width: 30px;
  height: 22px;
  place-items: center;
  color: #0068ff;
  background: #fff;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}

/* Secondary labels stay hidden until hover so the dock stays compact;
   the hotline number is always shown. */
.contact-dock__label {
  display: none;
}

.contact-dock__label--call,
.contact-dock__item:hover .contact-dock__label,
.contact-dock__item:focus-visible .contact-dock__label {
  display: inline;
}

@keyframes contact-dock-pulse {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, .45), 0 6px 18px rgba(15, 23, 42, .22); }
  70% { box-shadow: 0 0 0 14px rgba(220, 38, 38, 0), 0 6px 18px rgba(15, 23, 42, .22); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 6px 18px rgba(15, 23, 42, .22); }
}

@media (prefers-reduced-motion: reduce) {
  .contact-dock__item--call {
    animation: none;
  }
}
</style>
