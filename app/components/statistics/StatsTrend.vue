<script setup lang="ts">
import { getTag, formatCompact } from '#imports'

const props = defineProps<{
  filteredTx: readonly any[]
}>()

const monthlyTrend = computed(() => {
  const map = new Map<string, { income: number; expense: number; label: string }>()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

  props.filteredTx.forEach(tx => {
    const d = new Date(Number(tx.timestamp.microsSinceUnixEpoch / 1000n))
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    const label = `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
    if (!map.has(key)) map.set(key, { income: 0, expense: 0, label })
    const entry = map.get(key)!
    const tag = getTag(tx.type)
    if (tag === 'income') entry.income += Number(tx.amount)
    else if (tag === 'expense') entry.expense += Number(tx.amount)
  })

  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  return sorted.map(([, v]) => v)
})

const series = computed(() => [
  { name: 'Pemasukan', data: monthlyTrend.value.map(m => m.income) },
  { name: 'Pengeluaran', data: monthlyTrend.value.map(m => m.expense) }
])

import { getHexColor } from '#imports'

const colorMode = useColorMode()

const chartOptions = computed(() => {
  return {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    colors: [getHexColor('green'), getHexColor('red')],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: monthlyTrend.value.map(m => m.label),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#9ca3af', fontSize: '12px' } }
    },
    yaxis: {
      labels: { formatter: (val: number) => formatCompact(val), style: { colors: '#9ca3af', fontSize: '12px' } }
    },
    grid: { strokeDashArray: 4, borderColor: colorMode.value === 'dark' ? '#374151' : '#e5e7eb' },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: colorMode.value === 'dark' ? '#e5e7eb' : '#374151' } },
    tooltip: { 
      theme: colorMode.value,
      y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } 
    },
    theme: { mode: colorMode.value as 'light' | 'dark' }
  }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
    <div v-if="monthlyTrend.length === 0" class="text-center py-12 text-sm text-gray-500">Belum ada data.</div>
    <div v-else>
      <ClientOnly>
        <apexchart type="bar" height="300" :options="chartOptions" :series="series" />
        <template #fallback>
          <div class="h-[300px] flex items-center justify-center text-sm text-gray-500">Memuat grafik...</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
