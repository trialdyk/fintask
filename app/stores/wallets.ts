import { defineStore } from 'pinia'
import type { Wallet, WalletInsert, WalletUpdate } from '~/types/database.types'

export const useWalletsStore = defineStore('wallets', () => {
  const items = ref<Wallet[]>([])
  const loading = ref(false)
  const fetched = ref(false)
  let fetchPromise: Promise<void> | null = null

  async function fetchAll() {
    if (fetched.value) return
    if (fetchPromise) return fetchPromise
    fetchPromise = (async () => {
      loading.value = true
      try {
        items.value = await $fetch<Wallet[]>('/api/wallets')
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

  async function create(payload: Omit<WalletInsert, 'user_id'>) {
    const data = await $fetch<Wallet>('/api/wallets', { method: 'POST', body: payload })
    items.value.push(data)
    return data
  }

  async function update(id: number, payload: WalletUpdate) {
    const data = await $fetch<Wallet>(`/api/wallets/${id}`, { method: 'PUT', body: payload })
    const idx = items.value.findIndex(w => w.id === id)
    if (idx !== -1) items.value[idx] = data
    return data
  }

  async function remove(id: number) {
    await $fetch(`/api/wallets/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(w => w.id !== id)
  }

  function getById(id: number | undefined | null): Wallet | undefined {
    if (!id) return undefined
    return items.value.find(w => w.id === id)
  }

  function $reset() {
    items.value = []
    fetched.value = false
    loading.value = false
  }

  return { items, loading, fetched, fetchAll, refresh, create, update, remove, getById, $reset }
})
