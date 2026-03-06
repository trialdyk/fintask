<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
    <div class="flex flex-col items-center justify-center space-y-4">
      <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-12 h-12 text-slate-500" />
      <p class="text-lg font-medium text-slate-700 dark:text-slate-300">
        Keluar dari Fintask...
      </p>
      <p class="text-sm text-slate-500 text-center max-w-sm">
        Sesi Anda sedang diakhiri dengan aman.
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
  // Panggil reset session di store supaya state di memori bersih
  try {
    // Memberi jeda kecil agar UX terasa mulus (tidak kedip instan ke halaman depan)
    await new Promise(resolve => setTimeout(resolve, 800))
    await authStore.logout()
  } catch (e) {
    console.error("Logout error", e)
  } finally {
    // Kembali ke halaman utang/welcome page
    router.push('/')
  }
})
</script>
