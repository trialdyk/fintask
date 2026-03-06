import type { Transaction, TransactionCategory, TransactionSubcategory, Wallet } from '~/types/database.types'

// ─── Types ────────────────────────────────────────────────────────────
export interface MonthRange {
  start: Date
  end: Date
  year: number
  month: number // 0-indexed
  label: string
  daysInMonth: number
}

export interface PeriodTotals {
  income: number
  expense: number
  net: number
  txCount: number
}

export interface CategoryStat {
  id: number | null
  name: string
  icon: string
  color: string
  amount: number
  percent: number
  prevAmount: number
  pctChange: number | null
  avgDaily: number
  avgMonthly: number
  subcategories: SubcategoryStat[]
}

export interface SubcategoryStat {
  id: number | null
  name: string
  icon: string
  amount: number
  percent: number
  prevAmount: number
  pctChange: number | null
  avgDaily: number
  avgMonthly: number
}

export interface WalletStat {
  id: number
  name: string
  icon: string
  color: string
  currency: string
  balance: number
  balancePercent: number
  income: number
  expense: number
  net: number
  prevIncome: number
  prevExpense: number
  incomePctChange: number | null
  expensePctChange: number | null
  topCategories: { name: string; icon: string; amount: number }[]
}

export interface ComparisonInsight {
  icon: string
  text: string
  type: 'up' | 'down' | 'neutral'
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Build a MonthRange for a given year/month */
export function buildMonthRange(year: number, month: number): MonthRange {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)
  return {
    start,
    end,
    year,
    month,
    label: `${months[month]} ${year}`,
    daysInMonth: end.getDate()
  }
}

/** Filter transactions within a date range */
export function filterTxByRange(txs: Transaction[], range: MonthRange): Transaction[] {
  return txs.filter(tx => {
    const d = new Date(tx.timestamp)
    return d >= range.start && d <= range.end
  })
}

/** Compute totals for a set of transactions */
export function computeTotals(txs: Transaction[]): PeriodTotals {
  let income = 0, expense = 0
  for (const tx of txs) {
    if (tx.type === 'income') income += tx.amount
    else if (tx.type === 'expense') expense += tx.amount
  }
  return { income, expense, net: income - expense, txCount: txs.length }
}

/** Safe percentage change: ((current - prev) / prev) * 100 */
export function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null
  return Math.round(((current - prev) / prev) * 100)
}

/** Compute averages (daily, monthly) from a monthly total and days in that month */
export function computeAverages(total: number, daysInMonth: number) {
  return {
    avgDaily: Math.round(total / Math.max(daysInMonth, 1)),
    avgMonthly: total
  }
}

// ─── Main Composable ──────────────────────────────────────────────────

export function useInsights() {
  const transactionsStore = useTransactionsStore()
  const walletsStore = useWalletsStore()
  const categoriesStore = useCategoriesStore()

  // ─── Current & Previous Month Ranges ─────────────────────────────
  function getMonthRange(year: number, month: number) {
    return buildMonthRange(year, month)
  }

  function getPrevMonthRange(range: MonthRange): MonthRange {
    const m = range.month === 0 ? 11 : range.month - 1
    const y = range.month === 0 ? range.year - 1 : range.year
    return buildMonthRange(y, m)
  }

  function getSameMonthLastYear(range: MonthRange): MonthRange {
    return buildMonthRange(range.year - 1, range.month)
  }

  // ─── Category Breakdown ──────────────────────────────────────────
  function getCategoryBreakdown(
    txs: Transaction[],
    prevTxs: Transaction[],
    type: 'income' | 'expense',
    daysInPeriod: number,
    categories: TransactionCategory[],
    subcategories: TransactionSubcategory[]
  ): CategoryStat[] {
    const filtered = txs.filter(tx => tx.type === type)
    const prevFiltered = prevTxs.filter(tx => tx.type === type)
    const total = filtered.reduce((s, tx) => s + tx.amount, 0)

    // Group by category
    const catMap = new Map<number | null, Transaction[]>()
    for (const tx of filtered) {
      const key = tx.category_id ?? null
      if (!catMap.has(key)) catMap.set(key, [])
      catMap.get(key)!.push(tx)
    }

    // Previous period by category
    const prevCatMap = new Map<number | null, number>()
    for (const tx of prevFiltered) {
      const key = tx.category_id ?? null
      prevCatMap.set(key, (prevCatMap.get(key) || 0) + tx.amount)
    }

    const result: CategoryStat[] = []

    for (const [catId, catTxs] of catMap) {
      const cat = catId ? categories.find(c => c.id === catId) : null
      const amount = catTxs.reduce((s, tx) => s + tx.amount, 0)
      const prevAmount = prevCatMap.get(catId) || 0
      const avgs = computeAverages(amount, daysInPeriod)

      // Subcategory breakdown
      const subMap = new Map<number | null, Transaction[]>()
      for (const tx of catTxs) {
        const sk = tx.subcategory_id ?? null
        if (!subMap.has(sk)) subMap.set(sk, [])
        subMap.get(sk)!.push(tx)
      }

      // Prev subcategory amounts
      const prevSubMap = new Map<number | null, number>()
      for (const tx of prevFiltered.filter(t => t.category_id === catId)) {
        const sk = tx.subcategory_id ?? null
        prevSubMap.set(sk, (prevSubMap.get(sk) || 0) + tx.amount)
      }

      const subs: SubcategoryStat[] = []
      for (const [subId, subTxs] of subMap) {
        const sub = subId ? subcategories.find(s => s.id === subId) : null
        const subAmount = subTxs.reduce((s, tx) => s + tx.amount, 0)
        const prevSubAmount = prevSubMap.get(subId) || 0
        const subAvgs = computeAverages(subAmount, daysInPeriod)
        subs.push({
          id: subId,
          name: sub?.name || 'Lainnya',
          icon: sub?.icon || '📎',
          amount: subAmount,
          percent: amount > 0 ? Math.round((subAmount / amount) * 100) : 0,
          prevAmount: prevSubAmount,
          pctChange: pctChange(subAmount, prevSubAmount),
          ...subAvgs
        })
      }
      subs.sort((a, b) => b.amount - a.amount)

      result.push({
        id: catId,
        name: cat?.name || 'Lainnya',
        icon: cat?.icon || '📦',
        color: cat?.color || 'neutral',
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        prevAmount,
        pctChange: pctChange(amount, prevAmount),
        ...avgs,
        subcategories: subs
      })
    }

    result.sort((a, b) => b.amount - a.amount)
    return result
  }

  // ─── Wallet Stats ────────────────────────────────────────────────
  function getWalletStats(
    txs: Transaction[],
    prevTxs: Transaction[],
    wallets: Wallet[],
    categories: TransactionCategory[]
  ): WalletStat[] {
    const totalBalance = wallets.reduce((s, w) => s + Math.max(w.balance, 0), 0)

    return wallets.map(w => {
      const wTxs = txs.filter(tx => tx.wallet_id === w.id)
      const prevWTxs = prevTxs.filter(tx => tx.wallet_id === w.id)

      const income = wTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
      const expense = wTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
      const prevIncome = prevWTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
      const prevExpense = prevWTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)

      // Top 5 expense categories
      const catExpenseMap = new Map<number | null, number>()
      for (const tx of wTxs.filter(t => t.type === 'expense')) {
        const k = tx.category_id ?? null
        catExpenseMap.set(k, (catExpenseMap.get(k) || 0) + tx.amount)
      }
      const topCategories = [...catExpenseMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([catId, amount]) => {
          const cat = catId ? categories.find(c => c.id === catId) : null
          return { name: cat?.name || 'Lainnya', icon: cat?.icon || '📦', amount }
        })

      return {
        id: w.id,
        name: w.name,
        icon: w.icon,
        color: w.color,
        currency: w.currency,
        balance: w.balance,
        balancePercent: totalBalance > 0 ? Math.round((Math.max(w.balance, 0) / totalBalance) * 100) : 0,
        income,
        expense,
        net: income - expense,
        prevIncome,
        prevExpense,
        incomePctChange: pctChange(income, prevIncome),
        expensePctChange: pctChange(expense, prevExpense),
        topCategories
      }
    }).sort((a, b) => b.balance - a.balance)
  }

  // ─── Auto-Generated Insights ─────────────────────────────────────
  function generateComparisonInsights(
    txsA: Transaction[],
    txsB: Transaction[],
    categories: TransactionCategory[],
    subcategories: TransactionSubcategory[],
    labelA: string,
    labelB: string
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = []
    const totalsA = computeTotals(txsA)
    const totalsB = computeTotals(txsB)

    // Income change
    const incomePct = pctChange(totalsB.income, totalsA.income)
    if (incomePct !== null && incomePct !== 0) {
      insights.push({
        icon: '💰',
        text: `Pendapatan ${incomePct > 0 ? 'naik' : 'turun'} ${Math.abs(incomePct)}% dari Rp ${totalsA.income.toLocaleString('id-ID')} → Rp ${totalsB.income.toLocaleString('id-ID')}`,
        type: incomePct > 0 ? 'up' : 'down'
      })
    }

    // Expense change
    const expensePct = pctChange(totalsB.expense, totalsA.expense)
    if (expensePct !== null && expensePct !== 0) {
      insights.push({
        icon: '💸',
        text: `Pengeluaran ${expensePct > 0 ? 'naik' : 'turun'} ${Math.abs(expensePct)}% dari Rp ${totalsA.expense.toLocaleString('id-ID')} → Rp ${totalsB.expense.toLocaleString('id-ID')}`,
        type: expensePct > 0 ? 'up' : 'down'
      })
    }

    // Per-category expense changes (only notable ones: >= 20% change and >= 10k)
    const catMapA = new Map<number | null, number>()
    const catMapB = new Map<number | null, number>()
    for (const tx of txsA.filter(t => t.type === 'expense')) {
      catMapA.set(tx.category_id ?? null, (catMapA.get(tx.category_id ?? null) || 0) + tx.amount)
    }
    for (const tx of txsB.filter(t => t.type === 'expense')) {
      catMapB.set(tx.category_id ?? null, (catMapB.get(tx.category_id ?? null) || 0) + tx.amount)
    }

    const allCatIds = new Set([...catMapA.keys(), ...catMapB.keys()])
    const catInsights: { icon: string; text: string; type: 'up' | 'down'; absChange: number }[] = []

    for (const catId of allCatIds) {
      const amtA = catMapA.get(catId) || 0
      const amtB = catMapB.get(catId) || 0
      const pct = pctChange(amtB, amtA)
      if (pct !== null && Math.abs(pct) >= 20 && Math.abs(amtB - amtA) >= 10000) {
        const cat = catId ? categories.find(c => c.id === catId) : null
        const icon = cat?.icon || '📦'
        const name = cat?.name || 'Lainnya'
        catInsights.push({
          icon,
          text: `${name} ${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}% (Rp ${amtA.toLocaleString('id-ID')} → Rp ${amtB.toLocaleString('id-ID')})`,
          type: pct > 0 ? 'up' : 'down',
          absChange: Math.abs(amtB - amtA)
        })
      }
    }

    // Sort by absolute change, take top 8
    catInsights.sort((a, b) => b.absChange - a.absChange)
    insights.push(...catInsights.slice(0, 8))

    // Per-subcategory notable changes
    const subMapA = new Map<number | null, number>()
    const subMapB = new Map<number | null, number>()
    for (const tx of txsA.filter(t => t.type === 'expense')) {
      if (tx.subcategory_id) subMapA.set(tx.subcategory_id, (subMapA.get(tx.subcategory_id) || 0) + tx.amount)
    }
    for (const tx of txsB.filter(t => t.type === 'expense')) {
      if (tx.subcategory_id) subMapB.set(tx.subcategory_id, (subMapB.get(tx.subcategory_id) || 0) + tx.amount)
    }

    const allSubIds = new Set([...subMapA.keys(), ...subMapB.keys()])
    const subInsights: { icon: string; text: string; type: 'up' | 'down'; absChange: number }[] = []

    for (const subId of allSubIds) {
      if (subId === null) continue
      const amtA = subMapA.get(subId) || 0
      const amtB = subMapB.get(subId) || 0
      const pct = pctChange(amtB, amtA)
      if (pct !== null && Math.abs(pct) >= 30 && Math.abs(amtB - amtA) >= 5000) {
        const sub = subcategories.find(s => s.id === subId)
        const icon = sub?.icon || '📎'
        const name = sub?.name || 'Lainnya'
        subInsights.push({
          icon,
          text: `${name} ${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}% (Rp ${amtA.toLocaleString('id-ID')} → Rp ${amtB.toLocaleString('id-ID')})`,
          type: pct > 0 ? 'up' : 'down',
          absChange: Math.abs(amtB - amtA)
        })
      }
    }

    subInsights.sort((a, b) => b.absChange - a.absChange)
    insights.push(...subInsights.slice(0, 5))

    return insights
  }

  return {
    // Stores
    transactions: computed(() => transactionsStore.items),
    wallets: computed(() => walletsStore.items),
    categories: computed(() => categoriesStore.txCategories),
    subcategories: computed(() => categoriesStore.txSubcategories),

    // Range builders
    getMonthRange,
    getPrevMonthRange,
    getSameMonthLastYear,

    // Data functions
    filterTxByRange,
    computeTotals,
    pctChange,
    computeAverages,
    getCategoryBreakdown,
    getWalletStats,
    generateComparisonInsights,
  }
}
