<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
    <div class="flex flex-col items-center justify-center space-y-4">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-indigo-500 animate-spin" />
      <p class="text-lg font-medium text-slate-700 dark:text-slate-300">
        Authenticating...
      </p>
      <p class="text-sm text-slate-500 text-center max-w-sm">
        Please wait while we establish a secure connection with your account.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  try {
    // Process the redirect callback to get token & user info
    await authStore.handleCallback()
    
    // Auth successful, proceed to dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Authentication callback failed:', error)
    // You could also set an error state here and display it to the user
    // or redirect to login page with an error query
    router.push('/?error=auth_failed')
  }
})
</script>
