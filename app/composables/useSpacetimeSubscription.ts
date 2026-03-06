import { useSpacetimeDB } from 'spacetimedb/vue'
import type { DbConnection } from '../../src/module_bindings'

// Global registry of pending subscriptions
const pendingQueries = new Set<string>()
let isSubscribed = false

export const useSpacetimeSubscription = (queries: string[]) => {
  for (const q of queries) {
    pendingQueries.add(q)
  }

  if (!isSubscribed) {
    trySubscribe()
  }
}

function trySubscribe() {
  try {
    const state = useSpacetimeDB()
    if (state.isActive && pendingQueries.size > 0) {
      const conn = state.getConnection<DbConnection>()
      if (conn) {
        const allQueries = Array.from(pendingQueries)
        conn.subscriptionBuilder()
          .subscribe(allQueries)
        isSubscribed = true
      }
    }
  } catch {
  }
}
