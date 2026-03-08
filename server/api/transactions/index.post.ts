import { z } from 'zod'
import { getSupabase, requireUser } from '#server/utils/supabase'

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  type: z.enum(['income', 'expense', 'transfer', 'correction']),
  amount: z.number().positive('Nominal harus positif'),
  wallet_id: z.number(),
  category_id: z.number().nullable().optional(),
  subcategory_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  timestamp: z.string().optional(),
  to_wallet_id: z.number().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const body = await readValidatedBody(event, schema.parse)

  // Remove to_wallet_id so we don't send unknown column to supabase
  const { to_wallet_id, ...txBody } = body

  // Insert transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...txBody,
      user_id: user.id,
      timestamp: body.timestamp || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  // Update fromWallet balance (for expense/income/transfer-out)
  const delta = body.type === 'expense' ? -body.amount : body.type === 'income' ? body.amount : body.type === 'transfer' ? -body.amount : 0

  if (delta !== 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', body.wallet_id)
      .eq('user_id', user.id)
      .single()

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + delta })
        .eq('id', body.wallet_id)
        .eq('user_id', user.id)
    }
  }

  // Handle transfer specifics
  if (body.type === 'transfer' && body.to_wallet_id) {
    // Insert linked income transaction
    const { data: incData, error: incError } = await supabase
      .from('transactions')
      .insert({
        title: body.title,
        type: 'income',
        amount: body.amount,
        wallet_id: body.to_wallet_id,
        user_id: user.id,
        timestamp: body.timestamp || new Date().toISOString(),
        notes: body.notes || 'Transfer masuk',
        linked_transaction_id: data.id,
      })
      .select()
      .single()

    if (incError) throw createError({ status: 500, statusText: 'Transfer destination creation failed' })

    // Link original transfer back to the income tx
    await supabase
      .from('transactions')
      .update({ linked_transaction_id: incData.id })
      .eq('id', data.id)

    // Update toWallet balance
    const { data: toWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', body.to_wallet_id)
      .eq('user_id', user.id)
      .single()

    if (toWallet) {
      await supabase
        .from('wallets')
        .update({ balance: toWallet.balance + body.amount })
        .eq('id', body.to_wallet_id)
        .eq('user_id', user.id)
    }
  }

  return data
})
