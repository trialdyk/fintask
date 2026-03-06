import { defineStore } from 'pinia'
import { ref } from 'vue'
import { UserManager, type User } from 'oidc-client-ts'
import { useRuntimeConfig } from '#imports'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const oidcUser = ref<User | null>(null)
  
  let userManager: UserManager | null = null

  const initUserManager = () => {
    if (!import.meta.client || userManager) return userManager

    const config = useRuntimeConfig()
    
    userManager = new UserManager({
      authority: 'https://auth.spacetimedb.com/oidc',
      client_id: config.public.spacetimeClientId as string || 'TBA',
      redirect_uri: `${window.location.origin}/callback`,
      post_logout_redirect_uri: `${window.location.origin}/logout/callback`,
      scope: 'openid profile email',
      response_type: 'code',
      automaticSilentRenew: true,
    })
    return userManager
  }

  const login = async () => {
    const um = initUserManager()
    if (um) {
      await um.signinRedirect()
    }
  }

  const handleCallback = async () => {
    const um = initUserManager()
    if (um) {
      try {
        const user = await um.signinRedirectCallback()
        oidcUser.value = user
        token.value = user.id_token || user.access_token
        return user
      } catch (err) {
        console.error("Error during OIDC callback:", err)
        throw err
      }
    }
  }

  const logout = async () => {
    const um = initUserManager()
    if (um) {
      await um.signoutRedirect()
    }
    token.value = null
    oidcUser.value = null
  }

  const checkSession = async () => {
    const um = initUserManager()
    if (um) {
      try {
        const user = await um.getUser()
        if (user) {
          oidcUser.value = user
          token.value = user.id_token || user.access_token
        } else {
          token.value = null
        }
      } catch (e) {
        console.error("Session check error", e)
      }
    }
  }

  return {
    token,
    oidcUser,
    login,
    handleCallback,
    logout,
    checkSession
  }
})
