export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  if (!auth.isAuthenticated.value) {
    return navigateTo({ path: '/dang-nhap', query: { redirect: to.fullPath } })
  }

  const user = await auth.fetchUser()
  if (!user) {
    return navigateTo({ path: '/dang-nhap', query: { redirect: to.fullPath } })
  }
})
