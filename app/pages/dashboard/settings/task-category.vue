<script setup lang="ts">
import { ICON_OPTIONS, COLOR_OPTIONS } from '~/utils/options'
import type { TaskCategory } from '~/types/database.types'

const toast = useAppToast()
const categoriesStore = useCategoriesStore()

// Form State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)

const formState = ref({
    name: '',
    icon: '💼',
    color: 'neutral'
})

// Options for Icons and Colors
const iconOptions = ICON_OPTIONS
const colorOptions = COLOR_OPTIONS

const openCreateModal = () => {
    modalMode.value = 'create'
    formState.value = { name: '', icon: '💼', color: 'neutral' }
    editingId.value = null
    isModalOpen.value = true
}

const openEditModal = (category: TaskCategory) => {
    modalMode.value = 'edit'
    formState.value = { name: category.name, icon: category.icon, color: category.color }
    editingId.value = category.id
    isModalOpen.value = true
}

const saving = ref(false)
const deleting = ref(false)

const handleSave = async () => {
    if (!formState.value.name) {
        toast.error('Gagal', 'Nama kategori harus diisi')
        return
    }
    saving.value = true
    try {
        const payload = { name: formState.value.name, icon: formState.value.icon, color: formState.value.color }
        if (modalMode.value === 'create') {
            await categoriesStore.createTaskCategory(payload)
            toast.success('Berhasil', 'Kategori baru ditambahkan')
        } else if (editingId.value !== null) {
            await categoriesStore.updateTaskCategory(editingId.value, payload)
            toast.success('Berhasil', 'Kategori diperbarui')
        }
        isModalOpen.value = false
    } catch (err: any) {
        toast.error('Gagal', err.data?.statusMessage || err.message)
    } finally {
        saving.value = false
    }
}

const isDeleteModalOpen = ref(false)
const categoryToDelete = ref<number | null>(null)

const confirmDelete = (id: number) => {
    categoryToDelete.value = id
    isDeleteModalOpen.value = true
}

const executeDelete = async () => {
    if (categoryToDelete.value === null) return
    deleting.value = true
    try {
        await categoriesStore.removeTaskCategory(categoryToDelete.value)
        toast.success('Berhasil', 'Kategori dihapus')
    } catch (err: any) {
        toast.error('Gagal', err.data?.statusMessage || err.message)
    } finally {
        deleting.value = false
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
        <div v-if="categoriesStore.loading" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat kategori...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="categoriesStore.taskCategories.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-square-3-stack-3d" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada kategori</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Buat kategori pertamamu untuk mulai mengorganisir tugas.</p>
            <UButton label="Buat Kategori" icon="i-heroicons-plus" @click="openCreateModal" color="neutral" />
        </UCard>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            <UCard v-for="category in categoriesStore.taskCategories" :key="category.id" class="hover:ring-1 ring-primary-500/50 transition-all">
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
        <UModal :dismissible="false" 
            v-model:open="isModalOpen"
            :title="modalMode === 'create' ? 'Tambah Kategori' : 'Edit Kategori'"
        >
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Nama Kategori" name="name" required>
                        <UInput v-model="formState.name" placeholder="Mis. Pekerjaan, Pribadi, Belanja..." autofocus class="w-full" />
                    </UFormField>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Ikon" name="icon" class="min-w-0">
                            <USelectMenu 
                                v-model="formState.icon" 
                                :items="iconOptions" 
                                value-key="value" 
                                label-key="name"
                                class="w-full"
                                searchable
                                :ui="{ content: 'min-w-[var(--reka-popper-anchor-width)]' }"
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

                        <UFormField label="Warna Label" name="color" class="min-w-0">
                            <USelectMenu 
                                v-model="formState.color" 
                                :items="colorOptions" 
                                value-key="value" 
                                label-key="name"
                                class="w-full"
                                :ui="{ content: 'min-w-[var(--reka-popper-anchor-width)]' }"
                            >
                                <template #leading>
                                    <span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: getSelectedColorOption ? getSelectedColorOption.hex : 'transparent' }"></span>
                                </template>
                                <!-- Show color dot in select options dropdown -->
                                <template #item-leading="{ item }">
                                    <span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: item ? item.hex : 'transparent' }"></span>
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
        <UModal :dismissible="false" v-model:open="isDeleteModalOpen" title="Hapus Kategori" description="Anda yakin ingin menghapus kategori ini? Tugas yang terhubung mungkin akan kehilangan referensi kategori.">
            <template #footer>
                <div class="flex justify-end w-full gap-3">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteModalOpen = false" :disabled="deleting" />
                    <UButton color="error" label="Hapus" @click="executeDelete" :loading="deleting" :disabled="deleting" />
                </div>
            </template>
        </UModal>
    </div>
</template>
