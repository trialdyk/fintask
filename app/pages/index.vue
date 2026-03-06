<template>
  <div class="min-h-screen flex selection:bg-indigo-500 selection:text-white">
    <!-- Left Section: Branding & Decorative Background -->
    <div class="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between items-start p-12">
      <!-- Background pattern -->
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-900/40 blur-3xl"></div>
      
      <!-- Top Branding -->
      <div class="relative z-10 flex items-center space-x-3">
        <img src="/favicon.svg" alt="Fintask Logo" class="w-10 h-10 drop-shadow-md" />
        <span class="text-2xl font-bold text-white tracking-tight">Fintask</span>
      </div>

      <!-- Bottom Tagline -->
      <div class="relative z-10 max-w-md">
        <h2 class="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Kelola Keuangan & Tugas dalam Satu Tempat
        </h2>
        <p class="text-lg text-slate-400 font-medium">
          Tingkatkan produktivitas Anda dengan sistem pencatatan yang terintegrasi, aman, dan mudah digunakan.
        </p>
      </div>
    </div>

    <!-- Right Section: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-slate-900">
      <div class="w-full max-w-md space-y-8">
        
        <!-- Mobile Logo (Hidden on Desktop) -->
        <div class="flex lg:hidden justify-center items-center space-x-3 mb-8">
          <img src="/favicon.svg" alt="Fintask Logo" class="w-12 h-12 drop-shadow-md" />
        </div>

        <div class="text-center lg:text-left">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Mulai Perjalanan Finansial Anda
          </h1>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Bergabunglah dengan Fintask untuk mengelola catatan keuangan dan daftar tugas harian dalam satu aplikasi yang mulus dan terpusat.
          </p>
        </div>

        <div class="mt-10">
          <UButton
            color="primary"
            variant="soft"
            block
            size="xl"
            class="h-14 text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            :loading="loading"
            @click="handleLogin"
          >
            <template #leading>
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </template>
            Masuk dengan Google
          </UButton>
        </div>

        <div class="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Dengan masuk, Anda menyetujui <a href="#" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Ketentuan Layanan</a> dan <a href="#" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Kebijakan Privasi</a> kami.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

useHead({
  title: 'Kelola Keuangan & Tugas dalam Satu Tempat',
  meta: [
    { name: 'description', content: 'Fintask adalah aplikasi pencatatan keuangan dan manajemen tugas harian yang terintegrasi, aman, dan mudah digunakan.' },
    { name: 'keywords', content: 'fintask, keuangan, pencatatan keuangan, manajemen tugas, to-do list' },
    { property: 'og:title', content: 'Fintask — Kelola Keuangan & Tugas dalam Satu Tempat' },
    { property: 'og:description', content: 'Tingkatkan produktivitas Anda dengan sistem pencatatan keuangan dan manajemen tugas yang terintegrasi.' },
    { property: 'og:type', content: 'website' },
  ],
})

// Redirect if already logged in
const user = useSupabaseUser()
watch(user, (val) => {
  if (val) navigateTo('/dashboard')
}, { immediate: true })

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login()
  } catch (err) {
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>
