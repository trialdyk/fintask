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
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const body = await readValidatedBody(event, schema.parse)

  // Insert transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...body,
      user_id: user.id,
      timestamp: body.timestamp || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  // ─── Adjust wallet balance ──────────────────────────────────────────
  const delta = body.type === 'expense' ? -body.amount : body.type === 'income' ? body.amount : 0

  if (delta !== 0) {
    // Fetch current balance then update
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

  return data
})
