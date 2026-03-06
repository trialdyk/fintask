<script setup lang="ts">
import type { Transaction, TransactionCategory, TransactionSubcategory } from '~/types/database.types'
import { formatCurrency } from '~/utils/currency'
import {
  buildMonthRange, filterTxByRange, computeTotals, pctChange,
  type MonthRange, type ComparisonInsight
} from '~/composables/useInsights'

const { formatCompact, getHexColor } = useHelpers()
const { generateComparisonInsights, getCategoryBreakdown } = useInsights()

const props = defineProps<{
  allTx: readonly Transaction[]
  categories: readonly TransactionCategory[]
  subcategories: readonly TransactionSubcategory[]
}>()

// Month pickers
const now = new Date()
const monthAYear = ref(now.getFullYear())
const monthAMonth = ref(now.getMonth() === 0 ? 11 : now.getMonth() - 1)
const monthBYear = ref(now.getFullYear())
const monthBMonth = ref(now.getMonth())

// Fix year when month is December for "previous" month
if (now.getMonth() === 0) monthAYear.value = now.getFullYear() - 1

const monthLabels = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Build year options (2020 - current + 1)
const yearOptions = Array.from({ length: now.getFullYear() - 2020 + 2 }, (_, i) => 2020 + i)

const rangeA = computed(() => buildMonthRange(monthAYear.value, monthAMonth.value))
const rangeB = computed(() => buildMonthRange(monthBYear.value, monthBMonth.value))

const txA = computed(() => filterTxByRange(props.allTx as Transaction[], rangeA.value))
const txB = computed(() => filterTxByRange(props.allTx as Transaction[], rangeB.value))

const totalsA = computed(() => computeTotals(txA.value))
const totalsB = computed(() => computeTotals(txB.value))

// Category breakdowns for comparison
const catBreakdownA = computed(() =>
  getCategoryBreakdown(txA.value, [], 'expense', rangeA.value.daysInMonth, props.categories as TransactionCategory[], props.subcategories as TransactionSubcategory[])
)
const catBreakdownB = computed(() =>
  getCategoryBreakdown(txB.value, [], 'expense', rangeB.value.daysInMonth, props.categories as TransactionCategory[], props.subcategories as TransactionSubcategory[])
)

// Merged category comparison
const categoryComparison = computed(() => {
  const allCatIds = new Set([
    ...catBreakdownA.value.map(c => c.id),
    ...catBreakdownB.value.map(c => c.id)
  ])
  return [...allCatIds].map(catId => {
    const a = catBreakdownA.value.find(c => c.id === catId)
    const b = catBreakdownB.value.find(c => c.id === catId)
    return {
      id: catId,
      name: a?.name || b?.name || 'Lainnya',
      icon: a?.icon || b?.icon || '📦',
      color: a?.color || b?.color || 'neutral',
      amountA: a?.amount || 0,
      amountB: b?.amount || 0,
      change: pctChange(b?.amount || 0, a?.amount || 0),
      // Subcategories
      subcategories: mergeSubcategories(a?.subcategories || [], b?.subcategories || [])
    }
  }).sort((a, b) => Math.max(b.amountA, b.amountB) - Math.max(a.amountA, a.amountB))
})

function mergeSubcategories(subsA: any[], subsB: any[]) {
  const allIds = new Set([...subsA.map(s => s.id), ...subsB.map(s => s.id)])
  return [...allIds].map(subId => {
    const a = subsA.find(s => s.id === subId)
    const b = subsB.find(s => s.id === subId)
    return {
      id: subId,
      name: a?.name || b?.name || 'Lainnya',
      icon: a?.icon || b?.icon || '📎',
      amountA: a?.amount || 0,
      amountB: b?.amount || 0,
      change: pctChange(b?.amount || 0, a?.amount || 0)
    }
  }).sort((a, b) => Math.max(b.amountA, b.amountB) - Math.max(a.amountA, a.amountB))
}

// Auto insights
const insights = computed(() =>
  generateComparisonInsights(
    txA.value, txB.value,
    props.categories as TransactionCategory[],
    props.subcategories as TransactionSubcategory[],
    rangeA.value.label, rangeB.value.label
  )
)

// Bar chart: category comparison
const colorMode = useColorMode()

const barSeries = computed(() => [
  { name: rangeA.value.label, data: categoryComparison.value.slice(0, 10).map(c => c.amountA) },
  { name: rangeB.value.label, data: categoryComparison.value.slice(0, 10).map(c => c.amountB) }
])

const barOptions = computed(() => ({
  chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
  colors: ['#94a3b8', '#6366f1'],
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: categoryComparison.value.slice(0, 10).map(c => c.name),
    axisBorder: { show: false }, axisTicks: { show: false },
    labels: { style: { colors: '#9ca3af', fontSize: '11px' } }
  },
  yaxis: {
    labels: { formatter: (val: number) => formatCompact(val), style: { colors: '#9ca3af', fontSize: '12px' } }
  },
  grid: { strokeDashArray: 4, borderColor: colorMode.value === 'dark' ? '#374151' : '#e5e7eb' },
  legend: { position: 'top' as const, horizontalAlign: 'right' as const, labels: { colors: colorMode.value === 'dark' ? '#e5e7eb' : '#374151' } },
  tooltip: { theme: colorMode.value, y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } },
  theme: { mode: colorMode.value as 'light' | 'dark' }
}))

// Expandable categories
const expandedCompare = ref<number | null | undefined>(undefined)
const toggleCompare = (catId: number | null) => {
  expandedCompare.value = expandedCompare.value === catId ? undefined : catId
}
</script>

<template>
  <div class="space-y-4">
    <!-- Month Pickers -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Month A -->
        <div>
          <p class="text-xs text-gray-500 mb-2">Bulan Pertama</p>
          <div class="flex gap-2">
            <select v-model="monthAMonth" class="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="(label, idx) in monthLabels" :key="idx" :value="idx">{{ label }}</option>
            </select>
            <select v-model="monthAYear" class="w-24 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>
        <!-- Month B -->
        <div>
          <p class="text-xs text-gray-500 mb-2">Bulan Kedua</p>
          <div class="flex gap-2">
            <select v-model="monthBMonth" class="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="(label, idx) in monthLabels" :key="idx" :value="idx">{{ label }}</option>
            </select>
            <select v-model="monthBYear" class="w-24 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Side-by-side Summary -->
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <p class="text-xs text-gray-400 mb-1">{{ rangeA.label }}</p>
        <div class="space-y-2">
          <div>
            <span class="text-[10px] text-green-500">Pemasukan</span>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalsA.income, 'IDR') }}</p>
          </div>
          <div>
            <span class="text-[10px] text-red-500">Pengeluaran</span>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalsA.expense, 'IDR') }}</p>
          </div>
          <div class="border-t border-gray-100 dark:border-gray-800 pt-1.5">
            <span class="text-[10px] text-gray-400">Transaksi</span>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ totalsA.txCount }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <p class="text-xs text-gray-400 mb-1">{{ rangeB.label }}</p>
        <div class="space-y-2">
          <div>
            <span class="text-[10px] text-green-500">Pemasukan</span>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalsB.income, 'IDR') }}</p>
          </div>
          <div>
            <span class="text-[10px] text-red-500">Pengeluaran</span>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalsB.expense, 'IDR') }}</p>
          </div>
          <div class="border-t border-gray-100 dark:border-gray-800 pt-1.5">
            <span class="text-[10px] text-gray-400">Transaksi</span>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ totalsB.txCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto-Generated Insights -->
    <div v-if="insights.length > 0" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <p class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
        <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-amber-500" /> Insight Otomatis
      </p>
      <div class="space-y-2">
        <div v-for="(insight, i) in insights" :key="i" class="flex items-start gap-2 py-1.5">
          <span class="text-sm shrink-0">{{ insight.icon }}</span>
          <p class="text-sm" :class="insight.type === 'up' ? 'text-red-600 dark:text-red-400' : insight.type === 'down' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'">
            {{ insight.text }}
          </p>
        </div>
      </div>
    </div>
    <div v-else class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 text-center text-sm text-gray-400">
      Tidak ada perubahan signifikan antara kedua periode.
    </div>

    <!-- Category Comparison Bar Chart -->
    <div v-if="categoryComparison.length > 0" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-3">Perbandingan Pengeluaran per Kategori</p>
      <ClientOnly>
        <apexchart type="bar" height="300" :options="barOptions" :series="barSeries" />
        <template #fallback>
          <div class="h-[300px] flex items-center justify-center text-sm text-gray-500">Memuat grafik...</div>
        </template>
      </ClientOnly>
    </div>

    <!-- Category + Subcategory Comparison Table -->
    <div v-if="categoryComparison.length > 0" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p class="text-sm font-medium text-gray-900 dark:text-white">Detail per Kategori & Sub-Kategori</p>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="cat in categoryComparison" :key="cat.id ?? 'uncategorized'">
          <!-- Category row -->
          <div class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer" @click="toggleCompare(cat.id)">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm shrink-0">{{ cat.icon }}</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ cat.name }}</span>
            </div>
            <div class="flex items-center gap-4 shrink-0 text-xs">
              <span class="text-gray-500 w-20 text-right">{{ formatCompact(cat.amountA) }}</span>
              <span class="text-gray-900 dark:text-white font-semibold w-20 text-right">{{ formatCompact(cat.amountB) }}</span>
              <span v-if="cat.change !== null" class="font-semibold px-1.5 py-0.5 rounded-full w-16 text-center"
                :class="cat.change <= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'">
                {{ cat.change > 0 ? '+' : '' }}{{ cat.change }}%
              </span>
              <span v-else class="w-16 text-center text-gray-400">-</span>
              <UIcon :name="expandedCompare === cat.id ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <!-- Subcategory rows -->
          <div v-if="expandedCompare === cat.id && cat.subcategories.length > 0" class="bg-gray-50 dark:bg-gray-800/30">
            <div v-for="sub in cat.subcategories" :key="sub.id ?? 'uncategorized'" class="flex items-center justify-between px-4 py-2 pl-10 border-t border-gray-100 dark:border-gray-800/50">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xs shrink-0">{{ sub.icon }}</span>
                <span class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ sub.name }}</span>
              </div>
              <div class="flex items-center gap-4 shrink-0 text-xs">
                <span class="text-gray-400 w-20 text-right">{{ formatCompact(sub.amountA) }}</span>
                <span class="text-gray-700 dark:text-gray-300 font-medium w-20 text-right">{{ formatCompact(sub.amountB) }}</span>
                <span v-if="sub.change !== null" class="font-semibold px-1.5 py-0.5 rounded-full w-16 text-center"
                  :class="sub.change <= 0 ? 'bg-green-100/60 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100/60 text-red-700 dark:bg-red-900/20 dark:text-red-400'">
                  {{ sub.change > 0 ? '+' : '' }}{{ sub.change }}%
                </span>
                <span v-else class="w-16 text-center text-gray-400">-</span>
                <span class="w-4"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Legend header -->
      <div class="flex items-center justify-end gap-4 px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-800">
        <span>{{ rangeA.label }}</span>
        <span class="font-semibold">{{ rangeB.label }}</span>
        <span>Perubahan</span>
        <span class="w-4"></span>
      </div>
    </div>
  </div>
</template>
