<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'
import type { TransactionType } from '~/types/database.types'

const toast = useAppToast()
const transactionsStore = useTransactionsStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const { getBadgeColorClasses } = useHelpers()

// -- SLIDEOVER & FORM STATE --
const isSlideoverOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)

const formState = ref({
    type: 'expense' as TransactionType,
    title: '',
    amount: 0,
    walletId: undefined as number | undefined,
    toWalletId: undefined as number | undefined,
    categoryId: undefined as number | undefined,
    subCategoryId: undefined as number | undefined,
    date: new Date().toISOString().substring(0, 10),
    notes: ''
})

// Options Mappings
const walletOptions = computed(() =>
    walletsStore.items.map(w => ({ name: `${w.icon} ${w.name}`, value: w.id }))
)

const categoryOptions = computed(() =>
    categoriesStore.txCategories.filter(c => c.type === formState.value.type).map(c => ({
        name: `${c.icon} ${c.name}`,
        value: c.id
    }))
)

const subcategoryOptions = computed(() => {
    if (!formState.value.categoryId) return []
    return categoriesStore.getSubcategoriesForCategory(formState.value.categoryId).map(s => ({
        name: s.icon ? `${s.icon} ${s.name}` : s.name,
        value: s.id
    }))
})

const openQuickAdd = (type: TransactionType = 'expense') => {
    formMode.value = 'create'
    editingId.value = null
    formState.value = {
        type,
        title: '',
        amount: 0,
        walletId: walletsStore.items.length > 0 ? walletsStore.items[0]?.id : undefined,
        toWalletId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
        date: new Date().toISOString().substring(0, 10),
        notes: ''
    }
    isSlideoverOpen.value = true
}

const saving = ref(false)
const deleting = ref(false)

const handleSave = async () => {
    if (!formState.value.title) return toast.error('Gagal', 'Judul transaksi harus diisi')
    if (formState.value.amount <= 0) return toast.error('Gagal', 'Nominal harus lebih dari 0')
    if (!formState.value.walletId) return toast.error('Gagal', 'Dompet asal harus dipilih')

    if (formState.value.type === 'transfer') {
        if (!formState.value.toWalletId) return toast.error('Gagal', 'Dompet tujuan harus dipilih')
        if (formState.value.walletId === formState.value.toWalletId) return toast.error('Gagal', 'Dompet asal dan tujuan tidak boleh sama')
    }

    saving.value = true
    try {
        await transactionsStore.create({
            title: formState.value.title,
            type: formState.value.type,
            amount: formState.value.amount,
            timestamp: new Date(formState.value.date).toISOString(),
            wallet_id: formState.value.walletId!,
            category_id: formState.value.categoryId || null,
            subcategory_id: formState.value.subCategoryId || null,
            notes: formState.value.notes || null,
            tags: []
        })
        toast.success('Berhasil', 'Transaksi ditambahkan')
        isSlideoverOpen.value = false
        await walletsStore.refresh()
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        saving.value = false
    }
}

const isDeleteTxModalOpen = ref(false)
const txToDelete = ref<number | null>(null)

const confirmDeleteTransaction = (id: number) => {
    txToDelete.value = id
    isDeleteTxModalOpen.value = true
}

const executeDeleteTransaction = async () => {
    if (txToDelete.value === null) return
    deleting.value = true
    try {
        await transactionsStore.remove(txToDelete.value)
        toast.success('Berhasil', 'Transaksi dihapus & saldo dikoreksi')
        await walletsStore.refresh()
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        deleting.value = false
        isDeleteTxModalOpen.value = false
        txToDelete.value = null
    }
}

// ─── Balance check ────────────────────────────────────────────────────
const selectedWallet = computed(() => formState.value.walletId ? walletsStore.getById(formState.value.walletId) : null)
const isInsufficientBalance = computed(() => {
    if (!selectedWallet.value) return false
    if (formState.value.type !== 'expense' && formState.value.type !== 'transfer') return false
    return formState.value.amount > selectedWallet.value.balance
})

const getWallet = (id?: number | null) => walletsStore.getById(id ?? undefined)
const getCategory = (id?: number | null) => categoriesStore.getTxCategoryById(id)
const getSubcategory = (id?: number | null) => categoriesStore.getTxSubcategoryById(id)

const groupedTransactions = computed(() => {
    const visibleTxs = transactionsStore.items.filter(tx => {
        if (tx.type === 'income' && tx.linked_transaction_id) return false 
        return true
    })

    const grouped: Record<string, typeof visibleTxs> = {}
    
    visibleTxs.forEach(tx => {
        const d = new Date(tx.timestamp)
        const dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        if (!grouped[dateStr]) grouped[dateStr] = []
        grouped[dateStr].push(tx)
    })
    
    return grouped
})

</script>

<template>
    <div class="h-full flex flex-col space-y-4 max-w-5xl mx-auto w-full">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Transaksi Keuangan</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Catat dan pantau seluruh pergerakan uang Anda.</p>
            </div>
            <UButton icon="i-heroicons-plus" label="Transaksi Baru" color="primary" @click="openQuickAdd('expense')" size="lg" class="shadow-md" />
        </div>

        <!-- Initial Setup Warning -->
        <UAlert 
            v-if="!transactionsStore.loading && walletsStore.items.length === 0"
            color="warning"
            variant="soft"
            title="Belum ada Dompet"
            description="Anda harus membuat minimal satu Dompet terlebih dahulu sebelum bisa mencatat transaksi."
            icon="i-heroicons-exclamation-triangle"
            :actions="[{ label: 'Atur Dompet', to: '/dashboard/settings/wallets' }]"
        />

        <UAlert 
            v-if="!transactionsStore.loading && walletsStore.items.length > 0 && categoriesStore.txCategories.length === 0"
            color="info"
            variant="soft"
            title="Belum ada Kategori"
            description="Sebaiknya Anda mengatur Kategori Transaksi terlebih dahulu agar laporan bisa lebih rapi."
            icon="i-heroicons-information-circle"
            :actions="[{ label: 'Kategori', to: '/dashboard/settings/transaction-categories' }]"
        />

        <!-- Loading State -->
        <div v-if="transactionsStore.loading" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat data...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="transactionsStore.items.length === 0" class="text-center py-16">
            <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <h3 class="text-xl font-medium text-gray-900 dark:text-white">Buku Catatan Kosong</h3>
            <p class="mt-2 text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Mulai catat setiap pengeluaran dan pemasukan untuk mengontrol keuangan yang lebih sehat.</p>
            <UButton v-if="walletsStore.items.length > 0" label="Catat Sekarang" size="lg" icon="i-heroicons-pencil-square" @click="openQuickAdd('expense')" />
        </UCard>

        <!-- Transaction List -->
        <div v-else class="space-y-8 pb-12">
            <div v-for="(txs, dateKey) in groupedTransactions" :key="dateKey">
                <!-- Date Header -->
                <div class="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm py-2 px-1 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{{ dateKey }}</h3>
                </div>

                <!-- Daily Items -->
                <UCard class="divide-y divide-gray-100 dark:divide-gray-800 ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm" :ui="{ body: 'p-0 sm:p-0' }">
                    <div v-for="tx in txs" :key="tx.id.toString()" class="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors group flex items-center justify-between">
                        
                        <div class="flex items-center space-x-4 overflow-hidden">
                            <!-- Icon -->
                            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner"
                                 :class="{
                                    'bg-red-100 text-red-600 dark:bg-red-900/30': tx.type === 'expense',
                                    'bg-green-100 text-green-600 dark:bg-green-900/30': tx.type === 'income',
                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30': tx.type === 'transfer',
                                    'bg-orange-100 text-orange-600 dark:bg-orange-900/30': tx.type === 'correction'
                                 }"
                            >
                                <span v-if="tx.type === 'correction'" class="text-lg">⚖️</span>
                                <span v-else-if="tx.type === 'transfer'" class="text-lg">🔁</span>
                                <span v-else-if="getCategory(tx.category_id)" class="text-lg">{{ getCategory(tx.category_id)?.icon }}</span>
                                <span v-else class="text-lg">📄</span>
                            </div>

                            <!-- Details -->
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {{ tx.title }} 
                                    <span v-if="tx.type === 'transfer'" class="font-normal text-gray-500">
                                        (ke {{ getWallet(transactionsStore.items.find(t => t.linked_transaction_id === tx.linked_transaction_id && t.id !== tx.id)?.wallet_id)?.name }})
                                    </span>
                                </p>
                                <p class="text-xs mt-1.5 flex flex-wrap items-center gap-2">
                                    <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset transition-colors" :class="getBadgeColorClasses(getWallet(tx.wallet_id)?.color)">
                                        <UIcon name="i-heroicons-wallet" class="w-3 h-3" />
                                        {{ getWallet(tx.wallet_id)?.name }}
                                    </span>
                                    <template v-if="getCategory(tx.category_id)">
                                        <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset transition-colors" :class="getBadgeColorClasses(getCategory(tx.category_id)?.color)">
                                            <span>{{ getCategory(tx.category_id)?.name }}</span>
                                            <span v-if="getSubcategory(tx.subcategory_id)" class="opacity-70 font-normal">/ {{ getSubcategory(tx.subcategory_id)?.name }}</span>
                                        </span>
                                    </template>
                                </p>
                            </div>
                        </div>

                        <!-- Amounts & Actions -->
                        <div class="flex items-center gap-4 shrink-0 pl-4">
                            <div class="text-right">
                                <p class="font-semibold" 
                                   :class="{
                                      'text-red-500': tx.type === 'expense',
                                      'text-green-500': tx.type === 'income' || (tx.type === 'correction' && tx.notes?.includes('Ke atas')),
                                      'text-gray-600 dark:text-gray-300': tx.type === 'transfer',
                                      'text-orange-500': tx.type === 'correction' && tx.notes?.includes('Ke bawah')
                                   }"
                                >
                                    {{ tx.type === 'expense' || (tx.type === 'correction' && tx.notes?.includes('Ke bawah')) ? '-' : (tx.type === 'income' || (tx.type === 'correction' && tx.notes?.includes('Ke atas'))) ? '+' : '' }}
                                    {{ formatCurrency(Number(tx.amount), getWallet(tx.wallet_id)?.currency === 'USD' ? 'USD' : 'IDR') }}
                                </p>
                            </div>
                            
                            <!-- Delete Action -->
                            <div class="flex">
                                <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost" @click="confirmDeleteTransaction(tx.id)" />
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>
        </div>

        <!-- Quick Add Slideover -->
        <USlideover v-model:open="isSlideoverOpen" title="Formulir Transaksi" :ui="{ content: 'w-screen max-w-md' }">
            <template #body>
                <div class="space-y-6">
                    <!-- Type Selector Tabs -->
                    <div class="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button class="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                                :class="formState.type === 'expense' ? 'bg-white dark:bg-gray-900 shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'"
                                @click="formState.type = 'expense'">
                            Pengeluaran
                        </button>
                        <button class="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                                :class="formState.type === 'income' ? 'bg-white dark:bg-gray-900 shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'"
                                @click="formState.type = 'income'">
                            Pemasukan
                        </button>
                        <button class="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                                :class="formState.type === 'transfer' ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'"
                                @click="formState.type = 'transfer'">
                            Transfer
                        </button>
                    </div>

                    <!-- Amount Input -->
                    <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-800" :class="isInsufficientBalance ? 'ring-2 ring-red-500/40' : ''">
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
                            Nominal ({{ formState.walletId ? (getWallet(formState.walletId)?.currency === 'USD' ? 'USD' : 'IDR') : 'IDR' }})
                        </label>
                        <UInput v-model.number="formState.amount" type="number" size="xl" class="w-full text-center text-5xl font-bold py-4" variant="none" placeholder="0" autofocus />
                        <p class="text-center text-sm font-medium text-gray-400 mt-2">
                            {{ formState.amount ? formatCurrency(formState.amount, getWallet(formState.walletId)?.currency || 'IDR') : formatCurrency(0, getWallet(formState.walletId)?.currency || 'IDR') }}
                        </p>
                        <!-- Wallet balance display -->
                        <p v-if="selectedWallet" class="text-center text-xs mt-2" :class="isInsufficientBalance ? 'text-red-500 font-semibold' : 'text-gray-400'">
                            Saldo {{ selectedWallet.name }}: {{ formatCurrency(selectedWallet.balance, selectedWallet.currency) }}
                        </p>
                        <!-- Insufficient balance alert -->
                        <div v-if="isInsufficientBalance" class="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 text-xs">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 shrink-0" />
                            <span>Nominal melebihi saldo dompet. Transaksi tidak bisa disimpan.</span>
                        </div>
                    </div>

                    <UFormField label="Judul Transaksi" name="title" required>
                        <UInput v-model="formState.title" :placeholder="formState.type === 'transfer' ? 'Mis. Simpanan Bulanan' : 'Mis. Ngopi, Gaji, dll'" class="w-full" />
                    </UFormField>

                    <div class="flex gap-4">
                        <UFormField label="Tanggal" name="date" class="flex-1">
                            <UInput v-model="formState.date" type="date" class="w-full" />
                        </UFormField>
                    </div>

                    <UFormField :label="formState.type === 'transfer' ? 'Dompet Asal' : 'Gunakan Dompet'" name="walletId" required>
                        <USelectMenu v-model="formState.walletId" :items="walletOptions" value-key="value" label-key="name" class="w-full" searchable placeholder="Pilih Dompet" />
                    </UFormField>

                    <UFormField v-if="formState.type === 'transfer'" label="Dompet Tujuan" name="toWalletId" required>
                        <USelectMenu v-model="formState.toWalletId" :items="walletOptions" value-key="value" label-key="name" class="w-full" searchable placeholder="Pilih Dompet" />
                    </UFormField>

                    <template v-if="formState.type !== 'transfer'">
                        <UFormField label="Kategori" name="categoryId">
                            <USelectMenu v-model="formState.categoryId" :items="categoryOptions" value-key="value" label-key="name" class="w-full" searchable placeholder="Pilih Kategori" @change="formState.subCategoryId = undefined" />
                        </UFormField>

                        <UFormField v-if="formState.categoryId" label="Rincian (Sub-Kategori)" name="subCategoryId">
                            <USelectMenu v-model="formState.subCategoryId" :items="subcategoryOptions" value-key="value" label-key="name" class="w-full" placeholder="Opsional" :disabled="subcategoryOptions.length === 0" />
                        </UFormField>
                    </template>

                    <UFormField label="Catatan Opsional" name="notes">
                        <UTextarea v-model="formState.notes" :rows="2" placeholder="Tambahkan keterangan jika perlu..." class="w-full" />
                    </UFormField>

                </div>
            </template>

            <template #footer>
                <div class="flex justify-end w-full gap-3 pt-2">
                    <UButton color="neutral" variant="soft" label="Batal" @click="isSlideoverOpen = false" />
                    <UButton color="primary" label="Simpan Transaksi" @click="handleSave" :loading="saving" :disabled="saving || isInsufficientBalance" />
                </div>
            </template>
        </USlideover>

        <!-- Delete Transaction Modal -->
        <UModal :dismissible="false" v-model:open="isDeleteTxModalOpen" title="Hapus Transaksi" description="Hapus histori transaksi ini? Saldo dompet terkait akan disesuaikan kembali.">
            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteTxModalOpen = false" :disabled="deleting" />
                    <UButton color="error" label="Hapus" @click="executeDeleteTransaction" :loading="deleting" :disabled="deleting" />
                </div>
            </template>
        </UModal>
    </div>
</template>
