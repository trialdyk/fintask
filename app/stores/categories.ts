import { defineStore } from 'pinia'
import type {
  TransactionCategory, TransactionCategoryInsert,
  TransactionSubcategory, TransactionSubcategoryInsert,
  TaskCategory, TaskCategoryInsert,
} from '~/types/database.types'

export const useCategoriesStore = defineStore('categories', () => {
  // ─── Transaction Categories ──────────────────────────────────────
  const txCategories = ref<TransactionCategory[]>([])
  const txSubcategories = ref<TransactionSubcategory[]>([])

  // ─── Task Categories ─────────────────────────────────────────────
  const taskCategories = ref<TaskCategory[]>([])

  const loading = ref(false)
  const fetched = ref(false)

  // ─── Fetch All ────────────────────────────────────────────────────
  async function fetchAll() {
    if (fetched.value) return
    loading.value = true
    try {
      const [txData, taskData] = await Promise.all([
        $fetch<{ categories: TransactionCategory[]; subcategories: TransactionSubcategory[] }>('/api/categories/transactions'),
        $fetch<TaskCategory[]>('/api/categories/tasks'),
      ])
      txCategories.value = txData.categories
      txSubcategories.value = txData.subcategories
      taskCategories.value = taskData
      fetched.value = true
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    fetched.value = false
    await fetchAll()
  }

  // ─── Transaction Category CRUD ─────────────────────────────────
  async function createTxCategory(payload: Omit<TransactionCategoryInsert, 'user_id'>) {
    const data = await $fetch<TransactionCategory>('/api/categories/transactions', { method: 'POST', body: payload })
    txCategories.value.push(data)
    return data
  }

  async function updateTxCategory(id: number, payload: Partial<TransactionCategory>) {
    const data = await $fetch<TransactionCategory>(`/api/categories/transactions/${id}`, { method: 'PUT', body: payload })
    const idx = txCategories.value.findIndex(c => c.id === id)
    if (idx !== -1) txCategories.value[idx] = data
    return data
  }

  async function removeTxCategory(id: number) {
    await $fetch(`/api/categories/transactions/${id}`, { method: 'DELETE' })
    txCategories.value = txCategories.value.filter(c => c.id !== id)
    txSubcategories.value = txSubcategories.value.filter(s => s.category_id !== id)
  }

  // ─── Transaction Subcategory CRUD ──────────────────────────────
  async function createTxSubcategory(payload: Omit<TransactionSubcategoryInsert, 'user_id'>) {
    const data = await $fetch<TransactionSubcategory>('/api/categories/transactions/subcategories', { method: 'POST', body: payload })
    txSubcategories.value.push(data)
    return data
  }

  async function updateTxSubcategory(id: number, payload: Partial<TransactionSubcategory>) {
    const data = await $fetch<TransactionSubcategory>(`/api/categories/transactions/subcategories/${id}`, { method: 'PUT', body: payload })
    const idx = txSubcategories.value.findIndex(s => s.id === id)
    if (idx !== -1) txSubcategories.value[idx] = data
    return data
  }

  async function removeTxSubcategory(id: number) {
    await $fetch(`/api/categories/transactions/subcategories/${id}`, { method: 'DELETE' })
    txSubcategories.value = txSubcategories.value.filter(s => s.id !== id)
  }

  // ─── Task Category CRUD ────────────────────────────────────────
  async function createTaskCategory(payload: Omit<TaskCategoryInsert, 'user_id'>) {
    const data = await $fetch<TaskCategory>('/api/categories/tasks', { method: 'POST', body: payload })
    taskCategories.value.push(data)
    return data
  }

  async function updateTaskCategory(id: number, payload: Partial<TaskCategory>) {
    const data = await $fetch<TaskCategory>(`/api/categories/tasks/${id}`, { method: 'PUT', body: payload })
    const idx = taskCategories.value.findIndex(c => c.id === id)
    if (idx !== -1) taskCategories.value[idx] = data
    return data
  }

  async function removeTaskCategory(id: number) {
    await $fetch(`/api/categories/tasks/${id}`, { method: 'DELETE' })
    taskCategories.value = taskCategories.value.filter(c => c.id !== id)
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  function getTxCategoryById(id: number | null | undefined): TransactionCategory | undefined {
    if (!id) return undefined
    return txCategories.value.find(c => c.id === id)
  }

  function getTxSubcategoryById(id: number | null | undefined): TransactionSubcategory | undefined {
    if (!id) return undefined
    return txSubcategories.value.find(s => s.id === id)
  }

  function getTaskCategoryById(id: number | null | undefined): TaskCategory | undefined {
    if (!id) return undefined
    return taskCategories.value.find(c => c.id === id)
  }

  function getSubcategoriesForCategory(categoryId: number): TransactionSubcategory[] {
    return txSubcategories.value.filter(s => s.category_id === categoryId)
  }

  function $reset() {
    txCategories.value = []
    txSubcategories.value = []
    taskCategories.value = []
    fetched.value = false
    loading.value = false
  }

  return {
    txCategories, txSubcategories, taskCategories,
    loading, fetched,
    fetchAll, refresh,
    createTxCategory, updateTxCategory, removeTxCategory,
    createTxSubcategory, updateTxSubcategory, removeTxSubcategory,
    createTaskCategory, updateTaskCategory, removeTaskCategory,
    getTxCategoryById, getTxSubcategoryById, getTaskCategoryById, getSubcategoriesForCategory,
    $reset,
  }
})
