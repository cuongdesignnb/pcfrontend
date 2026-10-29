// Record ?ref=CODE visits from CTV links. Runs in the browser only, so pages
// served from the ISR cache still pick the code up.
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client || typeof to.query.ref !== 'string') return
  void useAffiliateRef().capture(to.query.ref, to.fullPath)
})
