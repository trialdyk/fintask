<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTable, useReducer } from 'spacetimedb/vue'
import { tables, reducers } from '../../../../src/module_bindings'
import { getRelativeTimeLabel } from '~/utils/date'

const toast = useToast()

// Database subscriptions
const [tasks, isTasksReady] = useTable(tables.Task)
const [categories] = useTable(tables.TaskCategory)

// --- Filter State ---
const selectedDeadline = ref('Semua') // Hari Ini, < 3 Hari, 1 Minggu, Semua, Terlewat
const deadlineOptions = ['Hari Ini', '< 3 Hari', '1 Minggu', 'Semua', 'Terlewat']

const selectedTags = ref<string[]>([])
const selectedPriority = ref<string>('Semua') 
const selectedDifficulty = ref<string>('Semua')

// Options for priority/difficulty dropdowns
const priorityOptions = ['Semua', 'low', 'medium', 'high']
const difficultyOptions = ['Semua', '1', '2', '3', '4', '5']

// Automatically extract unique tags from existing tasks
const availableTags = computed(() => {
    if (!tasks.value) return []
    const tags = new Set<string>()
    for (const t of tasks.value) {
        if (t.tags) t.tags.forEach(tag => tags.add(tag))
    }
    return Array.from(tags)
})
const optionsDifficulty = [1, 2, 3, 4, 5]

const toggleTaskCompletionAction = useReducer(reducers.toggleTaskCompletion)
const deleteTaskAction = useReducer(reducers.deleteTask)
const createTaskAction = useReducer(reducers.createTask)
const updateTaskAction = useReducer(reducers.updateTask)

// --- Computed Filtered Tasks ---
const filteredTasks = computed(() => {
    if (!tasks.value) return []

    return tasks.value.filter(task => {
        // 1. Filter by Priority
        if (selectedPriority.value !== 'Semua' && task.priority?.tag?.toLowerCase() !== selectedPriority.value) return false

        // 2. Filter by Difficulty
        if (selectedDifficulty.value !== 'Semua' && task.difficulty?.toString() !== selectedDifficulty.value) return false

        // 3. Filter by Tags (must have at least one of the selected tags, if any selected)
        if (selectedTags.value.length > 0) {
            const hasTag = task.tags?.some(tag => selectedTags.value.includes(tag))
            if (!hasTag) return false
        }

        // 4. Filter by Deadline
        if (selectedDeadline.value !== 'Semua') {
            const relativeLabel = getRelativeTimeLabel(Number(task.deadline?.microsSinceUnixEpoch || 0) / 1000)
            
            if (selectedDeadline.value === 'Terlewat' && relativeLabel !== 'Terlewat') return false
            if (selectedDeadline.value === 'Hari Ini' && relativeLabel !== 'Hari Ini') return false
            if (selectedDeadline.value === '< 3 Hari') {
                if (!['Hari Ini', 'Besok', '< 3 Hari'].includes(relativeLabel)) return false
            }
            if (selectedDeadline.value === '1 Minggu') {
                 if (!['Hari Ini', 'Besok', '< 3 Hari', '1 Minggu'].includes(relativeLabel)) return false
            }
        }

        return true
    })
})

const uncompletedTasks = computed(() => filteredTasks.value.filter(t => !t.isCompleted))
const completedTasks = computed(() => filteredTasks.value.filter(t => t.isCompleted))

// --- Pagination for Completed Tasks ---
const completedPage = ref(1)
const completedItemsPerPage = 20

const paginatedCompletedTasks = computed(() => {
    const start = (completedPage.value - 1) * completedItemsPerPage
    const end = start + completedItemsPerPage
    return completedTasks.value.slice(start, end)
})

watch(completedTasks, () => {
    // Reset to page 1 if current page becomes empty after deletion/unchecking
    if (paginatedCompletedTasks.value.length === 0 && completedPage.value > 1) {
        completedPage.value = Math.max(1, Math.ceil(completedTasks.value.length / completedItemsPerPage))
    }
})
// --- Task Actions ---
const toggleCompletion = (taskId: bigint) => {
    try {
        toggleTaskCompletionAction({ id: taskId })
        toast.add({ title: 'Berhasil', description: 'Status tugas diperbarui', color: 'success'})
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.message || 'Server error', color: 'error'})
    }
}

const isDeleteTaskModalOpen = ref(false)
const taskToDelete = ref<bigint | null>(null)

const confirmDeleteTask = (id: bigint) => {
    taskToDelete.value = id
    isDeleteTaskModalOpen.value = true
}

const executeDeleteTask = () => {
    if (taskToDelete.value === null) return
    try {
        deleteTaskAction({ id: taskToDelete.value })
        toast.add({ title: 'Berhasil', description: 'Tugas dihapus', color: 'success'})
    } catch (e: any) {
         toast.add({ title: 'Gagal', description: e.message || 'Server error', color: 'error'})
    } finally {
        isDeleteTaskModalOpen.value = false
        taskToDelete.value = null
    }
}

// --- Task Form Modal ---
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<bigint | null>(null)

// Helper for datetime-local input
const getLocalDatetimeLocal = (date?: Date) => {
    const base = date || new Date()
    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
}

const formState = ref({
    name: '',
    deadline: getLocalDatetimeLocal() as string | undefined,
    priority: 'medium',
    effort: undefined as number | undefined,
    difficulty: undefined as number | undefined,
    categoryId: undefined as bigint | undefined,
    description: '',
    tags: [] as string[]
})

const openCreateModal = () => {
    modalMode.value = 'create'
    formState.value = {
        name: '',
        deadline: getLocalDatetimeLocal(),
        priority: 'medium',
        effort: undefined,
        difficulty: undefined,
        categoryId: undefined,
        description: '',
        tags: []
    }
    editingId.value = null
    isModalOpen.value = true
}

const openEditModal = (task: any) => {
    modalMode.value = 'edit'
    formState.value = {
        name: task.name,
        deadline: task.deadline ? getLocalDatetimeLocal(new Date(Number(task.deadline.microsSinceUnixEpoch) / 1000)) : undefined,
        priority: task.priority?.tag?.toLowerCase() || 'medium',
        effort: task.effort,
        difficulty: task.difficulty,
        categoryId: task.categoryId,
        description: task.description || '',
        tags: [...(task.tags || [])]
    }
    editingId.value = task.id
    isModalOpen.value = true
}

import { Timestamp } from 'spacetimedb'

const handleSaveTask = () => {
    if (!formState.value.name) {
        toast.add({ title: 'Gagal', description: 'Nama tugas wajib diisi', color: 'error' })
        return
    }

    try {
        let ts: Timestamp | undefined = undefined;
        if (formState.value.deadline) {
            const dateObj = new Date(formState.value.deadline)
            ts = Timestamp.fromDate(dateObj)
        }

        if (modalMode.value === 'create') {
            createTaskAction({
                name: formState.value.name,
                deadline: ts || undefined,
                priority: { tag: formState.value.priority.charAt(0).toUpperCase() + formState.value.priority.slice(1) } as any,
                effort: formState.value.effort ? Number(formState.value.effort) : undefined,
                difficulty: formState.value.difficulty ? Number(formState.value.difficulty) : undefined,
                categoryId: formState.value.categoryId || undefined,
                description: formState.value.description || undefined,
                tags: formState.value.tags || []
            })
            toast.add({ title: 'Berhasil', description: 'Tugas baru dibuat', color: 'success' })
        } else if (modalMode.value === 'edit' && editingId.value !== null) {
            // Re-fetch isCompleted stat to not override it
            const currentTask = tasks.value?.find(t => t.id === editingId.value)
            
            updateTaskAction({
                id: editingId.value,
                name: formState.value.name,
                deadline: ts || undefined,
                priority: { tag: formState.value.priority.charAt(0).toUpperCase() + formState.value.priority.slice(1) } as any,
                effort: formState.value.effort ? Number(formState.value.effort) : undefined,
                difficulty: formState.value.difficulty ? Number(formState.value.difficulty) : undefined,
                categoryId: formState.value.categoryId || undefined,
                description: formState.value.description || undefined,
                tags: formState.value.tags || [],
                isCompleted: currentTask?.isCompleted || false
            })
            toast.add({ title: 'Berhasil', description: 'Tugas diperbarui', color: 'success' })
        }
        isModalOpen.value = false
    } catch (err: any) {
        toast.add({ title: 'Error', description: err.message || 'Terjadi kesalahan sistem', color: 'error' })
    }
}

// Helpers
const getCategory = (id?: bigint) => {
    if (!id || !categories.value) return null
    return categories.value.find(c => c.id === id)
}
</script>

<template>
    <div class="h-full flex flex-col space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tugas Harian</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage and track your daily work seamlessly.</p>
            </div>
            <UButton icon="i-heroicons-plus" label="Tugas Baru" color="primary" @click="openCreateModal" />
        </div>

        <!-- Filters Section -->
        <UCard class="mb-6 border-b border-gray-100 dark:border-gray-800" :ui="{ body: 'p-4 sm:p-4' }">
            <div class="flex flex-col md:flex-row gap-4 justify-between">
                <!-- Tabs for deadline -->
                <div class="flex space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
                    <UButton 
                        v-for="opt in deadlineOptions" 
                        :key="opt"
                        :label="opt"
                        :variant="selectedDeadline === opt ? 'solid' : 'soft'"
                        :color="selectedDeadline === opt ? 'primary' : 'neutral'"
                        size="sm"
                        @click="selectedDeadline = opt"
                    />
                </div>

                <!-- Select Filters -->
                <div class="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center md:justify-end">
                    <USelectMenu 
                        v-model="selectedPriority" 
                        :items="priorityOptions" 
                        placeholder="Prioritas" 
                        size="sm" 
                        class="w-full lg:w-32" 
                    />
                    <USelectMenu 
                        v-model="selectedDifficulty" 
                        :items="difficultyOptions" 
                        placeholder="Kesulitan" 
                        size="sm" 
                        class="w-full lg:w-32" 
                    />
                    <USelectMenu 
                        v-model="selectedTags" 
                        :items="availableTags" 
                        multiple 
                        placeholder="Filter Tags" 
                        size="sm"
                        class="w-full col-span-2 lg:col-span-1 lg:w-48"
                    />
                </div>
            </div>
        </UCard>

        <!-- Loading State -->
        <div v-if="!isTasksReady" class="flex justify-center items-center py-24">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-500">Memuat tugas...</span>
        </div>

        <!-- Task Board Data Grid -->
        <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
            <!-- Col 1: Uncompleted -->
            <UCard class="flex flex-col h-[calc(100vh-16rem)]" :ui="{ body: 'p-0 sm:p-0 flex-1 overflow-y-auto' }">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center">
                            Belum Selesai
                            <UBadge color="neutral" variant="subtle" class="ml-2">{{ uncompletedTasks.length }}</UBadge>
                        </h3>
                    </div>
                </template>
                
                <div v-if="uncompletedTasks.length === 0" class="p-8 text-center text-gray-500">
                    Semua tugas selesai 🎉
                </div>
                
                <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                    <div v-for="task in uncompletedTasks" :key="task.id.toString()" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group flex items-start gap-4">
                        <UCheckbox 
                            :model-value="task.isCompleted" 
                            @update:model-value="toggleCompletion(task.id)"
                            class="mt-1"
                        />
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between mb-1">
                                <div class="pr-4">
                                    <h4 class="text-base font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" @click="openEditModal(task)">
                                        {{ task.name }}
                                    </h4>
                                    <p v-if="task.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{{ task.description }}</p>
                                </div>
                                <div class="flex items-center space-x-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UButton icon="i-heroicons-pencil" size="md" color="neutral" variant="ghost" @click="openEditModal(task)" />
                                    <UButton icon="i-heroicons-trash" size="md" color="error" variant="ghost" @click="confirmDeleteTask(task.id)" />
                                </div>
                            </div>

                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                <UBadge v-if="task.deadline" color="info" variant="subtle" size="sm" class="font-medium">
                                    <UIcon name="i-heroicons-calendar" class="mr-1 w-3 h-3" />
                                    {{ getRelativeTimeLabel(Number(task.deadline.microsSinceUnixEpoch)/1000) }}
                                </UBadge>
                                
                                <UBadge :color="task.priority?.tag === 'High' ? 'error' : task.priority?.tag === 'Medium' ? 'warning' : task.priority?.tag === 'Low' ? 'success' : 'neutral'" variant="subtle" size="sm" class="font-medium">
                                    {{ task.priority?.tag || 'Medium' }}
                                </UBadge>

                                <UBadge v-if="task.categoryId" color="primary" variant="subtle" size="sm" class="font-medium flex items-center">
                                    <span class="mr-1 text-[10px] w-3 h-3">{{ getCategory(task.categoryId)?.icon || '🏷️' }}</span>
                                    <span>{{ getCategory(task.categoryId)?.name }}</span>
                                </UBadge>

                                <UBadge v-if="task.difficulty" color="warning" variant="subtle" size="sm" title="Tingkat Kesulitan" class="font-medium">
                                    <UIcon name="i-heroicons-bolt" class="mr-1 w-3 h-3" />
                                    Lvl {{ task.difficulty }}
                                </UBadge>
                                
                                <UBadge v-if="task.effort" color="info" variant="subtle" size="sm" title="Estimasi" class="font-medium">
                                    <UIcon name="i-heroicons-clock" class="mr-1 w-3 h-3" />
                                    {{ task.effort }}m
                                </UBadge>

                                <UBadge v-for="tag in task.tags || []" :key="tag" color="neutral" variant="subtle" size="sm" class="font-medium">
                                    #{{ tag }}
                                </UBadge>
                            </div>
                        </div>
                    </div>
                </div>
            </UCard>

            <!-- Col 2: Completed -->
            <UCard class="flex flex-col h-[calc(100vh-16rem)] opacity-75" :ui="{ body: 'p-0 sm:p-0 flex-1 overflow-y-auto' }">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-gray-600 dark:text-gray-400 flex items-center">
                            Selesai
                            <UBadge color="neutral" variant="subtle" class="ml-2">{{ completedTasks.length }}</UBadge>
                        </h3>
                    </div>
                </template>
                
                <div v-if="completedTasks.length === 0" class="p-8 text-center text-gray-500">
                    Belum ada tugas yang diselesaikan.
                </div>

                <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                    <div v-for="task in paginatedCompletedTasks" :key="task.id.toString()" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group flex items-start gap-4">
                        <UCheckbox 
                            :model-value="task.isCompleted" 
                            @update:model-value="toggleCompletion(task.id)"
                            class="mt-1"
                            color="primary"
                        />
                        
                        <div class="flex-1 min-w-0 opacity-60">
                            <div class="flex items-start justify-between mb-1">
                                <h4 class="text-base font-medium text-gray-500 dark:text-gray-400 line-through cursor-pointer pr-4" @click="openEditModal(task)">
                                    {{ task.name }}
                                </h4>
                                <div class="flex items-center space-x-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UButton icon="i-heroicons-trash" size="md" color="error" variant="ghost" @click="confirmDeleteTask(task.id)" />
                                </div>
                            </div>
                            <!-- Minimal info for completed tasks -->
                             <div class="flex flex-wrap items-center gap-2 mt-1">
                                <UBadge v-if="task.categoryId" color="neutral" variant="subtle" size="sm" class="font-medium flex items-center">
                                    <span class="mr-1 text-xs grayscale">{{ getCategory(task.categoryId)?.icon || '🏷️' }}</span>
                                    <span>{{ getCategory(task.categoryId)?.name }}</span>
                                </UBadge>
                                
                                <UBadge v-for="tag in task.tags || []" :key="tag" color="neutral" variant="subtle" size="sm" class="font-medium">
                                    #{{ tag }}
                                </UBadge>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer with Pagination -->
                <template #footer v-if="completedTasks.length > completedItemsPerPage">
                    <div class="flex justify-center p-2">
                        <UPagination 
                            v-model:page="completedPage" 
                            :total="completedTasks.length" 
                            :items-per-page="completedItemsPerPage" 
                            size="sm"
                            :sibling-count="1"
                            show-edges
                        />
                    </div>
                </template>
            </UCard>
        </div>

        <!-- Task Creation Slideover / Modal (using slideover for forms with many inputs is cleaner) -->
        <USlideover 
            v-model:open="isModalOpen"
            :title="modalMode === 'create' ? 'Buat Tugas Baru' : 'Edit Tugas'"
        >
            <template #body>
                <div class="space-y-6">
                    <UFormField label="Nama Tugas" name="name" required>
                        <UInput v-model="formState.name" placeholder="Mis. Menyelesaikan laporan bulanan..." autofocus class="w-full" />
                    </UFormField>

                    <UFormField label="Deskripsi" name="description">
                        <UTextarea v-model="formState.description" placeholder="Catatan tambahan (opsional)" :rows="3" class="w-full" />
                    </UFormField>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <UFormField label="Deadline">
                           <UInput type="datetime-local" v-model="formState.deadline" class="w-full" />
                        </UFormField>
                        
                        <UFormField label="Kategori">
                            <USelectMenu 
                                v-model="formState.categoryId" 
                                :items="categories ? Array.from(categories) : []" 
                                value-key="id" 
                                label-key="name"
                                placeholder="Pilih Kategori"
                                class="w-full"
                            >
                                <template #leading>
                                    <span v-if="formState.categoryId && getCategory(formState.categoryId)" class="text-lg w-4 h-4 ml-1 flex items-center justify-center">{{ getCategory(formState.categoryId)!.icon }}</span>
                                </template>
                                <!-- Show emoji in select options dropdown as well -->
                                <template #item-leading="{ item }">
                                    <span class="text-lg w-4 h-4 flex items-center justify-center">{{ item.icon || '🏷️' }}</span>
                                </template>
                            </USelectMenu>
                        </UFormField>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <UFormField label="Prioritas">
                            <USelectMenu v-model="formState.priority" :items="['low', 'medium', 'high']" class="w-full" />
                        </UFormField>

                        <UFormField label="Estimasi (Menit)">
                            <UInput type="number" v-model="formState.effort" placeholder="Mis. 30" class="w-full" />
                        </UFormField>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <UFormField label="Kesulitan (1-5)">
                            <USelectMenu v-model="formState.difficulty" :items="optionsDifficulty" class="w-full" />
                        </UFormField>

                         <UFormField label="Tags">
                            <USelectMenu 
                                v-model="formState.tags" 
                                :items="availableTags" 
                                multiple 
                                create-item
                                @create="(val) => { if (!formState.tags.includes(val)) formState.tags.push(val) }"
                                placeholder="Pilih atau buat tag..." 
                                class="w-full"
                            />
                        </UFormField>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end w-full gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isModalOpen = false" />
                    <UButton color="primary" :label="modalMode === 'create' ? 'Simpan' : 'Perbarui'" @click="handleSaveTask" />
                </div>
            </template>
        </USlideover>

        <!-- Delete Confirmation Modal -->
        <UModal v-model:open="isDeleteTaskModalOpen" title="Hapus Tugas" description="Apakah Anda yakin ingin menghapus tugas ini?">
            <template #footer>
                <div class="flex justify-end gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteTaskModalOpen = false" />
                    <UButton color="error" label="Hapus" @click="executeDeleteTask" />
                </div>
            </template>
        </UModal>
    </div>
</template>
