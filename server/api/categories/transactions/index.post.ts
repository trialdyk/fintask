import { z } from 'zod'
import { getSupabase, requireUser } from '#server/utils/supabase'

const schema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  type: z.enum(['income', 'expense']),
  icon: z.string().default('🍔'),
  color: z.string().default('red'),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const body = await readValidatedBody(event, schema.parse)

  const { data, error } = await supabase
    .from('transaction_categories')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  return data
})
