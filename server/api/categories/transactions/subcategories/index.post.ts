import { z } from 'zod'
import { getSupabase, requireUser } from '#server/utils/supabase'

const schema = z.object({
  name: z.string().min(1, 'Nama rincian wajib diisi'),
  category_id: z.number(),
  icon: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const body = await readValidatedBody(event, schema.parse)

  const { data, error } = await supabase
    .from('transaction_subcategories')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  return data
})
