<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'
import type { Wallet } from '~/types/database.types'

const toast = useAppToast()
const walletsStore = useWalletsStore()

// Form State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)

const formState = ref({
    name: '',
    type: 'cash' as 'cash' | 'bank' | 'ewallet' | 'credit_card',
    balance: 0,
    currency: 'IDR' as 'IDR' | 'USD',
    icon: '💵',
    color: 'emerald'
})

// Options
const currencyOptions = [
    { name: 'Rupiah (IDR)', value: 'IDR' },
    { name: 'US Dollar (USD)', value: 'USD' }
]
const typeOptions = [
    { name: 'Tunai', value: 'cash' },
    { name: 'Bank', value: 'bank' },
    { name: 'E-Wallet', value: 'ewallet' },
    { name: 'Kartu Kredit', value: 'credit_card' }
]

const iconOptions = [
    { name: 'Tunai', value: '💵' },
    { name: 'Dompet', value: '💳' },
    { name: 'Bank', value: '🏦' },
    { name: 'Ponsel', value: '📱' },
    { name: 'Brankas', value: '🧰' },
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

const openCreateModal = () => {
    modalMode.value = 'create'
    formState.value = { name: '', type: 'cash', balance: 0, currency: 'IDR', icon: '💵', color: 'emerald' }
    editingId.value = null
    isModalOpen.value = true
}

const openEditModal = (wallet: Wallet) => {
    modalMode.value = 'edit'
    formState.value = { 
        name: wallet.name, 
        type: wallet.type || 'cash', 
        balance: wallet.balance, 
        currency: wallet.currency || 'IDR',
        icon: wallet.icon, 
        color: wallet.color 
    }
    editingId.value = wallet.id
    isModalOpen.value = true
}

const saving = ref(false)
const deleting = ref(false)

const handleSave = async () => {
    if (!formState.value.name) {
        toast.error('Gagal', 'Nama dompet harus diisi')
        return
    }
    saving.value = true
    try {
        const payload = {
            name: formState.value.name,
            type: formState.value.type,
            balance: formState.value.balance,
            currency: formState.value.currency,
            icon: formState.value.icon,
            color: formState.value.color
        }
        if (modalMode.value === 'create') {
            await walletsStore.create(payload)
            toast.success('Berhasil', 'Dompet baru ditambahkan')
        } else if (editingId.value !== null) {
            await walletsStore.update(editingId.value, payload)
            toast.success('Berhasil', 'Dompet diperbarui')
        }
        isModalOpen.value = false
    } catch (err: any) {
        toast.error('Gagal', err.data?.statusMessage || err.message)
    } finally {
        saving.value = false
    }
}
const isDeleteModalOpen = ref(false)
const walletToDelete = ref<number | null>(null)

const confirmDelete = (id: number) => {
    walletToDelete.value = id
    isDeleteModalOpen.value = true
}

const executeDelete = async () => {
    if (walletToDelete.value === null) return
    deleting.value = true
    try {
        await walletsStore.remove(walletToDelete.value)
        toast.success('Berhasil', 'Dompet dihapus')
    } catch (err: any) {
        toast.error('Gagal', err.data?.statusMessage || err.message)
    } finally {
        deleting.value = false
        isDeleteModalOpen.value = false
        walletToDelete.value = null
    }
}

// Resolving selected option for display
const getSelectedColorOption = computed(() => colorOptions.find(c => c.value === formState.value.color))
const getSelectedIconOption = computed(() => iconOptions.find(i => i.value === formState.value.icon))
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
        <div v-if="walletsStore.loading" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat dompet...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="walletsStore.items.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-wallet" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada dompet</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Tambahkan dompet pertamamu untuk mulai melacak keuangan.</p>
            <UButton label="Tambah Dompet" icon="i-heroicons-plus" @click="openCreateModal" color="neutral" />
        </UCard>

        <!-- Data Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            <UCard v-for="wallet in walletsStore.items" :key="wallet.id" class="hover:ring-1 ring-primary-500/50 transition-all flex flex-col border-l-4" :style="{ borderLeftColor: colorOptions.find(c => c.value === wallet.color)?.hex || '#64748b' }">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" :style="{ backgroundColor: (colorOptions.find(c => c.value === wallet.color)?.hex || '#64748b') + '20', color: colorOptions.find(c => c.value === wallet.color)?.hex || '#64748b' }">
                            <span class="text-xl">{{ wallet.icon || '💳' }}</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900 dark:text-white">{{ wallet.name }}</h4>
                            <p class="text-xs text-gray-500 capitalize">{{ wallet.type }}</p>
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <UButton icon="i-heroicons-pencil" size="xs" color="neutral" variant="ghost" @click="openEditModal(wallet)" />
                        <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost" @click="confirmDelete(wallet.id)" />
                    </div>
                </div>
                <div class="mt-auto">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Saldo saat ini</p>
                    <p class="text-2xl font-bold font-mono tracking-tight" :class="wallet.balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'">
                        {{ formatCurrency(wallet.balance, wallet.currency) }}
                    </p>
                </div>
            </UCard>
        </div>

        <!-- Create/Edit Modal -->
        <UModal :dismissible="false" 
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
                            :help="formState.balance ? formatCurrency(formState.balance, formState.currency) : formatCurrency(0, formState.currency)"
                        >
                            <UInput v-model.number="formState.balance" type="number" class="w-full font-mono">
                                <template #leading>
                                    <span class="text-gray-500 sm:text-sm pl-2">{{ formState.currency === 'IDR' ? 'Rp' : '$' }}</span>
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
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isModalOpen = false" :disabled="saving" />
                    <UButton color="primary" :label="modalMode === 'create' ? 'Simpan' : 'Perbarui'" @click="handleSave" :loading="saving" :disabled="saving" />
                </div>
            </template>
        </UModal>

        <!-- Delete Confirmation Modal -->
        <UModal :dismissible="false" v-model:open="isDeleteModalOpen" title="Hapus Dompet" description="Apakah Anda yakin ingin menghapus dompet ini? Semua riwayat transaksi terkait akan terhapus secara permanen.">
            <template #footer>
                <div class="flex justify-end w-full gap-3">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteModalOpen = false" :disabled="deleting" />
                    <UButton color="error" label="Hapus" @click="executeDelete" :loading="deleting" :disabled="deleting" />
                </div>
            </template>
        </UModal>
    </div>
</template>
