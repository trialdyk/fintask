import { defineStore } from 'pinia'
import type { Task, TaskInsert, TaskUpdate } from '~/types/database.types'

export const useTasksStore = defineStore('tasks', () => {
  const items = ref<Task[]>([])
  const loading = ref(false)
  const fetched = ref(false)

  async function fetchAll() {
    if (fetched.value) return
    loading.value = true
    try {
      items.value = await $fetch<Task[]>('/api/tasks')
      fetched.value = true
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    fetched.value = false
    await fetchAll()
  }

  async function create(payload: Omit<TaskInsert, 'user_id'>) {
    const data = await $fetch<Task>('/api/tasks', { method: 'POST', body: payload })
    items.value.unshift(data)
    return data
  }

  async function update(id: number, payload: TaskUpdate) {
    const data = await $fetch<Task>(`/api/tasks/${id}`, { method: 'PUT', body: payload })
    const idx = items.value.findIndex(t => t.id === id)
    if (idx !== -1) items.value[idx] = data
    return data
  }

  async function toggleCompletion(id: number, is_completed: boolean) {
    return update(id, { is_completed })
  }

  async function remove(id: number) {
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(t => t.id !== id)
  }

  function getById(id: number | undefined | null): Task | undefined {
    if (!id) return undefined
    return items.value.find(t => t.id === id)
  }

  const incomplete = computed(() => items.value.filter(t => !t.is_completed))
  const completed = computed(() => items.value.filter(t => t.is_completed))
  const incompleteCount = computed(() => incomplete.value.length)

  function $reset() {
    items.value = []
    fetched.value = false
    loading.value = false
  }

  return {
    items, loading, fetched,
    fetchAll, refresh, create, update, toggleCompletion, remove, getById,
    incomplete, completed, incompleteCount,
    $reset,
  }
})
