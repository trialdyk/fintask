<script setup lang="ts">
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const { getBadgeColorClasses } = useHelpers()

const route = useRoute()
const colorMode = useColorMode()

// Fetch core data on layout mount
onMounted(async () => {
  await Promise.all([
    useWalletsStore().fetchAll(),
    useTransactionsStore().fetchAll(),
    tasksStore.fetchAll(),
    useCategoriesStore().fetchAll(),
  ])
})

const isDarkMode = computed({
  get: () => colorMode.preference === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

const userDisplayName = computed(() =>
  authStore.user?.user_metadata?.full_name || authStore.user?.email || 'Pengguna'
)
const userAvatar = computed(() =>
  authStore.user?.user_metadata?.avatar_url || ''
)

const menuItems = [
  { label: 'Dashboard', icon: 'i-heroicons-squares-2x2', to: '/dashboard' },
  { label: 'Transaksi', icon: 'i-heroicons-banknotes', to: '/dashboard/transactions' },
  { label: 'Tugas', icon: 'i-heroicons-clipboard-document-check', to: '/dashboard/tasks' },
  { label: 'Insight', icon: 'i-heroicons-light-bulb', to: '/dashboard/insights' },
  { label: 'Riwayat', icon: 'i-heroicons-clock', to: '/dashboard/history' },
]

const settingsItems = [
  { label: 'Dompet', icon: 'i-heroicons-wallet', to: '/dashboard/settings/wallets' },
  { label: 'Kategori Transaksi', icon: 'i-heroicons-rectangle-group', to: '/dashboard/settings/transaction-categories' },
  { label: 'Kategori Tugas', icon: 'i-heroicons-tag', to: '/dashboard/settings/task-category' },
]

const isOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
    <!-- Sidebar (Desktop) -->
    <aside class="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 z-40">
      <!-- Logo / Top -->
      <div class="flex items-center gap-3 mb-8 px-2">
        <img src="/favicon.svg" alt="FinTask Logo" class="w-9 h-9 drop-shadow-sm" />
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">FinTask</h1>
      </div>

      <!-- Nav -->
      <nav class="flex-1 space-y-1">
        <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="route.path === item.to
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
          {{ item.label }}
        </NuxtLink>

        <div class="pt-4 pb-2 px-3">
          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Pengaturan</p>
        </div>
        <NuxtLink v-for="item in settingsItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="route.path === item.to
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <!-- Task Counter -->
        <div v-if="tasksStore.incompleteCount > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
          {{ tasksStore.incompleteCount }} tugas belum selesai
        </div>
        <!-- Dark Mode Toggle -->
        <button @click="isDarkMode = !isDarkMode"
          class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <UIcon :name="isDarkMode ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-4 h-4" />
          {{ isDarkMode ? 'Mode Gelap' : 'Mode Terang' }}
        </button>
      </div>
    </aside>

    <!-- Main Area -->
    <div class="flex-1 flex flex-col min-w-0 lg:ml-64">
      <!-- Top bar -->
      <header class="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <button @click="isOpen = true" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
        </button>
        <div class="hidden lg:block" /> <!-- spacer -->

        <div class="flex items-center gap-3">
          <button @click="isDarkMode = !isDarkMode" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
            <UIcon :name="isDarkMode ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-5 h-5" />
          </button>

          <UDropdownMenu :items="[[{ label: 'Keluar', icon: 'i-heroicons-arrow-right-on-rectangle', click: authStore.logout }]]">
            <button class="flex items-center gap-2">
              <img v-if="userAvatar" :src="userAvatar" class="w-8 h-8 rounded-full ring-2 ring-primary-500/20" />
              <div v-else class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
                {{ userDisplayName.charAt(0).toUpperCase() }}
              </div>
              <span class="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{{ userDisplayName }}</span>
            </button>
          </UDropdownMenu>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- Mobile Drawer -->
    <USlideover v-model:open="isOpen" side="left" :ui="{ content: 'w-72' }">
      <template #body>
        <div class="flex items-center gap-3 mb-6">
          <img src="/favicon.svg" alt="FinTask Logo" class="w-9 h-9 drop-shadow-sm" />
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">FinTask</h1>
        </div>
        <nav class="space-y-1">
          <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to" @click="isOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="route.path === item.to
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
            {{ item.label }}
          </NuxtLink>
          <div class="pt-4 pb-2 px-3">
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Pengaturan</p>
          </div>
          <NuxtLink v-for="item in settingsItems" :key="item.to" :to="item.to" @click="isOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="route.path === item.to
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </template>
    </USlideover>
  </div>
</template>
