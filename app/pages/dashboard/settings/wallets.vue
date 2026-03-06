<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTable, useReducer } from 'spacetimedb/vue'
import { tables, reducers } from '../../../../src/module_bindings'

const toast = useAppToast()

// Data fetching from SpacetimeDB
const [wallets, isReady] = useTable(tables.Wallet)

// Form State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<bigint | null>(null)

const formState = ref({
    name: '',
    type: 'Cash',
    balance: 0,
    currency: 'Idr',
    icon: '💵',
    color: 'emerald'
})

// Options
const currencyOptions = [
    { name: 'Rupiah (IDR)', value: 'Idr' },
    { name: 'US Dollar (USD)', value: 'Usd' }
]
const typeOptions = [
    { name: 'Tunai', value: 'Cash' },
    { name: 'Bank', value: 'Bank' },
    { name: 'E-Wallet', value: 'Ewallet' },
    { name: 'Kartu Kredit', value: 'CreditCard' }
]

const iconOptions = [
    { name: 'Tunai', value: '💵' },
    { name: 'Dompet', value: '💳' },
    { name: 'Bank', value: '🏦' },
    { name: 'Ponsel', value: '📱' },
    { name: 'Brankas', value: '🧰' },
    { name: 'BCA', value: '🔵' },
    { name: 'Mandiri', value: '🟡' },
    { name: 'GoPay', value: '🟢' },
    { name: 'OVO', value: '🟣' },
    { name: 'ShopeePay', value: '🧡' },
    { name: 'Dana', value: '🟦' }
]

const colorOptions = [
    { name: 'Neutral', value: 'neutral', hex: '#64748b' },
    { name: 'Red', value: 'red', hex: '#ef4444' },
    { name: 'Orange', value: 'orange', hex: '#f97316' },
    { name: 'Amber', value: 'amber', hex: '#f59e0b' },
    { name: 'Yellow', value: 'yellow', hex: '#eab308' },
    { name: 'Green', value: 'green', hex: '#22c55e' },
    { name: 'Emerald', value: 'emerald', hex: '#10b981' },
    { name: 'Teal', value: 'teal', hex: '#14b8a6' },
    { name: 'Cyan', value: 'cyan', hex: '#06b6d4' },
    { name: 'Sky', value: 'sky', hex: '#0ea5e9' },
    { name: 'Blue', value: 'blue', hex: '#3b82f6' },
    { name: 'Indigo', value: 'indigo', hex: '#6366f1' },
    { name: 'Violet', value: 'violet', hex: '#8b5cf6' },
    { name: 'Purple', value: 'purple', hex: '#a855f7' },
    { name: 'Pink', value: 'pink', hex: '#ec4899' }
]

const createWallet = useReducer(reducers.createWallet)
const updateWallet = useReducer(reducers.updateWallet)
const deleteWalletAction = useReducer(reducers.deleteWallet)

const openCreateModal = () => {
    modalMode.value = 'create'
    formState.value = { name: '', type: 'Cash', balance: 0, currency: 'Idr', icon: '💵', color: 'emerald' }
    editingId.value = null
    isModalOpen.value = true
}

const openEditModal = (wallet: any) => {
    modalMode.value = 'edit'
    formState.value = { 
        name: wallet.name, 
        type: wallet.type?.tag || 'Cash', 
        balance: Number(wallet.balance), 
        currency: wallet.currency?.tag || 'Idr',
        icon: wallet.icon, 
        color: wallet.color 
    }
    editingId.value = wallet.id
    isModalOpen.value = true
}

// Handle Save (Create or Update)
const handleSave = () => {
    if (!formState.value.name) {
        toast.error('Gagal', 'Nama dompet harus diisi')
        return
    }

    try {
        if (modalMode.value === 'create') {
            createWallet({
                name: formState.value.name,
                type: { tag: formState.value.type as any },
                balance: BigInt(formState.value.balance),
                currency: { tag: formState.value.currency as any },
                icon: formState.value.icon,
                color: formState.value.color
            })
            toast.success('Berhasil', 'Dompet baru ditambahkan')
        } else if (modalMode.value === 'edit' && editingId.value !== null) {
            updateWallet({
                id: editingId.value,
                name: formState.value.name,
                type: { tag: formState.value.type as any },
                balance: BigInt(formState.value.balance),
                currency: { tag: formState.value.currency as any },
                icon: formState.value.icon,
                color: formState.value.color
            })
            toast.success('Berhasil', 'Dompet diperbarui')
        }
        isModalOpen.value = false
    } catch (err: any) {
        toast.error('Gagal', err.message || 'Error communicating with database')
    }
}
const isDeleteModalOpen = ref(false)
const walletToDelete = ref<bigint | null>(null)

const confirmDelete = (id: bigint) => {
    walletToDelete.value = id
    isDeleteModalOpen.value = true
}

const executeDelete = () => {
    if (walletToDelete.value === null) return
    try {
        deleteWalletAction({ id: walletToDelete.value })
        toast.success('Berhasil', 'Dompet dihapus')
    } catch (err: any) {
        toast.error('Gagal', err.message || 'Error menghapus dompet')
    } finally {
        isDeleteModalOpen.value = false
        walletToDelete.value = null
    }
}

// Resolving selected option for display
const getSelectedColorOption = computed(() => colorOptions.find(c => c.value === formState.value.color))
const getSelectedIconOption = computed(() => iconOptions.find(i => i.value === formState.value.icon))

import { formatCurrency } from '~/utils/currency'
</script>

<template>
    <div class="h-full flex flex-col space-y-4 max-w-4xl mx-auto w-full">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dompet & Saldo</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Kelola semua sumber dana yang Anda miliki (Tunai, Bank, E-Wallet).</p>
            </div>
            <UButton icon="i-heroicons-plus" label="Tambah Dompet" color="primary" @click="openCreateModal" />
        </div>

        <!-- Loading State -->
        <div v-if="!isReady" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat dompet...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="!wallets || wallets.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-wallet" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada dompet</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Tambahkan dompet pertamamu untuk mulai melacak keuangan.</p>
            <UButton label="Tambah Dompet" icon="i-heroicons-plus" @click="openCreateModal" color="neutral" />
        </UCard>

        <!-- Data Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            <UCard v-for="wallet in wallets" :key="wallet.id.toString()" class="hover:ring-1 ring-primary-500/50 transition-all flex flex-col">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800" :style="{ color: colorOptions.find(c => c.value === wallet.color)?.hex || '#64748b' }">
                            <span class="text-xl">{{ wallet.icon || '💳' }}</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900 dark:text-white">{{ wallet.name }}</h4>
                            <p class="text-xs text-gray-500 capitalize">{{ wallet.type?.tag }}</p>
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <UButton icon="i-heroicons-pencil" size="xs" color="neutral" variant="ghost" @click="openEditModal(wallet)" />
                        <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost" @click="confirmDelete(wallet.id)" />
                    </div>
                </div>
                <div class="mt-auto">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Saldo saat ini</p>
                    <p class="text-2xl font-bold font-mono tracking-tight" :class="wallet.balance < 0n ? 'text-red-500' : 'text-gray-900 dark:text-white'">
                        {{ formatCurrency(Number(wallet.balance), wallet.currency?.tag === 'Usd' ? 'USD' : 'IDR') }}
                    </p>
                </div>
            </UCard>
        </div>

        <!-- Create/Edit Modal -->
        <UModal 
            v-model:open="isModalOpen"
            :title="modalMode === 'create' ? 'Tambah Dompet' : 'Edit Dompet'"
            :description="modalMode === 'edit' ? 'Perubahan saldo akan otomatis dicatat sebagai transaksi Koreksi Saldo.' : ''"
        >
            <template #body>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Nama Dompet" name="name" required class="col-span-2 sm:col-span-1">
                            <UInput v-model="formState.name" placeholder="Mis. BCA, GoPay, Tunai..." autofocus class="w-full" />
                        </UFormField>

                        <UFormField label="Tipe Dompet" name="type" required class="col-span-2 sm:col-span-1">
                            <USelectMenu 
                                v-model="formState.type" 
                                :items="typeOptions" 
                                value-key="value" 
                                label-key="name"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Mata Uang" name="currency" required class="col-span-2 sm:col-span-1">
                            <USelectMenu 
                                v-model="formState.currency" 
                                :items="currencyOptions" 
                                value-key="value" 
                                label-key="name"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField 
                            label="Saldo Saat Ini" 
                            name="balance" 
                            required 
                            class="col-span-2 sm:col-span-1"
                            :help="formState.balance ? formatCurrency(formState.balance, formState.currency === 'Usd' ? 'USD' : 'IDR') : formatCurrency(0, formState.currency === 'Usd' ? 'USD' : 'IDR')"
                        >
                            <UInput v-model.number="formState.balance" type="number" class="w-full font-mono">
                                <template #leading>
                                    <span class="text-gray-500 sm:text-sm pl-2">{{ formState.currency === 'Idr' ? 'Rp' : '$' }}</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Ikon" name="icon">
                            <USelectMenu 
                                v-model="formState.icon" 
                                :items="iconOptions" 
                                value-key="value" 
                                label-key="name"
                                class="w-full"
                            >
                                <template #leading>
                                    <span class="text-lg w-5 h-5 flex items-center justify-center">{{ getSelectedIconOption ? getSelectedIconOption.value : '' }}</span>
                                </template>
                                <template #item-leading="{ item }">
                                    <span class="text-lg w-5 h-5 flex items-center justify-center">{{ item ? item.value : '' }}</span>
                                </template>
                            </USelectMenu>
                        </UFormField>

                        <UFormField label="Warna Label" name="color">
                            <USelectMenu 
                                v-model="formState.color" 
                                :items="colorOptions" 
                                value-key="value" 
                                label-key="name"
                                class="w-full"
                            >
                                <template #leading>
                                    <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: getSelectedColorOption ? getSelectedColorOption.hex : 'transparent' }"></span>
                                </template>
                                <template #item-leading="{ item }">
                                    <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: item ? item.hex : 'transparent' }"></span>
                                </template>
                            </USelectMenu>
                        </UFormField>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isModalOpen = false" />
                    <UButton color="primary" :label="modalMode === 'create' ? 'Simpan' : 'Perbarui'" @click="handleSave" />
                </div>
            </template>
        </UModal>

        <!-- Delete Confirmation Modal -->
        <UModal v-model:open="isDeleteModalOpen" title="Hapus Dompet" description="Apakah Anda yakin ingin menghapus dompet ini? Semua riwayat transaksi terkait akan terhapus secara permanen.">
            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
                    <UButton color="error" label="Hapus" @click="executeDelete" />
                </div>
            </template>
        </UModal>
    </div>
</template>
