<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { buildMonthRange, type MonthRange } from '~/composables/useInsights'

useHead({ title: 'Insight Keuangan' })

const { transactions, wallets, categories, subcategories, getPrevMonthRange, getSameMonthLastYear } = useInsights()

// Month selector
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth())
const monthLabels = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const yearOptions = Array.from({ length: now.getFullYear() - 2020 + 2 }, (_, i) => 2020 + i)

const currentRange = computed<MonthRange>(() => buildMonthRange(selectedYear.value, selectedMonth.value))
const prevRange = computed<MonthRange>(() => getPrevMonthRange(currentRange.value))
const yearAgoRange = computed<MonthRange>(() => getSameMonthLastYear(currentRange.value))

// Filtered transactions for the current month
const filteredTx = computed(() =>
  transactions.value.filter(tx => {
    const d = new Date(tx.timestamp)
    return d >= currentRange.value.start && d <= currentRange.value.end
  })
)

// Tabs
const tabItems: TabsItem[] = [
  { label: 'Ringkasan', icon: 'i-heroicons-squares-2x2', slot: 'ringkasan' },
  { label: 'Tren', icon: 'i-heroicons-chart-bar', slot: 'tren' },
  { label: 'Kategori', icon: 'i-heroicons-rectangle-group', slot: 'kategori' },
  { label: 'Perbandingan', icon: 'i-heroicons-arrows-right-left', slot: 'perbandingan' },
  { label: 'Dompet', icon: 'i-heroicons-wallet', slot: 'dompet' },
]
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col" style="min-height: calc(100vh - 80px)">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Insight Keuangan</h1>
    </div>

    <!-- Month Selector -->
    <div class="flex items-center gap-2 px-1 mb-3">
      <select v-model="selectedMonth" class="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
        <option v-for="(label, idx) in monthLabels" :key="idx" :value="idx">{{ label }}</option>
      </select>
      <select v-model="selectedYear" class="w-24 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <!-- Tabs -->
    <UTabs
      :items="tabItems"
      variant="pill"
      size="sm"
      color="primary"
      :ui="{
        list: 'overflow-x-auto scrollbar-hide mb-4',
        trigger: 'shrink-0'
      }"
    >
      <template #ringkasan>
        <div class="px-1">
          <StatisticsStatsSummary
            :filtered-tx="filteredTx"
            :all-tx="transactions"
            :current-range="currentRange"
            :prev-range="prevRange"
            :year-ago-range="yearAgoRange"
          />
        </div>
      </template>

      <template #tren>
        <div class="px-1">
          <StatisticsStatsTrend :filtered-tx="filteredTx" />
        </div>
      </template>

      <template #kategori>
        <div class="px-1">
          <StatisticsStatsCategory
            :filtered-tx="filteredTx"
            :all-tx="transactions"
            :categories="categories"
            :subcategories="subcategories"
            :current-range="currentRange"
            :prev-range="prevRange"
          />
        </div>
      </template>



      <template #perbandingan>
        <div class="px-1">
          <InsightsInsightCompare
            :all-tx="transactions"
            :categories="categories"
            :subcategories="subcategories"
          />
        </div>
      </template>

      <template #dompet>
        <div class="px-1">
          <StatisticsStatsWallet
            :filtered-tx="filteredTx"
            :all-tx="transactions"
            :wallets="wallets"
            :categories="categories"
            :current-range="currentRange"
            :prev-range="prevRange"
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
