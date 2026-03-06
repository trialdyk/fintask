<script setup lang="ts">
import { getTag, formatCompact, formatCurrency, getHexColor, getBadgeColorClasses } from '#imports'

const props = defineProps<{
  filteredTx: readonly any[]
  wallets: readonly any[] | null
}>()

const walletDistribution = computed(() => {
  const expenseTx = props.filteredTx.filter(tx => getTag(tx.type) === 'expense')
  const total = expenseTx.reduce((s, tx) => s + Number(tx.amount), 0)

  const map = new Map<string, { name: string; icon: string; color: string; currency: string; amount: number; count: number }>()

  expenseTx.forEach(tx => {
    const wId = tx.walletId.toString()
    if (!map.has(wId)) {
      const w = props.wallets?.find(w => w.id === tx.walletId)
      map.set(wId, {
        name: w?.name || 'Unknown',
        icon: w?.icon || '💳',
        color: w?.color || 'neutral',
        currency: w ? getTag(w.currency) || 'IDR' : 'IDR',
        amount: 0,
        count: 0,
      })
    }
    const entry = map.get(wId)!
    entry.amount += Number(tx.amount)
    entry.count++
  })

  return [...map.values()]
    .sort((a, b) => b.amount - a.amount)
    .map(entry => ({
      ...entry,
      percent: total > 0 ? Math.round((entry.amount / total) * 100) : 0,
    }))
})

const pieSeries = computed(() => walletDistribution.value.map(w => w.amount))

const colorMode = useColorMode()

const pieOptions = computed(() => {
  return {
    chart: { type: 'pie', fontFamily: 'inherit', background: 'transparent' },
    labels: walletDistribution.value.map(w => w.name),
    colors: walletDistribution.value.map(w => getHexColor(w.color)),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: true, width: 2, colors: [colorMode.value === 'dark' ? '#111827' : '#ffffff'] },
    tooltip: { 
      theme: colorMode.value,
      y: { formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}` } 
    },
    theme: { mode: colorMode.value as 'light' | 'dark' },
  }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
    <p class="text-xs text-gray-500 mb-3">Distribusi pengeluaran per dompet</p>

    <div v-if="walletDistribution.length === 0" class="text-center py-12 text-sm text-gray-500">Belum ada pengeluaran.</div>

    <div v-else>
      <div class="flex justify-center mb-6 mt-2">
        <ClientOnly>
          <apexchart type="pie" width="300" :options="pieOptions" :series="pieSeries" />
          <template #fallback>
            <div class="w-[300px] h-[300px] flex items-center justify-center text-sm text-gray-500">Memuat grafik...</div>
          </template>
        </ClientOnly>
      </div>

      <div class="space-y-3">
        <div v-for="w in walletDistribution" :key="w.name" class="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
               <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset transition-colors shrink-0" :class="getBadgeColorClasses(w.color)">
                  <span class="text-base leading-none">{{ w.icon }}</span>
                  <span class="truncate">{{ w.name }}</span>
               </span>
               <div class="min-w-0">
                  <p class="text-xs text-gray-500">{{ w.count }} transaksi ({{ w.percent }}%)</p>
               </div>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(w.amount, w.currency) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
