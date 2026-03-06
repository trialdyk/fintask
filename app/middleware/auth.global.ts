export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Protect dashboard routes
  if (to.path.startsWith('/dashboard') && !user.value) {
    return navigateTo('/')
  }

  // Redirect authenticated users away from login
  if (to.path === '/' && user.value) {
    return navigateTo('/dashboard')
  }
})
