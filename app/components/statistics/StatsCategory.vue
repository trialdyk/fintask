<script setup lang="ts">
import { getTag, formatCompact, getHexColor } from '#imports'

const props = defineProps<{
  filteredTx: readonly any[]
  categories: readonly any[] | null
}>()

const categoryTab = ref<'expense' | 'income'>('expense')

const categoryBreakdown = computed(() => {
  const type = categoryTab.value
  const txOfType = props.filteredTx.filter(tx => getTag(tx.type) === type)
  const total = txOfType.reduce((s, tx) => s + Number(tx.amount), 0)

  const map = new Map<string, { id: string; name: string; icon: string; color: string; amount: number }>()

  txOfType.forEach(tx => {
    const catId = tx.categoryId?.toString() || 'uncategorized'
    if (!map.has(catId)) {
      const cat = props.categories?.find(c => c.id === tx.categoryId)
      map.set(catId, {
        id: catId,
        name: cat?.name || 'Lainnya',
        icon: cat?.icon || 'i-heroicons-tag',
        color: cat?.color || 'gray',
        amount: 0,
      })
    }
    map.get(catId)!.amount += Number(tx.amount)
  })

  return [...map.values()]
    .sort((a, b) => b.amount - a.amount)
    .map(entry => ({
      ...entry,
      percent: total > 0 ? Math.round((entry.amount / total) * 100) : 0,
    }))
})

// Category comparison removed as per user request

const donutSeries = computed(() => categoryBreakdown.value.map(c => c.amount))

const colorMode = useColorMode()

const donutOptions = computed(() => {
  return {
    chart: { type: 'donut', fontFamily: 'inherit', background: 'transparent' },
    labels: categoryBreakdown.value.map(c => c.name),
    colors: categoryBreakdown.value.map(c => getHexColor(c.color)),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: true, width: 2, colors: [colorMode.value === 'dark' ? '#111827' : '#ffffff'] }, // Match bg-gray-900 or bg-white
    tooltip: { 
      theme: colorMode.value,
      y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } 
    },
    theme: { mode: colorMode.value as 'light' | 'dark' },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', color: '#9ca3af' },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              formatter: (val: number) => formatCompact(Number(val))
            },
            total: {
              show: true,
              label: 'Total',
              formatter: function (w: any) {
                return formatCompact(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0))
              }
            }
          }
        }
      }
    }
  }
})
</script>

<template>
  <div class="space-y-3">
    <!-- Toggle income/expense -->
    <div class="flex items-center justify-between">
      <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button @click="categoryTab = 'expense'" class="px-3 py-1 text-xs rounded-md font-medium transition-all" :class="categoryTab === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600 dark:text-red-400' : 'text-gray-500'">Pengeluaran</button>
        <button @click="categoryTab = 'income'" class="px-3 py-1 text-xs rounded-md font-medium transition-all" :class="categoryTab === 'income' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500'">Pemasukan</button>
      </div>
    </div>

    <!-- Category list -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div v-if="categoryBreakdown.length === 0" class="text-center py-8 text-sm text-gray-500">Belum ada data.</div>

      <div v-else>
        <!-- Apexcharts Donut -->
        <div class="flex justify-center mb-6">
          <ClientOnly>
            <apexchart type="donut" width="300" :options="donutOptions" :series="donutSeries" />
            <template #fallback>
              <div class="w-[300px] h-[300px] flex items-center justify-center text-sm text-gray-500">Memuat grafik...</div>
            </template>
          </ClientOnly>
        </div>

        <div class="space-y-3 mt-4">
          <div v-for="cat in categoryBreakdown" :key="cat.id">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2 min-w-0">
                <UIcon :name="cat.icon" class="w-4 h-4 shrink-0" :style="{ color: getHexColor(cat.color) }" />
                <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ cat.name }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-gray-500">{{ cat.percent }}%</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatCompact(cat.amount) }}</span>
              </div>
            </div>
            <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1.5">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: `${cat.percent}%`, backgroundColor: getHexColor(cat.color) }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
