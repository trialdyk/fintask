<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTable, useReducer } from 'spacetimedb/vue'
import { tables, reducers } from '../../../../src/module_bindings'

const toast = useAppToast()

// Data fetching from SpacetimeDB
const [categories, isReady] = useTable(tables.TaskCategory)

// Form State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<bigint | null>(null)

const formState = ref({
    name: '',
    icon: '💼',
    color: 'neutral'
})

// Options for Icons and Colors
const iconOptions = [
    { name: 'Kerja', value: '💼' },
    { name: 'Rumah', value: '🏠' },
    { name: 'Belajar', value: '🎓' },
    { name: 'Ide', value: '💡' },
    { name: 'Teknologi', value: '💻' },
    { name: 'Keuangan', value: '💰' },
    { name: 'Buku', value: '📖' },
    { name: 'Kesehatan', value: '❤️' },
    { name: 'Hiburan', value: '🎮' },
    { name: 'Belanja', value: '🛒' },
    { name: 'Liburan', value: '✈️' },
    { name: 'Olahraga', value: '🏋️' }
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

const createTaskCategory = useReducer(reducers.createTaskCategory)
const updateTaskCategory = useReducer(reducers.updateTaskCategory)
const deleteTaskCategoryAction = useReducer(reducers.deleteTaskCategory)

const openCreateModal = () => {
    modalMode.value = 'create'
    formState.value = { name: '', icon: '💼', color: 'neutral' }
    editingId.value = null
    isModalOpen.value = true
}

const openEditModal = (category: any) => {
    modalMode.value = 'edit'
    formState.value = { name: category.name, icon: category.icon, color: category.color }
    editingId.value = category.id
    isModalOpen.value = true
}

// Handle Save (Create or Update)
const handleSave = () => {
    if (!formState.value.name) {
        toast.error('Gagal', 'Nama kategori harus diisi')
        return
    }

    try {
        if (modalMode.value === 'create') {
            createTaskCategory({
                name: formState.value.name,
                icon: formState.value.icon,
                color: formState.value.color
            })
            toast.success('Berhasil', 'Kategori baru ditambahkan')
        } else if (modalMode.value === 'edit' && editingId.value !== null) {
            updateTaskCategory({
                id: editingId.value,
                name: formState.value.name,
                icon: formState.value.icon,
                color: formState.value.color
            })
            toast.success('Berhasil', 'Kategori diperbarui')
        }
        isModalOpen.value = false
    } catch (err: any) {
        toast.error('Gagal', err.message || 'Error communicating with database')
    }
}

const isDeleteModalOpen = ref(false)
const categoryToDelete = ref<bigint | null>(null)

const confirmDelete = (id: bigint) => {
    categoryToDelete.value = id
    isDeleteModalOpen.value = true
}

const executeDelete = () => {
    if (categoryToDelete.value === null) return
    try {
        deleteTaskCategoryAction({ id: categoryToDelete.value })
        toast.success('Berhasil', 'Kategori dihapus')
    } catch (err: any) {
        toast.error('Gagal', err.message || 'Error menghapus kategori')
    } finally {
        isDeleteModalOpen.value = false
        categoryToDelete.value = null
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
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Kategori Tugas</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage categories to organize your tasks better.</p>
            </div>
            <UButton icon="i-heroicons-plus" label="Kategori Baru" color="primary" @click="openCreateModal" />
        </div>

        <!-- Loading State -->
        <div v-if="!isReady" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat kategori...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="!categories || categories.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-square-3-stack-3d" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada kategori</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Buat kategori pertamamu untuk mulai mengorganisir tugas.</p>
            <UButton label="Buat Kategori" icon="i-heroicons-plus" @click="openCreateModal" color="neutral" />
        </UCard>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            <UCard v-for="category in categories" :key="category.id.toString()" class="hover:ring-1 ring-primary-500/50 transition-all">
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800" :style="{ color: colorOptions.find(c => c.value === category.color)?.hex || '#64748b' }">
                                    <span class="text-xl">{{ category.icon || '🏷️' }}</span>
                                </div>
                        <div>
                            <h4 class="font-medium text-gray-900 dark:text-white">{{ category.name }}</h4>
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <UButton icon="i-heroicons-pencil" size="xs" color="neutral" variant="ghost" @click="openEditModal(category)" />
                        <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost" @click="confirmDelete(category.id)" />
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Create/Edit Modal -->
        <UModal 
            v-model:open="isModalOpen"
            :title="modalMode === 'create' ? 'Tambah Kategori' : 'Edit Kategori'"
        >
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Nama Kategori" name="name" required>
                        <UInput v-model="formState.name" placeholder="Mis. Pekerjaan, Pribadi, Belanja..." autofocus class="w-full" />
                    </UFormField>

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
                                <!-- Render menu item option as text instead of icon -->
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
                                <!-- Show color dot in select options dropdown -->
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
        <UModal v-model:open="isDeleteModalOpen" title="Hapus Kategori" description="Anda yakin ingin menghapus kategori ini? Tugas yang terhubung mungkin akan kehilangan referensi kategori.">
            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
                    <UButton color="error" label="Hapus" @click="executeDelete" />
                </div>
            </template>
        </UModal>
    </div>
</template>
