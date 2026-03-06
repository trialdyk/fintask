<script setup lang="ts">
import { ref } from 'vue'
import type { TabsItem } from '@nuxt/ui'
import { useStatisticsData, type Period } from '~/composables/useStatistics'

useHead({ title: 'Statistik Keuangan' })

// Period filter state
const selectedPeriod = ref<Period>('1m')
const today = new Date()
const customStart = ref<string>(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10))
const customEnd = ref<string>(today.toISOString().substring(0, 10))

const periodOptions: { label: string; value: Period }[] = [
  { label: 'Bulan Ini', value: '1m' },
  { label: 'Bulan Lalu', value: '2m' },
  { label: '3 Bulan', value: '3m' },
  { label: '6 Bulan', value: '6m' },
  { label: '1 Tahun', value: '1y' },
  { label: 'Kustom', value: 'custom' },
]

// Shared data
const { wallets, categories, filteredTx, daysInPeriod } = useStatisticsData(selectedPeriod, customStart, customEnd)

// Tabs
const activeTab = ref<string | number>('ringkasan')

const tabItems: TabsItem[] = [
  { label: 'Ringkasan', icon: 'i-heroicons-squares-2x2', slot: 'ringkasan' },
  { label: 'Tren', icon: 'i-heroicons-chart-bar', slot: 'tren' },
  { label: 'Kategori', icon: 'i-heroicons-rectangle-group', slot: 'kategori' },
  { label: 'Top', icon: 'i-heroicons-trophy', slot: 'top' },
  { label: 'Dompet', icon: 'i-heroicons-wallet', slot: 'dompet' },
]
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col" style="min-height: calc(100vh - 80px)">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>
    </div>

    <!-- Period Selector -->
    <div class="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
      <button
        v-for="opt in periodOptions"
        :key="opt.value"
        @click="selectedPeriod = opt.value"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
        :class="selectedPeriod === opt.value
          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Custom date range -->
    <div v-if="selectedPeriod === 'custom'" class="flex flex-wrap items-center gap-2 mt-2 px-1">
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-500">Dari</label>
        <input v-model="customStart" type="date" class="px-2.5 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-500">Sampai</label>
        <input v-model="customEnd" type="date" class="px-2.5 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
    </div>

    <!-- Nuxt UI Tabs -->
    <UTabs
      :items="tabItems"
      variant="pill"
      size="sm"
      color="primary"
      class="mt-3"
      :ui="{
        list: 'overflow-x-auto scrollbar-hide mb-4',
        trigger: 'shrink-0'
      }"
    >
      <template #ringkasan>
        <div class="px-1">
          <StatisticsStatsSummary :filtered-tx="filteredTx" :days-in-period="daysInPeriod" />
        </div>
      </template>

      <template #tren>
        <div class="px-1">
          <StatisticsStatsTrend :filtered-tx="filteredTx" />
        </div>
      </template>

      <template #kategori>
        <div class="px-1">
          <StatisticsStatsCategory :filtered-tx="filteredTx" :categories="categories" />
        </div>
      </template>

      <template #top>
        <div class="px-1">
          <StatisticsStatsTopTransactions :filtered-tx="filteredTx" :categories="categories" />
        </div>
      </template>

      <template #dompet>
        <div class="px-1">
          <StatisticsStatsWallet :filtered-tx="filteredTx" :wallets="wallets" />
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
