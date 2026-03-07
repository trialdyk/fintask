<script setup lang="ts">
import type { Transaction, TransactionCategory, TransactionSubcategory } from '~/types/database.types'
import { formatCurrency } from '~/utils/currency'
import { type MonthRange, type CategoryStat, filterTxByRange, computeAverages, pctChange } from '~/composables/useInsights'

const { formatCompact, getHexColor, getLocalDateString } = useHelpers()
const { getCategoryBreakdown } = useInsights()

const props = defineProps<{
  filteredTx: readonly Transaction[]
  allTx: readonly Transaction[]
  categories: readonly TransactionCategory[] | null
  subcategories: readonly TransactionSubcategory[]
  currentRange: MonthRange
  prevRange: MonthRange
}>()

const categoryTab = ref<'expense' | 'income'>('expense')
const expandedCatId = ref<number | null | undefined>(undefined) // which category is expanded

const categoryBreakdown = computed(() => {
  const prevTxs = filterTxByRange(props.allTx as Transaction[], props.prevRange)
  return getCategoryBreakdown(
    props.filteredTx as Transaction[],
    prevTxs,
    categoryTab.value,
    props.currentRange.daysInMonth,
    props.categories as TransactionCategory[],
    props.subcategories as TransactionSubcategory[]
  )
})

const toggleExpand = (catId: number | null) => {
  expandedCatId.value = expandedCatId.value === catId ? undefined : catId
}

// Donut chart for categories
const donutSeries = computed(() => categoryBreakdown.value.map(c => c.amount))
const colorMode = useColorMode()

const donutOptions = computed(() => ({
  chart: { type: 'donut' as const, fontFamily: 'inherit', background: 'transparent' },
  labels: categoryBreakdown.value.map(c => c.name),
  colors: categoryBreakdown.value.map(c => getHexColor(c.color)),
  dataLabels: { enabled: false },
  legend: { show: false },
  stroke: { show: true, width: 2, colors: [colorMode.value === 'dark' ? '#111827' : '#ffffff'] },
  tooltip: { theme: colorMode.value, y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } },
  theme: { mode: colorMode.value as 'light' | 'dark' },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          name: { show: true, fontSize: '12px', color: '#9ca3af' },
          value: { show: true, fontSize: '20px', fontWeight: 700, formatter: (val: number) => formatCompact(Number(val)) },
          total: {
            show: true, label: 'Total',
            formatter: (w: any) => formatCompact(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0))
          }
        }
      }
    }
  }
}))

// Subcategory donut for expanded category
const subDonutSeries = computed(() => {
  const cat = categoryBreakdown.value.find(c => c.id === expandedCatId.value)
  return cat?.subcategories.map(s => s.amount) || []
})

const subDonutOptions = computed(() => {
  const cat = categoryBreakdown.value.find(c => c.id === expandedCatId.value)
  const subs = cat?.subcategories || []
  return {
    chart: { type: 'donut' as const, fontFamily: 'inherit', background: 'transparent' },
    labels: subs.map(s => s.name),
    colors: subs.map((_, i) => {
      const base = getHexColor(cat?.color || 'neutral')
      // Vary lightness slightly per sub
      const hueShift = i * 35
      return `hsl(${parseInt(base.slice(1, 3), 16) + hueShift}, 60%, ${55 + i * 5}%)`
    }),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: true, width: 2, colors: [colorMode.value === 'dark' ? '#111827' : '#ffffff'] },
    tooltip: { theme: colorMode.value, y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } },
    theme: { mode: colorMode.value as 'light' | 'dark' },
    plotOptions: { pie: { donut: { size: '70%' } } }
  }
})

const buildCategoryHistoryLink = (catId: number | null) => {
  const from = getLocalDateString(props.currentRange.start)
  const to = getLocalDateString(props.currentRange.end)
  return `/dashboard/history?type=${categoryTab.value}&category=${catId || ''}&dateFrom=${from}&dateTo=${to}`
}
</script>

<template>
  <div class="space-y-3">
    <!-- Toggle income/expense -->
    <div class="flex items-center justify-between">
      <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button @click="categoryTab = 'expense'; expandedCatId = undefined" class="px-3 py-1 text-xs rounded-md font-medium transition-all" :class="categoryTab === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600 dark:text-red-400' : 'text-gray-500'">Pengeluaran</button>
        <button @click="categoryTab = 'income'; expandedCatId = undefined" class="px-3 py-1 text-xs rounded-md font-medium transition-all" :class="categoryTab === 'income' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500'">Pemasukan</button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div v-if="categoryBreakdown.length === 0" class="text-center py-8 text-sm text-gray-500">Belum ada data.</div>

      <div v-else>
        <!-- Main donut chart -->
        <div class="flex justify-center mb-6">
          <ClientOnly>
            <apexchart type="donut" width="300" :options="donutOptions" :series="donutSeries" />
            <template #fallback>
              <div class="w-[300px] h-[300px] flex items-center justify-center text-sm text-gray-500">Memuat grafik...</div>
            </template>
          </ClientOnly>
        </div>

        <!-- Category list -->
        <div class="space-y-2">
          <div v-for="cat in categoryBreakdown" :key="cat.id ?? 'uncategorized'">
            <!-- Category row -->
            <div
              class="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="toggleExpand(cat.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-lg shrink-0">{{ cat.icon }}</span>
                  <div class="min-w-0">
                    <span class="text-sm text-gray-700 dark:text-gray-300 font-medium truncate block">{{ cat.name }}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-xs text-gray-500">{{ cat.percent }}%</span>
                      <span v-if="cat.pctChange !== null" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        :class="(categoryTab === 'income' ? cat.pctChange >= 0 : cat.pctChange <= 0)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'"
                      >
                        {{ cat.pctChange >= 0 ? '↑' : '↓' }}{{ Math.abs(cat.pctChange) }}%
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCompact(cat.amount) }}</span>
                  <UIcon :name="expandedCatId === cat.id ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <!-- Progress bar -->
              <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
                <div class="h-full rounded-full transition-all duration-500" :style="{ width: `${cat.percent}%`, backgroundColor: getHexColor(cat.color) }" />
              </div>
            </div>

            <!-- Expanded subcategory panel -->
            <div v-if="expandedCatId === cat.id" class="ml-4 mt-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-4">
              <!-- Subcategory donut -->
              <div v-if="cat.subcategories.length > 1" class="flex justify-center">
                <ClientOnly>
                  <apexchart type="donut" width="200" :options="subDonutOptions" :series="subDonutSeries" />
                  <template #fallback>
                    <div class="w-[200px] h-[200px] flex items-center justify-center text-sm text-gray-500">...</div>
                  </template>
                </ClientOnly>
              </div>

              <!-- Subcategory list -->
              <div class="space-y-2">
                <div v-for="sub in cat.subcategories" :key="sub.id ?? 'uncategorized'" class="flex items-center justify-between py-1.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm shrink-0">{{ sub.icon }}</span>
                    <div class="min-w-0">
                      <span class="text-xs text-gray-700 dark:text-gray-300 font-medium truncate block">{{ sub.name }}</span>
                      <span v-if="sub.pctChange !== null" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        :class="(categoryTab === 'income' ? sub.pctChange >= 0 : sub.pctChange <= 0)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'"
                      >
                        {{ sub.pctChange >= 0 ? '↑' : '↓' }}{{ Math.abs(sub.pctChange) }}%
                      </span>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-xs font-bold text-gray-900 dark:text-white block">{{ formatCompact(sub.amount) }}</span>
                    <span class="text-[10px] text-gray-400">{{ sub.percent }}%</span>
                  </div>
                </div>
              </div>

              <!-- Averages table for this category -->
              <div class="overflow-x-auto border-t border-gray-200 dark:border-gray-700 pt-3">
                <p class="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider">Rata-rata {{ cat.name }}</p>
                <div class="flex gap-4 text-xs">
                  <div><span class="text-gray-400">Harian</span> <span class="font-mono font-semibold text-gray-900 dark:text-white ml-1">{{ formatCompact(cat.avgDaily) }}</span></div>
                  <div><span class="text-gray-400">Bulanan</span> <span class="font-mono font-semibold text-gray-900 dark:text-white ml-1">{{ formatCompact(cat.avgMonthly) }}</span></div>
                </div>
              </div>

              <!-- Drill down -->
              <NuxtLink :to="buildCategoryHistoryLink(cat.id)" class="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1">
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                Lihat riwayat {{ cat.name }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
