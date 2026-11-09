// Remember the UTM tags of the visit for 30 days. Browser only, so pages
// served from the ISR cache still pick them up.
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return
  if (!['utm_source', 'utm_campaign', 'utm_content'].some(key => key in to.query)) return
  useUtmSource().capture(to.query)
})
