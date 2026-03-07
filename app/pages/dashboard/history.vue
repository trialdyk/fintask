<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'
import type { Transaction } from '~/types/database.types'

useHead({ title: 'Riwayat Transaksi' })

const transactionsStore = useTransactionsStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const { getHexColor, getLocalDateString } = useHelpers()

// ─── Filters ──────────────────────────────────────────────────────────
const filterWallet = ref<number | undefined>(undefined)
const filterCategory = ref<number | undefined>(undefined)
const filterSubcategory = ref<number | undefined>(undefined)
const filterType = ref<string | undefined>(undefined)

const today = new Date()
const filterDateFrom = ref<string>(
  getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1))
)
const filterDateTo = ref<string>(getLocalDateString(today))

const searchQuery = ref('')

// ─── Read query params for drill-down from Insights ──────────────────
const route = useRoute()
onMounted(() => {
  const q = route.query
  if (q.type && typeof q.type === 'string') filterType.value = q.type
  if (q.wallet) filterWallet.value = Number(q.wallet)
  if (q.category) filterCategory.value = Number(q.category)
  if (q.dateFrom && typeof q.dateFrom === 'string') filterDateFrom.value = q.dateFrom
  if (q.dateTo && typeof q.dateTo === 'string') filterDateTo.value = q.dateTo
})

// Options for select menus
const walletOptions = computed(() =>
  walletsStore.items.map(w => ({ label: `${w.icon} ${w.name}`, value: w.id }))
)

const categoryOptions = computed(() =>
  categoriesStore.txCategories.map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))
)

const subcategoryOptions = computed(() => {
  if (!filterCategory.value) return []
  return categoriesStore.txSubcategories
    .filter(s => s.category_id === filterCategory.value)
    .map(s => ({ label: `${s.icon || '📎'} ${s.name}`, value: s.id }))
})

const typeOptions = [
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Koreksi', value: 'correction' }
]

// Reset subcategory when category changes
watch(filterCategory, () => {
  filterSubcategory.value = undefined
})

// ─── Filtered & Sorted Data ───────────────────────────────────────────
const filteredTransactions = computed(() => {
  let result = [...transactionsStore.items]

  // Date range
  const from = new Date(filterDateFrom.value + 'T00:00:00')
  const to = new Date(filterDateTo.value + 'T23:59:59')
  result = result.filter(tx => {
    const d = new Date(tx.timestamp)
    return d >= from && d <= to
  })

  // Wallet
  if (filterWallet.value) {
    result = result.filter(tx => tx.wallet_id === filterWallet.value)
  }

  // Type
  if (filterType.value) {
    result = result.filter(tx => tx.type === filterType.value)
  }

  // Category
  if (filterCategory.value) {
    result = result.filter(tx => tx.category_id === filterCategory.value)
  }

  // Subcategory
  if (filterSubcategory.value) {
    result = result.filter(tx => tx.subcategory_id === filterSubcategory.value)
  }

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(tx =>
      tx.title.toLowerCase().includes(q) || (tx.notes?.toLowerCase().includes(q))
    )
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return result
})

// ─── Pagination ───────────────────────────────────────────────────────
const page = ref(1)
const perPage = ref(15)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / perPage.value)))

// Reset page when filters change
watch([filterWallet, filterCategory, filterSubcategory, filterType, filterDateFrom, filterDateTo, searchQuery], () => {
  page.value = 1
})

const paginatedTransactions = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filteredTransactions.value.slice(start, start + perPage.value)
})

// ─── Helpers ──────────────────────────────────────────────────────────

const getWalletName = (id: number) => walletsStore.getById(id)?.name || '-'
const getWalletIcon = (id: number) => walletsStore.getById(id)?.icon || '💳'
const getCategoryName = (id?: number | null) => {
  if (!id) return '-'
  return categoriesStore.getTxCategoryById(id)?.name || '-'
}
const getSubcategoryName = (id?: number | null) => {
  if (!id) return '-'
  return categoriesStore.getTxSubcategoryById(id)?.name || '-'
}

const formatDate = (ts: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(ts))
}

const typeLabel = (type: string) => {
  const map: Record<string, { label: string; class: string }> = {
    income: { label: 'Masuk', class: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
    expense: { label: 'Keluar', class: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
    transfer: { label: 'Transfer', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    correction: { label: 'Koreksi', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' }
  }
  return map[type] || { label: type, class: 'text-gray-600 bg-gray-50' }
}

const amountDisplay = (tx: Transaction) => {
  const wallet = walletsStore.getById(tx.wallet_id)
  const currency = wallet?.currency || 'IDR'
  const prefix = tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''
  return prefix + formatCurrency(tx.amount, currency)
}

const amountColorClass = (type: string) => {
  if (type === 'income') return 'text-green-600 dark:text-green-400'
  if (type === 'expense') return 'text-red-600 dark:text-red-400'
  return 'text-gray-900 dark:text-white'
}

const clearFilters = () => {
  filterWallet.value = undefined
  filterCategory.value = undefined
  filterSubcategory.value = undefined
  filterType.value = undefined
  searchQuery.value = ''
  filterDateFrom.value = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1))
  filterDateTo.value = getLocalDateString(today)
}

const hasActiveFilters = computed(() =>
  !!filterWallet.value || !!filterCategory.value || !!filterSubcategory.value || !!filterType.value || !!searchQuery.value.trim()
)
</script>

<template>
  <div class="h-full flex flex-col space-y-4 max-w-7xl mx-auto w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ filteredTransactions.length }} transaksi ditemukan
        </p>
      </div>
    </div>

    <!-- Filters -->
    <UCard>
      <div class="space-y-3">
        <!-- Row 1: Search + Date Range -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari judul atau catatan..."
            class="w-full"
          />
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500 shrink-0">Dari</label>
            <input v-model="filterDateFrom" type="date" class="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500 shrink-0">Sampai</label>
            <input v-model="filterDateTo" type="date" class="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Row 2: Dropdowns -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <USelectMenu
            v-model="filterType"
            :items="typeOptions"
            value-key="value"
            label-key="label"
            placeholder="Semua Tipe"
            class="w-full"
          />
          <USelectMenu
            v-model="filterWallet"
            :items="walletOptions"
            value-key="value"
            label-key="label"
            placeholder="Semua Dompet"
            class="w-full"
          />
          <USelectMenu
            v-model="filterCategory"
            :items="categoryOptions"
            value-key="value"
            label-key="label"
            placeholder="Semua Kategori"
            class="w-full"
          />
          <USelectMenu
            v-model="filterSubcategory"
            :items="subcategoryOptions"
            value-key="value"
            label-key="label"
            placeholder="Semua Rincian"
            :disabled="!filterCategory"
            class="w-full"
          />
        </div>

        <!-- Clear filters -->
        <div v-if="hasActiveFilters" class="flex justify-end">
          <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-x-mark" label="Reset Filter" @click="clearFilters" />
        </div>
      </div>
    </UCard>

    <!-- Table -->
    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/60">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Judul</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tipe</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dompet</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kategori</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Rincian</th>
            <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nominal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="tx in paginatedTransactions"
            :key="tx.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {{ formatDate(tx.timestamp) }}
            </td>
            <td class="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-[200px] truncate">
              {{ tx.title }}
              <p v-if="tx.notes" class="text-xs text-gray-400 truncate mt-0.5">{{ tx.notes }}</p>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="typeLabel(tx.type).class">
                {{ typeLabel(tx.type).label }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
              <span class="inline-flex items-center gap-1">
                <span class="text-sm">{{ getWalletIcon(tx.wallet_id) }}</span>
                {{ getWalletName(tx.wallet_id) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {{ getCategoryName(tx.category_id) }}
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
              {{ getSubcategoryName(tx.subcategory_id) }}
            </td>
            <td class="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap" :class="amountColorClass(tx.type)">
              {{ amountDisplay(tx) }}
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="paginatedTransactions.length === 0">
            <td colspan="7" class="text-center py-16 text-gray-400 dark:text-gray-600">
              <UIcon name="i-heroicons-document-magnifying-glass" class="w-10 h-10 mx-auto mb-3" />
              <p class="text-sm">Tidak ada transaksi yang cocok dengan filter.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between py-2 px-1">
      <p class="text-xs text-gray-500">
        Halaman {{ page }} dari {{ totalPages }}
        <span class="hidden sm:inline">· {{ filteredTransactions.length }} total</span>
      </p>
      <div class="flex items-center gap-1.5">
        <UButton
          icon="i-heroicons-chevron-left"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="page <= 1"
          @click="page--"
        />
        <template v-for="p in totalPages" :key="p">
          <UButton
            v-if="p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)"
            size="xs"
            :color="p === page ? 'primary' : 'neutral'"
            :variant="p === page ? 'solid' : 'ghost'"
            :label="String(p)"
            @click="page = p"
          />
          <span
            v-else-if="p === page - 2 || p === page + 2"
            class="text-xs text-gray-400 px-1"
          >...</span>
        </template>
        <UButton
          icon="i-heroicons-chevron-right"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="page >= totalPages"
          @click="page++"
        />
      </div>
    </div>
  </div>
</template>
