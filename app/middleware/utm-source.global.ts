import { UTM_KEYS } from '~/composables/useUtmSource'

// Remember the UTM tags and the landing page of the visit for 30 days.
// Browser only, so pages served from the ISR cache still pick them up.
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return
  const source = useUtmSource()
  if (UTM_KEYS.some(key => key in to.query)) source.capture(to.query, to.fullPath)
  else source.rememberLanding(to.fullPath)
})
