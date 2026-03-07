<script setup lang="ts">
import type { Transaction, TransactionCategory, Wallet } from '~/types/database.types'
import { formatCurrency } from '~/utils/currency'
import { type MonthRange, filterTxByRange, pctChange } from '~/composables/useInsights'

const { formatCompact, getHexColor, getBadgeColorClasses, getLocalDateString } = useHelpers()
const { getWalletStats } = useInsights()

const props = defineProps<{
  filteredTx: readonly Transaction[]
  allTx: readonly Transaction[]
  wallets: readonly Wallet[] | null
  categories: readonly TransactionCategory[]
  currentRange: MonthRange
  prevRange: MonthRange
}>()

const walletStats = computed(() => {
  const prevTxs = filterTxByRange(props.allTx as Transaction[], props.prevRange)
  return getWalletStats(
    props.filteredTx as Transaction[],
    prevTxs,
    props.wallets as Wallet[],
    props.categories as TransactionCategory[]
  )
})

// Balance distribution pie
const colorMode = useColorMode()
const pieSeries = computed(() => walletStats.value.map(w => Math.max(w.balance, 0)))
const pieOptions = computed(() => ({
  chart: { type: 'donut' as const, fontFamily: 'inherit', background: 'transparent' },
  labels: walletStats.value.map(w => w.name),
  colors: walletStats.value.map(w => getHexColor(w.color)),
  dataLabels: { enabled: false },
  legend: { show: false },
  stroke: { show: true, width: 2, colors: [colorMode.value === 'dark' ? '#111827' : '#ffffff'] },
  tooltip: { theme: colorMode.value, y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } },
  theme: { mode: colorMode.value as 'light' | 'dark' },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          name: { show: true, fontSize: '12px', color: '#9ca3af' },
          value: { show: true, fontSize: '18px', fontWeight: 700, formatter: (val: number) => formatCompact(Number(val)) },
          total: {
            show: true, label: 'Total Saldo',
            formatter: (w: any) => formatCompact(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0))
          }
        }
      }
    }
  }
}))

const buildWalletHistoryLink = (walletId: number) => {
  const from = getLocalDateString(props.currentRange.start)
  const to = getLocalDateString(props.currentRange.end)
  return `/dashboard/history?wallet=${walletId}&dateFrom=${from}&dateTo=${to}`
}
</script>

<template>
  <div class="space-y-4">
    <!-- Balance Distribution Pie -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-3">Distribusi Saldo</p>
      <div v-if="walletStats.length === 0" class="text-center py-12 text-sm text-gray-500">Belum ada dompet.</div>
      <div v-else>
        <div class="flex justify-center mb-4">
          <ClientOnly>
            <apexchart type="donut" width="280" :options="pieOptions" :series="pieSeries" />
            <template #fallback>
              <div class="w-[280px] h-[280px] flex items-center justify-center text-sm text-gray-500">Memuat grafik...</div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Per-Wallet Cards -->
    <div class="space-y-3">
      <div v-for="w in walletStats" :key="w.id" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:ring-1 ring-primary-500/30 transition-all">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset transition-colors shrink-0" :class="getBadgeColorClasses(w.color)">
              <span class="text-base leading-none">{{ w.icon }}</span>
              <span class="truncate">{{ w.name }}</span>
            </span>
            <span class="text-xs text-gray-400">{{ w.balancePercent }}% total</span>
          </div>
          <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(w.balance, w.currency) }}</p>
        </div>

        <!-- Income / Expense for this wallet this period -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-green-50 dark:bg-green-900/10 rounded-lg p-2.5">
            <p class="text-[10px] text-green-600 dark:text-green-400 mb-0.5">Pemasukan</p>
            <p class="text-xs font-bold text-green-700 dark:text-green-300">{{ formatCompact(w.income) }}</p>
            <span v-if="w.incomePctChange !== null" class="text-[10px]" :class="w.incomePctChange >= 0 ? 'text-green-600' : 'text-red-500'">
              {{ w.incomePctChange >= 0 ? '↑' : '↓' }}{{ Math.abs(w.incomePctChange) }}%
            </span>
          </div>
          <div class="bg-red-50 dark:bg-red-900/10 rounded-lg p-2.5">
            <p class="text-[10px] text-red-600 dark:text-red-400 mb-0.5">Pengeluaran</p>
            <p class="text-xs font-bold text-red-700 dark:text-red-300">{{ formatCompact(w.expense) }}</p>
            <span v-if="w.expensePctChange !== null" class="text-[10px]" :class="w.expensePctChange <= 0 ? 'text-green-600' : 'text-red-500'">
              {{ w.expensePctChange > 0 ? '↑' : '↓' }}{{ Math.abs(w.expensePctChange) }}%
            </span>
          </div>
        </div>

        <!-- Top 5 categories -->
        <div v-if="w.topCategories.length > 0" class="border-t border-gray-100 dark:border-gray-800 pt-2.5">
          <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Top Pengeluaran</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="tc in w.topCategories" :key="tc.name" class="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5">
              {{ tc.icon }} {{ tc.name }} <span class="font-semibold">{{ formatCompact(tc.amount) }}</span>
            </span>
          </div>
        </div>

        <!-- Drill-down -->
        <NuxtLink :to="buildWalletHistoryLink(w.id)" class="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-2.5">
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
          Lihat riwayat
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
