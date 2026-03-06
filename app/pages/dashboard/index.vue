<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from 'spacetimedb/vue'
import { tables } from '../../../src/module_bindings'
import { formatCurrency, convertToIDR } from '~/utils/currency'

// Meta
useHead({ title: 'Dashboard' })

// Database subscriptions  
const [wallets] = useTable(tables.Wallet)
const [transactions] = useTable(tables.Transaction)
const [tasks] = useTable(tables.Task)
const [txCategories] = useTable(tables.TransactionCategory)

// --- Helper to get the enum tag string ---
const getTag = (val: any): string => {
  if (typeof val === 'string') return val.toLowerCase()
  if (val && typeof val === 'object' && 'tag' in val) return String(val.tag).toLowerCase()
  return ''
}

// --- Computed Stats ---

const totalBalance = computed(() => {
  if (!wallets.value) return 0
  return wallets.value.reduce((sum, w) => {
    const currency = getTag(w.currency) || 'IDR'
    return sum + convertToIDR(Number(w.balance), currency)
  }, 0)
})

const currentMonth = new Date().getMonth()
const currentYear = new Date().getFullYear()

const thisMonthTransactions = computed(() => {
  if (!transactions.value) return []
  return transactions.value.filter(tx => {
    const txDate = new Date(Number(tx.timestamp.microsSinceUnixEpoch / 1000n))
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
  })
})

const monthlyIncome = computed(() => {
  return thisMonthTransactions.value
    .filter(tx => getTag(tx.type) === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
})

const monthlyExpense = computed(() => {
  return thisMonthTransactions.value
    .filter(tx => getTag(tx.type) === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
})

// --- Lists for UI ---

const recentTransactions = computed(() => {
  if (!transactions.value) return []
  return [...transactions.value]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, 5)
})

const pendingTasks = computed(() => {
  if (!tasks.value) return []
  return tasks.value
    .filter(t => !t.isCompleted)
    .sort((a, b) => {
      if (a.deadline && b.deadline) return Number(a.deadline) - Number(b.deadline)
      if (a.deadline) return -1
      if (b.deadline) return 1
      return Number(b.id) - Number(a.id)
    })
    .slice(0, 5)
})

// Format helpers
const formatDate = (ts: any) => {
  if (!ts) return ''
  let date: Date
  if (ts.microsSinceUnixEpoch) {
    date = new Date(Number(ts.microsSinceUnixEpoch / 1000n))
  } else {
    date = new Date(Number(ts))
  }

  if (isNaN(date.getTime())) return 'Invalid Date'

  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const getCategoryIcon = (categoryId?: bigint) => {
  if (!categoryId || !txCategories.value) return 'i-heroicons-tag'
  const cat = txCategories.value.find(c => c.id.toString() === categoryId.toString())
  return cat?.icon || 'i-heroicons-tag'
}

const getCategoryColorClasses = (categoryId?: bigint) => {
  if (!categoryId || !txCategories.value) return getBadgeColorClasses('neutral')
  const cat = txCategories.value.find(c => c.id.toString() === categoryId.toString())
  return getBadgeColorClasses(cat?.color)
}

const getWalletCurrency = (walletId: bigint) => {
  if (!wallets.value) return 'IDR'
  const w = wallets.value.find(w => w.id === walletId)
  return w ? getTag(w.currency).toUpperCase() || 'IDR' : 'IDR'
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
                <UCheckbox :model-value="task.isCompleted" disabled />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-gray-900 dark:text-white truncate">{{ task.name }}</p>
                  <p v-if="task.deadline" class="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium">
                    <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                    Tenggat: {{ formatDate(task.deadline) }}
                  </p>
                </div>
                <UBadge v-if="getTag(task.priority)" size="sm" variant="subtle" :color="
                    getTag(task.priority) === 'high' ? 'error' : 
                    getTag(task.priority) === 'medium' ? 'warning' : 'success'
                " class="capitalize">
                  {{ getTag(task.priority) }}
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
                        'bg-red-100 text-red-600 dark:bg-red-900/30': getTag(tx.type) === 'expense',
                        'bg-green-100 text-green-600 dark:bg-green-900/30': getTag(tx.type) === 'income',
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30': getTag(tx.type) === 'transfer',
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30': getTag(tx.type) === 'correction'
                     }">
                    <span v-if="getTag(tx.type) === 'correction'" class="text-lg">⚖️</span>
                    <span v-else-if="getTag(tx.type) === 'transfer'" class="text-lg">🔁</span>
                    <span v-else-if="getCategoryIcon(tx.categoryId) !== 'i-heroicons-tag'" class="text-lg">{{ getCategoryIcon(tx.categoryId) }}</span>
                    <span v-else class="text-lg">📄</span>
                </div>
                <div>
                  <p class="font-medium text-sm md:text-base text-gray-900 dark:text-white">{{ tx.title }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(tx.timestamp) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-sm md:text-base" :class="{
                  'text-green-600 dark:text-green-400': getTag(tx.type) === 'income',
                  'text-red-600 dark:text-red-400': getTag(tx.type) === 'expense',
                  'text-blue-600 dark:text-blue-400': getTag(tx.type) === 'transfer',
                  'text-orange-600 dark:text-orange-400': getTag(tx.type) === 'correction'
                }">
                  {{ (getTag(tx.type) === 'expense' || (getTag(tx.type) === 'correction' && tx.notes?.includes('Ke bawah'))) ? '-' : '+' }} 
                  {{ formatCurrency(Number(tx.amount), getWalletCurrency(tx.walletId)) }}
                </p>
                <p class="text-xs text-gray-500 capitalize">{{ getTag(tx.type) || 'unknown' }}</p>
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

          <div v-if="wallets.length === 0" class="text-center py-6 text-sm text-gray-500">
            Belum ada dompet.
          </div>

          <div v-else class="space-y-4">
            <div v-for="wallet in wallets" :key="wallet.id.toString()" class="flex items-center justify-between gap-2">
               <div class="flex items-center gap-3 min-w-0 flex-1">
                 <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset transition-colors shrink-0 max-w-[150px] sm:max-w-[200px]" :class="getBadgeColorClasses(wallet.color)">
                    <span class="text-base leading-none shrink-0">{{ wallet.icon || '💳' }}</span>
                    <span class="truncate">{{ wallet.name }}</span>
                 </span>
                 <span class="text-xs text-gray-500 capitalize shrink-0 hidden sm:inline-block">{{ getTag(wallet.type) || 'unknown' }}</span>
               </div>
               <div class="text-right font-semibold text-sm shrink-0">
                 {{ formatCurrency(Number(wallet.balance), getTag(wallet.currency) || 'IDR') }}
               </div>
            </div>
          </div>
        </UCard>

      </div>

    </div>
  </div>
</template>
