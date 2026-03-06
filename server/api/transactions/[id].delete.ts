import { getSupabase, requireUser } from '#server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const id = getRouterParam(event, 'id')

  // Fetch transaction first to know the amount & type for balance correction
  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('amount, type, wallet_id')
    .eq('id', Number(id))
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !tx) throw createError({ status: 404, statusText: 'Transaksi tidak ditemukan' })

  // Delete the transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', Number(id))
    .eq('user_id', user.id)

  if (error) throw createError({ status: 400, statusText: error.message })

  // ─── Reverse the wallet balance adjustment ──────────────────────────
  // If it was an expense, add the amount back. If income, subtract it back.
  const reverseDelta = tx.type === 'expense' ? tx.amount : tx.type === 'income' ? -tx.amount : 0

  if (reverseDelta !== 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', tx.wallet_id)
      .eq('user_id', user.id)
      .single()

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + reverseDelta })
        .eq('id', tx.wallet_id)
        .eq('user_id', user.id)
    }
  }

  return { success: true }
})
