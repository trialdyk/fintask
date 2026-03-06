<script setup lang="ts">
import { formatCurrency, convertToIDR } from '~/utils/currency'

useHead({ title: 'Dashboard' })

const walletsStore = useWalletsStore()
const transactionsStore = useTransactionsStore()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const { getBadgeColorClasses } = useHelpers()

// --- Computed Stats ---

const totalBalance = computed(() => {
  return walletsStore.items.reduce((sum, w) => {
    return sum + convertToIDR(w.balance, w.currency || 'IDR')
  }, 0)
})

const currentMonth = new Date().getMonth()
const currentYear = new Date().getFullYear()

const thisMonthTransactions = computed(() => {
  return transactionsStore.items.filter(tx => {
    const txDate = new Date(tx.timestamp)
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
  })
})

const monthlyIncome = computed(() =>
  thisMonthTransactions.value
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
)

const monthlyExpense = computed(() =>
  thisMonthTransactions.value
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
)

// --- Lists for UI ---

const recentTransactions = computed(() => transactionsStore.items.slice(0, 5))

const pendingTasks = computed(() =>
  tasksStore.incomplete
    .sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      if (b.deadline) return 1
      return b.id - a.id
    })
    .slice(0, 5)
)

// --- Helpers ---
const formatDate = (ts: string | null) => {
  if (!ts) return ''
  const date = new Date(ts)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const getCategoryIcon = (categoryId?: number | null) => {
  const cat = categoriesStore.getTxCategoryById(categoryId)
  return cat?.icon || 'i-heroicons-tag'
}

const getWalletCurrency = (walletId: number) => {
  const w = walletsStore.getById(walletId)
  return w?.currency || 'IDR'
}

</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <UPageHeader 
      title="Selamat Datang Kembali!" 
      description="Berikut adalah ringkasan finansial dan tugas Anda bulan ini."
      class="mb-6"
    />

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Income -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5 text-green-500" />
            <span class="font-semibold text-slate-700 dark:text-slate-300">Pemasukan Bulan Ini</span>
          </div>
        </template>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(monthlyIncome, 'IDR') }}</p>
      </UCard>
      
      <!-- Expense -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5 text-red-500" />
            <span class="font-semibold text-slate-700 dark:text-slate-300">Pengeluaran Bulan Ini</span>
          </div>
        </template>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(monthlyExpense, 'IDR') }}</p>
      </UCard>

      <!-- Total Balance (Takes full width on sm, normal on lg) -->
      <UCard class="shadow-sm sm:col-span-2 lg:col-span-1 bg-primary-50 dark:bg-primary-950/20 ring-1 ring-primary-200 dark:ring-primary-800">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-wallet" class="w-5 h-5 text-primary-500" />
            <span class="font-semibold text-primary-700 dark:text-primary-400">Total Saldo (Semua Mata Uang)</span>
          </div>
        </template>
        <p class="text-2xl font-bold text-primary-900 dark:text-primary-100">{{ formatCurrency(totalBalance, 'IDR') }}</p>
        <p class="text-xs text-primary-600 mt-1">*Penjumlahan kasar jika beda mata uang</p>
      </UCard>
    </div>

    <!-- Main Content Divider -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Left Column: Tasks & Transactions -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Ongoing Tasks (di atas biar mobile-friendly) -->
        <UCard class="shadow-sm border border-gray-100 dark:border-gray-800">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-lg">Tugas Aktif</h3>
              <UButton variant="ghost" color="neutral" size="sm" to="/dashboard/tasks" trailing-icon="i-heroicons-arrow-right">Lihat Semua</UButton>
            </div>
          </template>

          <div v-if="pendingTasks.length === 0" class="text-center py-6 text-gray-500">
            Hore! Tidak ada tugas yang tertunda.
          </div>

          <div v-else class="space-y-3">
             <div v-for="task in pendingTasks" :key="task.id.toString()" class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                <UCheckbox :model-value="task.is_completed" disabled />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-gray-900 dark:text-white truncate">{{ task.name }}</p>
                  <p v-if="task.deadline" class="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium">
                    <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                    Tenggat: {{ formatDate(task.deadline) }}
                  </p>
                </div>
                <UBadge v-if="task.priority" size="sm" variant="subtle" :color="
                    task.priority === 'high' ? 'error' : 
                    task.priority === 'medium' ? 'warning' : 'success'
                " class="capitalize">
                  {{ task.priority }}
                </UBadge>
             </div>
          </div>
        </UCard>

        <!-- Recent Transactions -->
        <UCard class="shadow-sm border border-gray-100 dark:border-gray-800">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-lg">Transaksi Terakhir</h3>
              <UButton variant="ghost" color="neutral" size="sm" to="/dashboard/transactions" trailing-icon="i-heroicons-arrow-right">Lihat Semua</UButton>
            </div>
          </template>

          <div v-if="recentTransactions.length === 0" class="text-center py-6 text-gray-500">
            Belum ada transaksi.
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="tx in recentTransactions" :key="tx.id.toString()" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner"
                     :class="{
                        'bg-red-100 text-red-600 dark:bg-red-900/30': tx.type === 'expense',
                        'bg-green-100 text-green-600 dark:bg-green-900/30': tx.type === 'income',
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30': tx.type === 'transfer',
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30': tx.type === 'correction'
                     }">
                    <span v-if="tx.type === 'correction'" class="text-lg">⚖️</span>
                    <span v-else-if="tx.type === 'transfer'" class="text-lg">🔁</span>
                    <span v-else-if="getCategoryIcon(tx.category_id) !== 'i-heroicons-tag'" class="text-lg">{{ getCategoryIcon(tx.category_id) }}</span>
                    <span v-else class="text-lg">📄</span>
                </div>
                <div>
                  <p class="font-medium text-sm md:text-base text-gray-900 dark:text-white">{{ tx.title }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(tx.timestamp) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-sm md:text-base" :class="{
                  'text-green-600 dark:text-green-400': tx.type === 'income',
                  'text-red-600 dark:text-red-400': tx.type === 'expense',
                  'text-blue-600 dark:text-blue-400': tx.type === 'transfer',
                  'text-orange-600 dark:text-orange-400': tx.type === 'correction'
                }">
                  {{ (tx.type === 'expense' || (tx.type === 'correction' && tx.notes?.includes('Ke bawah'))) ? '-' : '+' }} 
                  {{ formatCurrency(tx.amount, getWalletCurrency(tx.wallet_id)) }}
                </p>
                <p class="text-xs text-gray-500 capitalize">{{ tx.type }}</p>
              </div>
            </div>
          </div>
        </UCard>

      </div>

      <!-- Right Column: Wallets & Quick Actions -->
      <div class="space-y-6">
        
        <UCard class="shadow-sm border border-gray-100 dark:border-gray-800">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-lg">Semua Dompet</h3>
              <UButton variant="ghost" color="neutral" size="sm" to="/dashboard/settings/wallets" icon="i-heroicons-cog-6-tooth" />
            </div>
          </template>

          <div v-if="walletsStore.items.length === 0" class="text-center py-6 text-sm text-gray-500">
            Belum ada dompet.
          </div>

          <div v-else class="space-y-4">
            <div v-for="wallet in walletsStore.items" :key="wallet.id" class="flex items-center justify-between gap-2">
               <div class="flex items-center gap-3 min-w-0 flex-1">
                 <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset transition-colors shrink-0 max-w-[150px] sm:max-w-[200px]" :class="getBadgeColorClasses(wallet.color)">
                    <span class="text-base leading-none shrink-0">{{ wallet.icon || '💳' }}</span>
                    <span class="truncate">{{ wallet.name }}</span>
                 </span>
                 <span class="text-xs text-gray-500 capitalize shrink-0 hidden sm:inline-block">{{ wallet.type }}</span>
               </div>
               <div class="text-right font-semibold text-sm shrink-0">
                 {{ formatCurrency(wallet.balance, wallet.currency || 'IDR') }}
               </div>
            </div>
          </div>
        </UCard>

      </div>

    </div>
  </div>
</template>
