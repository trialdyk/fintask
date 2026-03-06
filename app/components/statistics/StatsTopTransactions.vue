<script setup lang="ts">
import { getTag, formatCompact, formatDateShort, formatCurrency } from '#imports'

const props = defineProps<{
  filteredTx: readonly any[]
  categories: readonly any[] | null
}>()

const topTransactions = computed(() => {
  return props.filteredTx
    .filter(tx => getTag(tx.type) === 'expense' || getTag(tx.type) === 'income')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 10)
})

const getCategoryName = (catId?: bigint) => {
  if (!catId || !props.categories) return 'Lainnya'
  return props.categories.find(c => c.id === catId)?.name || 'Lainnya'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
    <div v-if="topTransactions.length === 0" class="text-center py-12 text-sm text-gray-500">Belum ada transaksi.</div>
    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <div v-for="(tx, i) in topTransactions" :key="tx.id.toString()" class="flex items-center gap-3 py-2.5">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          :class="getTag(tx.type) === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'">
          {{ i + 1 }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ tx.title }}</p>
          <p class="text-xs text-gray-500">{{ getCategoryName(tx.categoryId) }} · {{ formatDateShort(tx.timestamp) }}</p>
        </div>
        <p class="text-sm font-bold shrink-0" :class="getTag(tx.type) === 'income' ? 'text-green-600' : 'text-red-600'">
          {{ getTag(tx.type) === 'expense' ? '-' : '+' }}{{ formatCompact(Number(tx.amount)) }}
        </p>
      </div>
    </div>
  </div>
</template>
