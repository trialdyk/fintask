import { z } from 'zod'
import { getSupabase, requireUser } from '#server/utils/supabase'

const schema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['income', 'expense']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, schema.parse)

  const { data, error } = await supabase
    .from('transaction_categories')
    .update(body)
    .eq('id', Number(id))
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  return data
})
