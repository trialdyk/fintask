import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useTable } from 'spacetimedb/vue'
import { tables } from '../../src/module_bindings'
import { formatCurrency, convertToIDR } from '~/utils/currency'

// --- Helper ---
export const getTag = (val: any): string => {
  if (typeof val === 'string') return val.toLowerCase()
  if (val && typeof val === 'object' && 'tag' in val) return String(val.tag).toLowerCase()
  return ''
}

export const getBadgeColorClasses = (colorName?: string | null) => {
    const c = colorName || 'neutral'
    const colorMap: Record<string, string> = {
        neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-900',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-200 dark:ring-orange-900',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-900',
        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-900',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-900',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900',
        teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 ring-teal-200 dark:ring-teal-900',
        cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 ring-cyan-200 dark:ring-cyan-900',
        sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 ring-sky-200 dark:ring-sky-900',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-900',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 ring-indigo-200 dark:ring-indigo-900',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 ring-violet-200 dark:ring-violet-900',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 ring-purple-200 dark:ring-purple-900',
        pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 ring-pink-200 dark:ring-pink-900',
    }
    return colorMap[c] || colorMap.neutral
}

export const getHexColor = (colorName?: string): string => {
  const c = colorName || 'neutral'
  const colorMap: Record<string, string> = {
    neutral: '#64748b',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    pink: '#ec4899',
  }
  return colorMap[c] || colorMap.neutral || '#64748b'
}

export const formatCompact = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`
  return n.toString()
}

export const formatDateShort = (timestamp: any) => {
  const micros = timestamp?.microsSinceUnixEpoch || timestamp;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(Number(micros / 1000n)))
}

export type Period = '1m' | '2m' | '3m' | '6m' | '1y' | 'custom'

export function useStatisticsData(
  selectedPeriod: Ref<Period>,
  customStart: Ref<string>,
  customEnd: Ref<string>
) {
  // Data subscriptions
  const [transactions] = useTable(tables.Transaction)
  const [wallets] = useTable(tables.Wallet)
  const [categories] = useTable(tables.TransactionCategory)

  // Period range
  const periodRange = computed(() => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (selectedPeriod.value) {
      case '1m': start = new Date(now.getFullYear(), now.getMonth(), 1); break
      case '2m':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case '3m': start = new Date(now.getFullYear(), now.getMonth() - 2, 1); break
      case '6m': start = new Date(now.getFullYear(), now.getMonth() - 5, 1); break
      case '1y': start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1); break
      case 'custom':
        start = new Date(customStart.value + 'T00:00:00')
        end = new Date(customEnd.value + 'T23:59:59')
        break
      default: start = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    return { start, end }
  })

  // Filtered transactions
  const filteredTx = computed(() => {
    if (!transactions.value) return []
    const { start, end } = periodRange.value
    return transactions.value.filter(tx => {
      const d = new Date(Number(tx.timestamp.microsSinceUnixEpoch / 1000n))
      return d >= start && d <= end
    })
  })

  const daysInPeriod = computed(() => {
    const { start, end } = periodRange.value
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  })

  return {
    transactions,
    wallets,
    categories,
    periodRange,
    filteredTx,
    daysInPeriod,
  }
}
