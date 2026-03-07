<script setup lang="ts">
import { ICON_OPTIONS, COLOR_OPTIONS } from '~/utils/options'
import type { TransactionCategory, TransactionSubcategory } from '~/types/database.types'

const toast = useAppToast()
const categoriesStore = useCategoriesStore()

// Filter State
const activeTab = ref<'expense' | 'income' | 'transfer' | 'correction'>('expense')

// Form State (Parent Category)
const isCategoryModalOpen = ref(false)
const categoryModalMode = ref<'create' | 'edit'>('create')
const editingCategoryId = ref<number | null>(null)

const categoryForm = ref({
    name: '',
    type: 'expense' as 'expense' | 'income' | 'transfer' | 'correction',
    icon: '🍔',
    color: 'red'
})

// Form State (Sub Category)
const isSubModalOpen = ref(false)
const subModalMode = ref<'create' | 'edit'>('create')
const editingSubId = ref<number | null>(null)
const targetParentId = ref<number | null>(null)

const subForm = ref({
    name: '',
    icon: '🍽️'
})

// Options
const iconOptions = ICON_OPTIONS
const colorOptions = COLOR_OPTIONS

// Derived Data
const filteredCategories = computed(() =>
    categoriesStore.txCategories.filter(c => c.type === activeTab.value)
)

const getSubcategories = (parentId: number) =>
    categoriesStore.getSubcategoriesForCategory(parentId)

// Category Actions
const openCreateCategory = () => {
    categoryModalMode.value = 'create'
    categoryForm.value = { name: '', type: activeTab.value, icon: '🍔', color: activeTab.value === 'expense' ? 'red' : 'green' }
    editingCategoryId.value = null
    isCategoryModalOpen.value = true
}

const openEditCategory = (category: TransactionCategory) => {
    categoryModalMode.value = 'edit'
    categoryForm.value = { name: category.name, type: category.type || activeTab.value, icon: category.icon, color: category.color }
    editingCategoryId.value = category.id
    isCategoryModalOpen.value = true
}

const saving = ref(false)
const deleting = ref(false)

const saveCategory = async () => {
    if (!categoryForm.value.name) return toast.error('Gagal', 'Nama kategori wajib diisi')
    saving.value = true
    try {
        const payload = { name: categoryForm.value.name, type: categoryForm.value.type, icon: categoryForm.value.icon, color: categoryForm.value.color }
        if (categoryModalMode.value === 'create') {
            await categoriesStore.createTxCategory(payload)
            toast.success('Berhasil', 'Kategori ditambahkan')
        } else if (editingCategoryId.value !== null) {
            await categoriesStore.updateTxCategory(editingCategoryId.value, payload)
            toast.success('Berhasil', 'Kategori diperbarui')
        }
        isCategoryModalOpen.value = false
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        saving.value = false
    }
}

const isDeleteCategoryModalOpen = ref(false)
const categoryToDelete = ref<number | null>(null)

const confirmDeleteCategory = (id: number) => {
    categoryToDelete.value = id
    isDeleteCategoryModalOpen.value = true
}

const executeDeleteCategory = async () => {
    if (categoryToDelete.value === null) return
    deleting.value = true
    try {
        await categoriesStore.removeTxCategory(categoryToDelete.value)
        toast.success('Berhasil', 'Kategori dihapus')
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        deleting.value = false
        isDeleteCategoryModalOpen.value = false
        categoryToDelete.value = null
    }
}

// Subcategory Actions
const openCreateSub = (parentId: number) => {
    targetParentId.value = parentId
    subModalMode.value = 'create'
    subForm.value = { name: '', icon: '🍽️' }
    editingSubId.value = null
    isSubModalOpen.value = true
}

const openEditSub = (sub: TransactionSubcategory) => {
    targetParentId.value = sub.category_id
    subModalMode.value = 'edit'
    subForm.value = { name: sub.name, icon: sub.icon || '🍽️' }
    editingSubId.value = sub.id
    isSubModalOpen.value = true
}

const saveSub = async () => {
    if (!subForm.value.name) return toast.error('Gagal', 'Nama rincian wajib diisi')
    if (targetParentId.value === null) return
    saving.value = true
    try {
        if (subModalMode.value === 'create') {
            await categoriesStore.createTxSubcategory({ category_id: targetParentId.value, name: subForm.value.name, icon: subForm.value.icon })
            toast.success('Berhasil', 'Rincian ditambahkan')
        } else if (editingSubId.value !== null) {
            await categoriesStore.updateTxSubcategory(editingSubId.value, { category_id: targetParentId.value, name: subForm.value.name, icon: subForm.value.icon })
            toast.success('Berhasil', 'Rincian diperbarui')
        }
        isSubModalOpen.value = false
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        saving.value = false
    }
}

const isDeleteSubModalOpen = ref(false)
const subToDelete = ref<number | null>(null)

const confirmDeleteSub = (id: number) => {
    subToDelete.value = id
    isDeleteSubModalOpen.value = true
}

const executeDeleteSub = async () => {
    if (subToDelete.value === null) return
    deleting.value = true
    try {
        await categoriesStore.removeTxSubcategory(subToDelete.value)
        toast.success('Berhasil', 'Rincian dihapus')
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        deleting.value = false
        isDeleteSubModalOpen.value = false
        subToDelete.value = null
    }
}

// Helpers
const getSelectedColorOption = computed(() => colorOptions.find(c => c.value === categoryForm.value.color))
const getCategoryIconOption = computed(() => iconOptions.find(i => i.value === categoryForm.value.icon))
const getSubIconOption = computed(() => iconOptions.find(i => i.value === subForm.value.icon))

</script>

<template>
    <div class="h-full flex flex-col space-y-6 max-w-4xl mx-auto w-full">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Kategori Transaksi</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Organisasikan sumber pemasukan dan pengeluaran Anda.</p>
            </div>
            <UButton icon="i-heroicons-plus" label="Kategori Baru" color="primary" @click="openCreateCategory" />
        </div>

        <!-- Tabs -->
        <div class="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
            <button 
                class="px-4 py-2 text-sm font-medium rounded-md transition-colors w-32"
                :class="activeTab === 'expense' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                @click="activeTab = 'expense'"
            >
                Pengeluaran
            </button>
            <button 
                class="px-4 py-2 text-sm font-medium rounded-md transition-colors w-32"
                :class="activeTab === 'income' ? 'bg-white dark:bg-gray-900 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                @click="activeTab = 'income'"
            >
                Pemasukan
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="categoriesStore.loading" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat data...</span>
        </div>

        <!-- Empty State -->
        <UCard v-else-if="filteredCategories.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-tag" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada Kategori</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Tambahkan kategori {{ activeTab === 'expense' ? 'pengeluaran' : 'pemasukan' }} pertama Anda.</p>
            <UButton label="Kategori Baru" icon="i-heroicons-plus" @click="openCreateCategory" color="neutral" />
        </UCard>

        <!-- Categories List -->
        <div v-else class="space-y-4 pb-8">
            <UCard v-for="category in filteredCategories" :key="category.id.toString()" class="overflow-visible" :ui="{ body: 'sm:p-4' }">
                <div class="flex flex-col sm:flex-row gap-4">
                    <!-- Left: Parent Info -->
                    <div class="flex-none sm:w-1/3 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-800 pb-4 sm:pb-0 sm:pr-4 flex items-start justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800" :style="{ color: colorOptions.find(c => c.value === category.color)?.hex || '#64748b' }">
                                <span class="text-2xl">{{ category.icon || '📌' }}</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900 dark:text-white text-lg">{{ category.name }}</h4>
                                <div class="flex items-center mt-1">
                                    <span class="w-2 h-2 rounded-full mr-1.5" :style="{ backgroundColor: colorOptions.find(c => c.value === category.color)?.hex || '#64748b' }"></span>
                                    <span class="text-xs text-gray-500 capitalize">{{ category.color }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-1">
                            <UButton icon="i-heroicons-pencil" size="xs" color="neutral" variant="ghost" @click="openEditCategory(category)" />
                            <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost" @click="confirmDeleteCategory(category.id)" />
                        </div>
                    </div>

                    <!-- Right: Subcategories -->
                    <div class="flex-1 flex flex-col">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">Rincian / Sub-Kategori</h5>
                            <UButton icon="i-heroicons-plus" size="xs" color="neutral" variant="soft" label="Tambah" @click="openCreateSub(category.id)" />
                        </div>
                        
                        <div v-if="getSubcategories(category.id).length === 0" class="text-sm text-gray-500 italic py-2">
                            Belum ada rincian. Anda bisa menambahkan subdivisi untuk kategori ini.
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            <div 
                                v-for="sub in getSubcategories(category.id)" 
                                :key="sub.id.toString()"
                                class="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors group cursor-pointer"
                                @click="openEditSub(sub)"
                            >
                                <span v-if="sub.icon" class="mr-1.5">{{ sub.icon }}</span>
                                <span class="text-gray-700 dark:text-gray-300 font-medium">{{ sub.name }}</span>
                                <UButton 
                                    icon="i-heroicons-x-mark" 
                                    size="xs" 
                                    color="neutral" 
                                    variant="ghost" 
                                    class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1" 
                                    @click.stop="confirmDeleteSub(sub.id)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Parent Category Modal -->
        <UModal :dismissible="false" v-model:open="isCategoryModalOpen" :title="categoryModalMode === 'create' ? 'Tambah Kategori Utama' : 'Edit Kategori Utama'">
            <template #body>
                <div class="space-y-4">
                    <UFormField class="w-full" label="Nama Kategori" name="name" required>
                        <UInput v-model="categoryForm.name" placeholder="Mis. Makanan, Gaji, dll..." autofocus class="w-full" />
                    </UFormField>

                    <UFormField class="w-full" label="Tipe Laporan" name="type">
                        <USelectMenu class="w-full" v-model="categoryForm.type" :items="[{label: 'Pengeluaran', value: 'expense'}, {label: 'Pemasukan', value: 'income'}]" value-key="value" label-key="label" disabled />
                    </UFormField>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField class="w-full" label="Ikon" name="icon">
                            <USelectMenu class="w-full" v-model="categoryForm.icon" :items="iconOptions" value-key="value" label-key="name" searchable>
                                <template #leading><span class="text-lg w-5 h-5 flex items-center justify-center">{{ getCategoryIconOption ? getCategoryIconOption.value : '' }}</span></template>
                                <template #item-leading="{ item }"><span class="text-lg w-5 h-5 flex items-center justify-center">{{ item ? item.value : '' }}</span></template>
                            </USelectMenu>
                        </UFormField>

                        <UFormField label="Warna UI" name="color">
                            <USelectMenu class="w-full" v-model="categoryForm.color" :items="colorOptions" value-key="value" label-key="name">
                                <template #leading><span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: getSelectedColorOption ? getSelectedColorOption.hex : 'transparent' }"></span></template>
                                <template #item-leading="{ item }"><span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: item ? item.hex : 'transparent' }"></span></template>
                            </USelectMenu>
                        </UFormField>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isCategoryModalOpen = false" :disabled="saving" />
                    <UButton color="primary" :label="categoryModalMode === 'create' ? 'Simpan' : 'Perbarui'" @click="saveCategory" :loading="saving" :disabled="saving" />
                </div>
            </template>
        </UModal>

        <!-- Subcategory Modal -->
        <UModal :dismissible="false" v-model:open="isSubModalOpen" :title="subModalMode === 'create' ? 'Tambah Rincian Kategori' : 'Edit Rincian'">
            <template #body>
                <div class="space-y-4">
                    <UFormField class="w-full" label="Nama Rincian" name="name" required>
                        <UInput v-model="subForm.name" placeholder="Mis. Makan Siang, Kopi..." autofocus class="w-full" @keyup.enter="saveSub" />
                    </UFormField>

                    <UFormField class="w-full" label="Ikon" name="icon">
                        <USelectMenu class="w-full" v-model="subForm.icon" :items="iconOptions" value-key="value" label-key="name" searchable>
                            <template #leading><span class="text-lg w-5 h-5 flex items-center justify-center">{{ getSubIconOption ? getSubIconOption.value : '' }}</span></template>
                            <template #item-leading="{ item }"><span class="text-lg w-5 h-5 flex items-center justify-center">{{ item ? item.value : '' }}</span></template>
                        </USelectMenu>
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isSubModalOpen = false" :disabled="saving" />
                    <UButton color="primary" :label="subModalMode === 'create' ? 'Simpan' : 'Perbarui'" @click="saveSub" :loading="saving" :disabled="saving" />
                </div>
            </template>
        </UModal>

        <!-- Delete Category Confirmation Modal -->
        <UModal :dismissible="false" v-model:open="isDeleteCategoryModalOpen" title="Hapus Kategori Utama" description="Hapus kategori ini beserta seluruh sub-kategorinya? Transaksi terkait akan kehilangan label kategorinya.">
            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteCategoryModalOpen = false" :disabled="deleting" />
                    <UButton color="error" label="Hapus" @click="executeDeleteCategory" :loading="deleting" :disabled="deleting" />
                </div>
            </template>
        </UModal>

        <!-- Delete Subcategory Confirmation Modal -->
        <UModal :dismissible="false" v-model:open="isDeleteSubModalOpen" title="Hapus Rincian" description="Hapus sub-kategori ini? Transaksi terkait akan kehilangan label rincian ini.">
            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteSubModalOpen = false" :disabled="deleting" />
                    <UButton color="error" label="Hapus" @click="executeDeleteSub" :loading="deleting" :disabled="deleting" />
                </div>
            </template>
        </UModal>
    </div>
</template>
