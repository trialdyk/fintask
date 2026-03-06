import { getSupabase, requireUser } from '#server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const id = getRouterParam(event, 'id')

  const { error } = await supabase
    .from('transaction_subcategories')
    .delete()
    .eq('id', Number(id))
    .eq('user_id', user.id)

  if (error) throw createError({ status: 400, statusText: error.message })

  return { success: true }
})
