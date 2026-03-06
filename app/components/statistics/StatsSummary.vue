<script setup lang="ts">
import type { Transaction } from '~/types/database.types'
import { formatCurrency } from '~/utils/currency'
import { type MonthRange, filterTxByRange, computeTotals, pctChange, computeAverages } from '~/composables/useInsights'

const { formatCompact } = useHelpers()

const props = defineProps<{
  filteredTx: readonly Transaction[]
  allTx: readonly Transaction[]
  currentRange: MonthRange
  prevRange: MonthRange
  yearAgoRange: MonthRange
}>()

// Current period totals
const totals = computed(() => computeTotals(props.filteredTx as Transaction[]))

// Previous month totals
const prevTotals = computed(() => {
  const prevTxs = filterTxByRange(props.allTx as Transaction[], props.prevRange)
  return computeTotals(prevTxs)
})

// Year ago totals
const yearAgoTotals = computed(() => {
  const yaTxs = filterTxByRange(props.allTx as Transaction[], props.yearAgoRange)
  return computeTotals(yaTxs)
})

// % Changes
const incomeVsPrev = computed(() => pctChange(totals.value.income, prevTotals.value.income))
const expenseVsPrev = computed(() => pctChange(totals.value.expense, prevTotals.value.expense))
const incomeVsYear = computed(() => pctChange(totals.value.income, yearAgoTotals.value.income))
const expenseVsYear = computed(() => pctChange(totals.value.expense, yearAgoTotals.value.expense))

// Averages
const incomeAvgs = computed(() => computeAverages(totals.value.income, props.currentRange.daysInMonth))
const expenseAvgs = computed(() => computeAverages(totals.value.expense, props.currentRange.daysInMonth))

// Drill down navigation
const buildHistoryLink = (type: 'income' | 'expense') => {
  const from = props.currentRange.start.toISOString().substring(0, 10)
  const to = props.currentRange.end.toISOString().substring(0, 10)
  return `/dashboard/history?type=${type}&dateFrom=${from}&dateTo=${to}`
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Income -->
      <NuxtLink :to="buildHistoryLink('income')" class="block bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:ring-2 ring-green-500/30 transition-all cursor-pointer group">
        <div class="flex items-center gap-1.5 mb-1.5">
          <div class="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-green-500" />
          </div>
          <span class="text-xs text-gray-500">Pemasukan</span>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white truncate">{{ formatCurrency(totals.income, 'IDR') }}</p>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span v-if="incomeVsPrev !== null" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" :class="incomeVsPrev >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'">
            {{ incomeVsPrev >= 0 ? '↑' : '↓' }}{{ Math.abs(incomeVsPrev) }}% vs bln lalu
          </span>
          <span v-if="incomeVsYear !== null" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {{ incomeVsYear >= 0 ? '↑' : '↓' }}{{ Math.abs(incomeVsYear) }}% vs thn lalu
          </span>
        </div>
        <p class="text-[10px] text-gray-400 mt-1 group-hover:text-primary-500 transition-colors">Klik untuk rincian →</p>
      </NuxtLink>

      <!-- Expense -->
      <NuxtLink :to="buildHistoryLink('expense')" class="block bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:ring-2 ring-red-500/30 transition-all cursor-pointer group">
        <div class="flex items-center gap-1.5 mb-1.5">
          <div class="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-4 h-4 text-red-500" />
          </div>
          <span class="text-xs text-gray-500">Pengeluaran</span>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white truncate">{{ formatCurrency(totals.expense, 'IDR') }}</p>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span v-if="expenseVsPrev !== null" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" :class="expenseVsPrev <= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'">
            {{ expenseVsPrev > 0 ? '↑' : '↓' }}{{ Math.abs(expenseVsPrev) }}% vs bln lalu
          </span>
          <span v-if="expenseVsYear !== null" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {{ expenseVsYear > 0 ? '↑' : '↓' }}{{ Math.abs(expenseVsYear) }}% vs thn lalu
          </span>
        </div>
        <p class="text-[10px] text-gray-400 mt-1 group-hover:text-primary-500 transition-colors">Klik untuk rincian →</p>
      </NuxtLink>

      <!-- Net Flow -->
      <div class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-1.5 mb-1.5">
          <div class="w-7 h-7 rounded-full flex items-center justify-center" :class="totals.net >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'">
            <UIcon name="i-heroicons-scale" class="w-4 h-4" :class="totals.net >= 0 ? 'text-blue-500' : 'text-orange-500'" />
          </div>
          <span class="text-xs text-gray-500">Arus Kas</span>
        </div>
        <p class="text-lg font-bold truncate" :class="totals.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'">
          {{ totals.net >= 0 ? '+' : '' }}{{ formatCurrency(totals.net, 'IDR') }}
        </p>
      </div>

      <!-- Tx Count -->
      <div class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-1.5 mb-1.5">
          <div class="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-purple-500" />
          </div>
          <span class="text-xs text-gray-500">Transaksi</span>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white">{{ totals.txCount }}</p>
        <p class="text-xs text-gray-400 mt-0.5">dalam {{ currentRange.daysInMonth }} hari</p>
      </div>
    </div>

    <!-- Ratio Bar -->
    <div v-if="totals.income > 0 || totals.expense > 0" class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
      <p class="text-xs text-gray-500 mb-2">Rasio Pemasukan vs Pengeluaran</p>
      <div class="flex h-5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <div class="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 flex items-center justify-center"
          :style="{ width: `${(totals.income / Math.max(totals.income + totals.expense, 1)) * 100}%` }">
          <span v-if="totals.income > 0" class="text-[10px] font-bold text-white">{{ Math.round((totals.income / (totals.income + totals.expense)) * 100) }}%</span>
        </div>
        <div class="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 flex items-center justify-center"
          :style="{ width: `${(totals.expense / Math.max(totals.income + totals.expense, 1)) * 100}%` }">
          <span v-if="totals.expense > 0" class="text-[10px] font-bold text-white">{{ Math.round((totals.expense / (totals.income + totals.expense)) * 100) }}%</span>
        </div>
      </div>
      <div class="flex justify-between mt-1.5 text-xs text-gray-500">
        <div class="flex items-center gap-1"><div class="w-2 h-2 bg-green-500 rounded-full" /> Pemasukan</div>
        <div class="flex items-center gap-1"><div class="w-2 h-2 bg-red-500 rounded-full" /> Pengeluaran</div>
      </div>
    </div>

    <!-- Averages Grid -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p class="text-sm font-medium text-gray-900 dark:text-white">Rata-rata</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500">
              <th class="text-left px-4 py-2 font-medium"></th>
              <th class="text-right px-4 py-2 font-medium">Harian</th>
              <th class="text-right px-4 py-2 font-medium">Bulanan</th>
              <th class="text-right px-4 py-2 font-medium">Tahunan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr>
              <td class="px-4 py-2.5 text-green-600 dark:text-green-400 font-medium text-xs">Pemasukan</td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-900 dark:text-white">{{ formatCompact(incomeAvgs.avgDaily) }}</td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-900 dark:text-white">{{ formatCompact(incomeAvgs.avgMonthly) }}</td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-900 dark:text-white">{{ formatCompact(incomeAvgs.avgYearly) }}</td>
            </tr>
            <tr>
              <td class="px-4 py-2.5 text-red-600 dark:text-red-400 font-medium text-xs">Pengeluaran</td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-900 dark:text-white">{{ formatCompact(expenseAvgs.avgDaily) }}</td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-900 dark:text-white">{{ formatCompact(expenseAvgs.avgMonthly) }}</td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-900 dark:text-white">{{ formatCompact(expenseAvgs.avgYearly) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
