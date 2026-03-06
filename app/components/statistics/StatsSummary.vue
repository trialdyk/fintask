<script setup lang="ts">
import { getTag, formatCompact, formatCurrency } from '#imports'

const props = defineProps<{
  filteredTx: readonly any[]
  daysInPeriod: number
}>()

const totalIncome = computed(() =>
  props.filteredTx.filter(tx => getTag(tx.type) === 'income').reduce((s, tx) => s + Number(tx.amount), 0)
)
const totalExpense = computed(() =>
  props.filteredTx.filter(tx => getTag(tx.type) === 'expense').reduce((s, tx) => s + Number(tx.amount), 0)
)
const netFlow = computed(() => totalIncome.value - totalExpense.value)
const txCount = computed(() => props.filteredTx.length)
const avgDailyExpense = computed(() => Math.round(totalExpense.value / props.daysInPeriod))
const avgDailyIncome = computed(() => Math.round(totalIncome.value / props.daysInPeriod))
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-1.5 mb-1">
          <div class="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-3.5 h-3.5 text-green-500" />
          </div>
          <span class="text-xs text-gray-500">Pemasukan</span>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white truncate">{{ formatCurrency(totalIncome, 'IDR') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">~{{ formatCompact(avgDailyIncome) }}/hari</p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-1.5 mb-1">
          <div class="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-3.5 h-3.5 text-red-500" />
          </div>
          <span class="text-xs text-gray-500">Pengeluaran</span>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white truncate">{{ formatCurrency(totalExpense, 'IDR') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">~{{ formatCompact(avgDailyExpense) }}/hari</p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-1.5 mb-1">
          <div class="w-6 h-6 rounded-full flex items-center justify-center" :class="netFlow >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'">
            <UIcon name="i-heroicons-scale" class="w-3.5 h-3.5" :class="netFlow >= 0 ? 'text-blue-500' : 'text-orange-500'" />
          </div>
          <span class="text-xs text-gray-500">Arus Kas</span>
        </div>
        <p class="text-lg font-bold truncate" :class="netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'">
          {{ netFlow >= 0 ? '+' : '' }}{{ formatCurrency(netFlow, 'IDR') }}
        </p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-1.5 mb-1">
          <div class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5 text-purple-500" />
          </div>
          <span class="text-xs text-gray-500">Transaksi</span>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white">{{ txCount }}</p>
        <p class="text-xs text-gray-400 mt-0.5">dalam {{ daysInPeriod }} hari</p>
      </div>
    </div>

    <!-- Ratio bar -->
    <div v-if="totalIncome > 0 || totalExpense > 0" class="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
      <p class="text-xs text-gray-500 mb-2">Rasio Pemasukan vs Pengeluaran</p>
      <div class="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <div class="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 flex items-center justify-center"
          :style="{ width: `${(totalIncome / Math.max(totalIncome + totalExpense, 1)) * 100}%` }">
          <span v-if="totalIncome > 0" class="text-[10px] font-bold text-white">{{ Math.round((totalIncome / (totalIncome + totalExpense)) * 100) }}%</span>
        </div>
        <div class="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 flex items-center justify-center"
          :style="{ width: `${(totalExpense / Math.max(totalIncome + totalExpense, 1)) * 100}%` }">
          <span v-if="totalExpense > 0" class="text-[10px] font-bold text-white">{{ Math.round((totalExpense / (totalIncome + totalExpense)) * 100) }}%</span>
        </div>
      </div>
      <div class="flex justify-between mt-1.5 text-xs text-gray-500">
        <div class="flex items-center gap-1"><div class="w-2 h-2 bg-green-500 rounded-full" /> Pemasukan</div>
        <div class="flex items-center gap-1"><div class="w-2 h-2 bg-red-500 rounded-full" /> Pengeluaran</div>
      </div>
    </div>
  </div>
</template>
