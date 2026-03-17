import { getSupabase, requireUser } from '#server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const id = getRouterParam(event, 'id')

  // Fetch transaction first to know the amount & type for balance correction
  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('id, amount, type, wallet_id, linked_transaction_id')
    .eq('id', Number(id))
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !tx) throw createError({ status: 404, statusText: 'Transaksi tidak ditemukan' })

  // Find linked transaction if any
  let linkedTx = null
  if (tx.linked_transaction_id) {
    const { data: ltx } = await supabase
      .from('transactions')
      .select('id, amount, type, wallet_id')
      .eq('id', tx.linked_transaction_id)
      .eq('user_id', user.id)
      .single()
    linkedTx = ltx
  }

  // Delete the transaction(s)
  const idsToDelete = [tx.id]
  if (linkedTx) idsToDelete.push(linkedTx.id)

  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', idsToDelete)
    .eq('user_id', user.id)

  if (error) throw createError({ status: 400, statusText: error.message })

  // ─── Reverse the wallet balance adjustment ──────────────────────────
  const reverseBalance = async (transaction: { type: string; amount: number; wallet_id: number }) => {
    // If it was an expense or transfer, we ADD back. If income, we SUBTRACT back.
    const reverseDelta = transaction.type === 'expense' || transaction.type === 'transfer' 
      ? transaction.amount 
      : transaction.type === 'income' 
      ? -transaction.amount 
      : 0

    if (reverseDelta !== 0) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', transaction.wallet_id)
        .eq('user_id', user.id)
        .single()

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + reverseDelta })
          .eq('id', transaction.wallet_id)
          .eq('user_id', user.id)
      }
    }
  }

  await Promise.all([
    reverseBalance(tx),
    ...(linkedTx ? [reverseBalance(linkedTx)] : []),
  ])

  return { success: true }
})
