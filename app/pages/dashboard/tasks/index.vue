<script setup lang="ts">
import { getRelativeTimeLabel } from '~/utils/date'
import type { Task, TaskPriority } from '~/types/database.types'

const toast = useAppToast()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

const selectedDeadline = ref('Semua')
const deadlineOptions = ['Hari Ini', '< 3 Hari', '1 Minggu', 'Semua', 'Terlewat']
const selectedTags = ref<string[]>([])
const selectedPriority = ref<string>('Semua') 
const selectedDifficulty = ref<string>('Semua')
const priorityOptions = ['Semua', 'low', 'medium', 'high']
const difficultyOptions = ['Semua', '1', '2', '3', '4', '5']

const availableTags = computed(() => {
    const tags = new Set<string>()
    for (const t of tasksStore.items) {
        if (t.tags) t.tags.forEach(tag => tags.add(tag))
    }
    return Array.from(tags)
})
const optionsDifficulty = [1, 2, 3, 4, 5]

const filteredTasks = computed(() => {
    return tasksStore.items.filter(task => {
        if (selectedPriority.value !== 'Semua' && task.priority !== selectedPriority.value) return false
        if (selectedDifficulty.value !== 'Semua' && task.difficulty?.toString() !== selectedDifficulty.value) return false
        if (selectedTags.value.length > 0) {
            const hasTag = task.tags?.some(tag => selectedTags.value.includes(tag))
            if (!hasTag) return false
        }
        if (selectedDeadline.value !== 'Semua') {
            const deadlineMs = task.deadline ? new Date(task.deadline).getTime() : 0
            const relativeLabel = getRelativeTimeLabel(deadlineMs)
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

const uncompletedTasks = computed(() => filteredTasks.value.filter(t => !t.is_completed))
const completedTasks = computed(() => filteredTasks.value.filter(t => t.is_completed))

const completedPage = ref(1)
const completedItemsPerPage = 20
const paginatedCompletedTasks = computed(() => {
    const start = (completedPage.value - 1) * completedItemsPerPage
    return completedTasks.value.slice(start, start + completedItemsPerPage)
})
watch(completedTasks, () => {
    if (paginatedCompletedTasks.value.length === 0 && completedPage.value > 1) {
        completedPage.value = Math.max(1, Math.ceil(completedTasks.value.length / completedItemsPerPage))
    }
})

const toggleCompletion = async (taskId: number) => {
    try {
        const task = tasksStore.getById(taskId)
        if (!task) return
        await tasksStore.toggleCompletion(taskId, !task.is_completed)
        toast.success('Berhasil', 'Status tugas diperbarui')
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    }
}

const isDeleteTaskModalOpen = ref(false)
const taskToDelete = ref<number | null>(null)

const confirmDeleteTask = (id: number) => {
    taskToDelete.value = id
    isDeleteTaskModalOpen.value = true
}

const executeDeleteTask = async () => {
    if (taskToDelete.value === null) return
    deleting.value = true
    try {
        await tasksStore.remove(taskToDelete.value)
        toast.success('Berhasil', 'Tugas dihapus')
    } catch (e: any) {
        toast.error('Gagal', e.data?.statusMessage || e.message)
    } finally {
        deleting.value = false
        isDeleteTaskModalOpen.value = false
        taskToDelete.value = null
    }
}

const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)

const getLocalDatetimeLocal = (date?: Date) => {
    const base = date || new Date()
    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
}

const formState = ref({
    name: '',
    deadline: getLocalDatetimeLocal() as string | undefined,
    priority: 'medium' as TaskPriority,
    effort: undefined as number | undefined,
    difficulty: undefined as number | undefined,
    categoryId: undefined as number | undefined,
    description: '',
    tags: [] as string[]
})

const openCreateModal = () => {
    modalMode.value = 'create'
    formState.value = { name: '', deadline: getLocalDatetimeLocal(), priority: 'medium', effort: undefined, difficulty: undefined, categoryId: undefined, description: '', tags: [] }
    editingId.value = null
    isModalOpen.value = true
}

const openEditModal = (task: Task) => {
    modalMode.value = 'edit'
    formState.value = {
        name: task.name,
        deadline: task.deadline ? getLocalDatetimeLocal(new Date(task.deadline)) : undefined,
        priority: task.priority || 'medium',
        effort: task.effort ?? undefined,
        difficulty: task.difficulty ?? undefined,
        categoryId: task.category_id ?? undefined,
        description: task.description || '',
        tags: [...(task.tags || [])]
    }
    editingId.value = task.id
    isModalOpen.value = true
}

const saving = ref(false)
const deleting = ref(false)

const handleSaveTask = async () => {
    if (!formState.value.name) {
        toast.error('Gagal', 'Nama tugas wajib diisi')
        return
    }
    saving.value = true
    try {
        const payload = {
            name: formState.value.name,
            deadline: formState.value.deadline ? new Date(formState.value.deadline).toISOString() : null,
            priority: formState.value.priority,
            effort: formState.value.effort ? Number(formState.value.effort) : null,
            difficulty: formState.value.difficulty ? Number(formState.value.difficulty) : null,
            category_id: formState.value.categoryId || null,
            description: formState.value.description || null,
            tags: formState.value.tags || []
        }
        if (modalMode.value === 'create') {
            await tasksStore.create({ ...payload, is_completed: false })
            toast.success('Berhasil', 'Tugas baru dibuat')
        } else if (editingId.value !== null) {
            await tasksStore.update(editingId.value, payload)
            toast.success('Berhasil', 'Tugas diperbarui')
        }
        isModalOpen.value = false
    } catch (err: any) {
        toast.error('Error', err.data?.statusMessage || err.message)
    } finally {
        saving.value = false
    }
}

const getCategory = (id?: number | null) => categoriesStore.getTaskCategoryById(id)
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
        <div v-if="tasksStore.loading" class="flex justify-center items-center py-24">
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
                            :model-value="task.is_completed" 
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
                                    {{ getRelativeTimeLabel(new Date(task.deadline).getTime()) }}
                                </UBadge>
                                
                                <UBadge :color="task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : task.priority === 'low' ? 'success' : 'neutral'" variant="subtle" size="sm" class="font-medium capitalize">
                                    {{ task.priority || 'medium' }}
                                </UBadge>

                                <UBadge v-if="task.category_id" color="primary" variant="subtle" size="sm" class="font-medium flex items-center">
                                    <span class="mr-1 text-[10px] w-3 h-3">{{ getCategory(task.category_id)?.icon || '🏷️' }}</span>
                                    <span>{{ getCategory(task.category_id)?.name }}</span>
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
                            :model-value="task.is_completed" 
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
                                <UBadge v-if="task.category_id" color="neutral" variant="subtle" size="sm" class="font-medium flex items-center">
                                    <span class="mr-1 text-xs grayscale">{{ getCategory(task.category_id)?.icon || '🏷️' }}</span>
                                    <span>{{ getCategory(task.category_id)?.name }}</span>
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
                                :items="categoriesStore.taskCategories" 
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
                    <UButton color="primary" :label="modalMode === 'create' ? 'Simpan' : 'Perbarui'" @click="handleSaveTask" :loading="saving" :disabled="saving" />
                </div>
            </template>
        </USlideover>

        <!-- Delete Confirmation Modal -->
        <UModal :dismissible="false" v-model:open="isDeleteTaskModalOpen" title="Hapus Tugas" description="Apakah Anda yakin ingin menghapus tugas ini?">
            <template #footer>
                <div class="flex justify-end gap-3 p-4">
                    <UButton color="neutral" variant="ghost" label="Batal" @click="isDeleteTaskModalOpen = false" :disabled="deleting" />
                    <UButton color="error" label="Hapus" @click="executeDeleteTask" :loading="deleting" :disabled="deleting" />
                </div>
            </template>
        </UModal>
    </div>
</template>
