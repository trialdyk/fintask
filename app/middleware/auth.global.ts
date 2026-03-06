import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  // Skip middleware on server-side because auth token is stored in localStorage
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Make sure we check session if we are on client side before judging
  if (import.meta.client) {
    await authStore.checkSession()
  }

  const isAuthenticated = !!authStore.token

  // If trying to access dashboard but not authenticated
  if (to.path.startsWith('/dashboard') && !isAuthenticated) {
    return navigateTo('/')
  }

  // If trying to access root but already authenticated
  if (to.path === '/' && isAuthenticated) {
    return navigateTo('/dashboard')
  }
})
