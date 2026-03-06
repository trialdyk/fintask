import { getSupabase, requireUser } from '#server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })

  if (error) throw createError({ status: 500, statusText: error.message })

  return data
})
