import { z } from 'zod'
import { getSupabase, requireUser } from '#server/utils/supabase'

const schema = z.object({
  name: z.string().min(1, 'Nama dompet wajib diisi'),
  type: z.enum(['cash', 'bank', 'ewallet', 'credit_card']),
  balance: z.number().default(0),
  currency: z.enum(['IDR', 'USD']).default('IDR'),
  icon: z.string().default('💵'),
  color: z.string().default('emerald'),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const body = await readValidatedBody(event, schema.parse)

  const { data, error } = await supabase
    .from('wallets')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  return data
})
