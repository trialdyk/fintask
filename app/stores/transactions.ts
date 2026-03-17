import { defineStore } from 'pinia'
import type { Transaction, TransactionInsert } from '~/types/database.types'

type TransactionCreatePayload = Omit<TransactionInsert, 'user_id'> & { to_wallet_id?: number }

export const useTransactionsStore = defineStore('transactions', () => {
  const items = ref<Transaction[]>([])
  const loading = ref(false)
  const fetched = ref(false)
  let fetchPromise: Promise<void> | null = null

  async function fetchAll() {
    if (fetched.value) return
    if (fetchPromise) return fetchPromise
    fetchPromise = (async () => {
      loading.value = true
      try {
        items.value = await $fetch<Transaction[]>('/api/transactions')
        fetched.value = true
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()
    return fetchPromise
  }

  async function refresh() {
    fetchPromise = null
    fetched.value = false
    await fetchAll()
  }

  async function create(payload: TransactionCreatePayload) {
    const data = await $fetch<Transaction>('/api/transactions', { method: 'POST', body: payload })
    items.value.unshift(data) // newest first
    return data
  }

  async function remove(id: number) {
    await $fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(t => t.id !== id)
  }

  function getById(id: number | undefined | null): Transaction | undefined {
    if (!id) return undefined
    return items.value.find(t => t.id === id)
  }

  function $reset() {
    items.value = []
    fetched.value = false
    loading.value = false
  }

  return { items, loading, fetched, fetchAll, refresh, create, remove, getById, $reset }
})
