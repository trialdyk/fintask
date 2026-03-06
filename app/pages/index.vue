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
        <!-- New Logo: Wallet + Checklist inside a shield/square -->
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
            <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            <path d="M8 15l2 2 4-4" stroke-width="2.5" class="text-emerald-400" />
          </svg>
        </div>
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
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
              <path d="M8 15l2 2 4-4" stroke-width="2.5" class="text-emerald-400" />
            </svg>
          </div>
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
            variant="solid"
            block
            size="xl"
            class="h-14 text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            :loading="loading"
            @click="handleLogin"
          >
            Mulai Sekarang / Masuk
            <template #trailing>
              <Icon name="ph:arrow-right-bold" class="w-5 h-5 ml-2" />
            </template>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

useHead({
  title: 'Kelola Keuangan & Tugas dalam Satu Tempat',
  meta: [
    { name: 'description', content: 'Fintask adalah aplikasi pencatatan keuangan dan manajemen tugas harian yang terintegrasi, aman, dan mudah digunakan. Catat pemasukan, pengeluaran, dan kelola to-do list Anda.' },
    { name: 'keywords', content: 'fintask, keuangan, pencatatan keuangan, manajemen tugas, to-do list, pemasukan, pengeluaran, dompet digital, aplikasi keuangan' },
    { name: 'author', content: 'Fintask' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Fintask — Kelola Keuangan & Tugas dalam Satu Tempat' },
    { property: 'og:description', content: 'Tingkatkan produktivitas Anda dengan sistem pencatatan keuangan dan manajemen tugas yang terintegrasi, aman, dan mudah digunakan.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/favicon.svg' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Fintask — Kelola Keuangan & Tugas dalam Satu Tempat' },
    { name: 'twitter:description', content: 'Tingkatkan produktivitas Anda dengan sistem pencatatan keuangan dan manajemen tugas yang terintegrasi.' },
  ],
})

const handleLogin = async () => {
  loading.value = true
  try {
    // Simulate slight API delay for smooth UX transition
    await new Promise(resolve => setTimeout(resolve, 800))
    await authStore.login()
    
    // Redirect once authenticated
    router.push('/dashboard')
  } catch (err) {
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>
