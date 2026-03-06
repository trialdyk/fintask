<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTable, useReducer } from 'spacetimedb/vue'
import { tables, reducers } from '../../../../src/module_bindings'
import { Timestamp } from 'spacetimedb'

const toast = useAppToast()

// Database Subscriptions
const [transactions, isTxReady] = useTable(tables.Transaction)
const [wallets, isWalletReady] = useTable(tables.Wallet)
const [categories, isCatReady] = useTable(tables.TransactionCategory)
const [subcategories, isSubReady] = useTable(tables.TransactionSubCategory)

const isReady = computed(() => isTxReady.value && isWalletReady.value && isCatReady.value && isSubReady.value)

// -- SLIDEOVER & FORM STATE --
const isSlideoverOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<bigint | null>(null)

// Transaction form model
const formState = ref({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    title: '',
    amount: 0,
    walletId: undefined as bigint | undefined,
    toWalletId: undefined as bigint | undefined, // For transfers
    categoryId: undefined as bigint | undefined,
    subCategoryId: undefined as bigint | undefined,
    date: new Date().toISOString().substring(0, 10), // YYYY-MM-DD
    notes: ''
})

// Options Mappings
const walletOptions = computed(() => {
    return wallets.value?.map(w => ({ name: `${w.icon} ${w.name}`, value: w.id })) || []
})

const categoryOptions = computed(() => {
    return categories.value?.filter(c => c.type?.tag?.toLowerCase() === formState.value.type).map(c => ({
        name: `${c.icon} ${c.name}`,
        value: c.id
    })) || []
})

const subcategoryOptions = computed(() => {
    if (!formState.value.categoryId) return []
    return subcategories.value?.filter(s => s.categoryId === formState.value.categoryId).map(s => ({
        name: s.icon ? `${s.icon} ${s.name}` : s.name,
        value: s.id
    })) || []
})

// Reducers
const createTransaction = useReducer(reducers.createTransaction)
const updateTransaction = useReducer(reducers.updateTransaction)
const deleteTxAction = useReducer(reducers.deleteTransaction)

const openQuickAdd = (type: 'income' | 'expense' | 'transfer' = 'expense') => {
    formMode.value = 'create'
    editingId.value = null
    formState.value = {
        type,
        title: '',
        amount: 0,
        walletId: wallets.value && wallets.value.length > 0 ? wallets.value[0]?.id : undefined,
        toWalletId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
        date: new Date().toISOString().substring(0, 10),
        notes: ''
    }
    isSlideoverOpen.value = true
}

const handleSave = () => {
    if (!formState.value.title) return toast.error('Gagal', 'Judul transaksi harus diisi')
    if (formState.value.amount <= 0) return toast.error('Gagal', 'Nominal harus lebih dari 0')
    if (!formState.value.walletId) return toast.error('Gagal', 'Dompet asal harus dipilih')
    
    if (formState.value.type === 'transfer') {
        if (!formState.value.toWalletId) return toast.error('Gagal', 'Dompet tujuan harus dipilih')
        if (formState.value.walletId === formState.value.toWalletId) return toast.error('Gagal', 'Dompet asal dan tujuan tidak boleh sama')
    }

    try {
        const typeTag = formState.value.type.charAt(0).toUpperCase() + formState.value.type.slice(1) as 'Income' | 'Expense' | 'Transfer' | 'Correction'
        const payload = {
            title: formState.value.title,
            type: { tag: typeTag } as any,
            amount: BigInt(formState.value.amount),
            timestamp: Timestamp.fromDate(new Date(formState.value.date)),
            walletId: formState.value.walletId,
            categoryId: formState.value.categoryId,
            subCategoryId: formState.value.subCategoryId,
            toWalletId: formState.value.toWalletId,
            notes: formState.value.notes || undefined,
            tags: []
        }

        if (formMode.value === 'create') {
            createTransaction(payload)
            toast.success('Berhasil', 'Transaksi ditambahkan')
        } else if (editingId.value !== null) {
            updateTransaction({ id: editingId.value, ...payload })
            toast.success('Berhasil', 'Transaksi diperbarui')
        }
        isSlideoverOpen.value = false
    } catch (e: any) {
        toast.error('Gagal', e.message)
    }
}

const isDeleteTxModalOpen = ref(false)
const txToDelete = ref<bigint | null>(null)

const confirmDeleteTransaction = (id: bigint) => {
    txToDelete.value = id
    isDeleteTxModalOpen.value = true
}

const executeDeleteTransaction = () => {
    if (txToDelete.value === null) return
    try {
        deleteTxAction({ id: txToDelete.value })
        toast.success('Berhasil', 'Transaksi dihapus')
    } catch (e: any) {
        toast.error('Gagal', e.message)
    } finally {
        isDeleteTxModalOpen.value = false
        txToDelete.value = null
    }
}


const getWallet = (id?: bigint | null) => id ? wallets.value?.find(w => w.id === id) : undefined
const getCategory = (id?: bigint | null) => id ? categories.value?.find(c => c.id === id) : undefined
const getSubcategory = (id?: bigint | null) => id ? subcategories.value?.find(s => s.id === id) : undefined

const getBadgeColorClasses = (colorName: string | undefined) => {
    const c = colorName || 'neutral'
    const colorMap: Record<string, string> = {
        neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-900',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-200 dark:ring-orange-900',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-900',
        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-900',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-900',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900',
        teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 ring-teal-200 dark:ring-teal-900',
        cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 ring-cyan-200 dark:ring-cyan-900',
        sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 ring-sky-200 dark:ring-sky-900',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-900',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 ring-indigo-200 dark:ring-indigo-900',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 ring-violet-200 dark:ring-violet-900',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 ring-purple-200 dark:ring-purple-900',
        pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 ring-pink-200 dark:ring-pink-900',
    }
    return colorMap[c] || colorMap.neutral
}

import { formatCurrency } from '~/utils/currency'

const groupedTransactions = computed(() => {
    if (!transactions.value) return {}
    
    const visibleTxs = transactions.value.filter(tx => {
        if (tx.type?.tag === 'Income' && tx.linkedTransactionId) return false 
        return true
    })

    const sorted = visibleTxs.sort((a, b) => Number(b.timestamp.microsSinceUnixEpoch - a.timestamp.microsSinceUnixEpoch))
    
    const grouped: Record<string, typeof sorted> = {}
    
    sorted.forEach(tx => {
        const d = new Date(Number(tx.timestamp.microsSinceUnixEpoch / 1000n))
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
            v-if="isReady && wallets && wallets.length === 0"
            color="warning"
            variant="soft"
            title="Belum ada Dompet"
            description="Anda harus membuat minimal satu Dompet terlebih dahulu sebelum bisa mencatat transaksi."
            icon="i-heroicons-exclamation-triangle"
            :actions="[{ label: 'Atur Dompet', to: '/dashboard/settings/wallets' }]"
        />

        <UAlert 
            v-if="isReady && wallets && wallets.length > 0 && categories && categories.length === 0"
            color="info"
            variant="soft"
            title="Belum ada Kategori"
            description="Sebaiknya Anda mengatur Kategori Transaksi terlebih dahulu agar laporan bisa lebih rapi."
            icon="i-heroicons-information-circle"
            :actions="[{ label: 'Kategori', to: '/dashboard/settings/transaction-categories' }]"
        />

        <!-- Loading State -->
        <div v-if="!isReady" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat data...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="!transactions || transactions.length === 0" class="text-center py-16">
            <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <h3 class="text-xl font-medium text-gray-900 dark:text-white">Buku Catatan Kosong</h3>
            <p class="mt-2 text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Mulai catat setiap pengeluaran dan pemasukan untuk mengontrol keuangan yang lebih sehat.</p>
            <UButton v-if="wallets && wallets.length > 0" label="Catat Sekarang" size="lg" icon="i-heroicons-pencil-square" @click="openQuickAdd('expense')" />
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
                                    'bg-red-100 text-red-600 dark:bg-red-900/30': tx.type?.tag === 'Expense',
                                    'bg-green-100 text-green-600 dark:bg-green-900/30': tx.type?.tag === 'Income',
                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30': tx.type?.tag === 'Transfer',
                                    'bg-orange-100 text-orange-600 dark:bg-orange-900/30': tx.type?.tag === 'Correction'
                                 }"
                            >
                                <span v-if="tx.type?.tag === 'Correction'" class="text-lg">⚖️</span>
                                <span v-else-if="tx.type?.tag === 'Transfer'" class="text-lg">🔁</span>
                                <span v-else-if="getCategory(tx.categoryId!)" class="text-lg">{{ getCategory(tx.categoryId!)?.icon }}</span>
                                <span v-else class="text-lg">📄</span>
                            </div>

                            <!-- Details -->
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {{ tx.title }} 
                                    <span v-if="tx.type?.tag === 'Transfer'" class="font-normal text-gray-500">
                                        (ke {{ getWallet(transactions.find(t => t.linkedTransactionId === tx.linkedTransactionId && t.id !== tx.id)?.walletId || 0n)?.name }})
                                    </span>
                                </p>
                                <p class="text-xs mt-1.5 flex flex-wrap items-center gap-2">
                                    <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset transition-colors" :class="getBadgeColorClasses(getWallet(tx.walletId)?.color)">
                                        <UIcon name="i-heroicons-wallet" class="w-3 h-3" />
                                        {{ getWallet(tx.walletId)?.name }}
                                    </span>
                                    <template v-if="getCategory(tx.categoryId!)">
                                        <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset transition-colors" :class="getBadgeColorClasses(getCategory(tx.categoryId!)?.color)">
                                            <span>{{ getCategory(tx.categoryId!)?.name }}</span>
                                            <span v-if="getSubcategory(tx.subCategoryId!)" class="opacity-70 font-normal">/ {{ getSubcategory(tx.subCategoryId!)?.name }}</span>
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
                                      'text-red-500': tx.type?.tag === 'Expense',
                                      'text-green-500': tx.type?.tag === 'Income' || (tx.type?.tag === 'Correction' && tx.notes?.includes('Ke atas')),
                                      'text-gray-600 dark:text-gray-300': tx.type?.tag === 'Transfer',
                                      'text-orange-500': tx.type?.tag === 'Correction' && tx.notes?.includes('Ke bawah')
                                   }"
                                >
                                    {{ tx.type?.tag === 'Expense' || (tx.type?.tag === 'Correction' && tx.notes?.includes('Ke bawah')) ? '-' : (tx.type?.tag === 'Income' || (tx.type?.tag === 'Correction' && tx.notes?.includes('Ke atas'))) ? '+' : '' }}
                                    {{ formatCurrency(Number(tx.amount), getWallet(tx.walletId)?.currency?.tag === 'Usd' ? 'USD' : 'IDR') }}
                                </p>
                            </div>
                            
                            <!-- Actions (Hover) -->
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                <!-- Edit not fully implemented for transfers due to complexity, focus on delete for now or basic expense/income edits -->
                                <UButton v-if="tx.type?.tag !== 'Correction' && tx.type?.tag !== 'Transfer'" icon="i-heroicons-pencil" size="xs" color="neutral" variant="ghost" @click="() => {} /* Implement edit binding */" />
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
                    <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-800">
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
                            Nominal ({{ formState.walletId ? (getWallet(formState.walletId)?.currency?.tag === 'Usd' ? 'USD' : 'IDR') : 'IDR' }})
                        </label>
                        <UInput v-model.number="formState.amount" type="number" size="xl" class="w-full text-center text-5xl font-bold py-4" variant="none" placeholder="0" autofocus />
                        <p class="text-center text-sm font-medium text-gray-400 mt-2">
                            {{ formState.amount ? formatCurrency(formState.amount, formState.walletId ? (getWallet(formState.walletId)?.currency?.tag === 'Usd' ? 'USD' : 'IDR') : 'IDR') : formatCurrency(0, formState.walletId ? (getWallet(formState.walletId)?.currency?.tag === 'Usd' ? 'USD' : 'IDR') : 'IDR') }}
                        </p>
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
                    <UButton color="primary" label="Simpan Transaksi" @click="handleSave" />
                </div>
            </template>
        </USlideover>

        <!-- Delete Transaction Modal -->
        <UModal v-model:open="isDeleteTxModalOpen" title="Hapus Transaksi" description="Hapus histori transaksi ini? Saldo dompet terkait akan disesuaikan kembali.">
            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteTxModalOpen = false" />
                    <UButton color="error" label="Hapus" @click="executeDeleteTransaction" />
                </div>
            </template>
        </UModal>
    </div>
</template>
