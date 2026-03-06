import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const isAuthenticated = computed(() => !!user.value)

  async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  async function logout() {
    // Reset all domain stores before signing out
    const stores = [
      useWalletsStore(),
      useTransactionsStore(),
      useTasksStore(),
      useCategoriesStore(),
    ]
    stores.forEach(s => s.$reset())

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    navigateTo('/')
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  }
})
