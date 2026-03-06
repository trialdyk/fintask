import { getSupabase, requireUser } from '#server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)

  const [catRes, subRes] = await Promise.all([
    supabase.from('transaction_categories').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('transaction_subcategories').select('*').eq('user_id', user.id).order('created_at'),
  ])

  if (catRes.error) throw createError({ status: 500, statusText: catRes.error.message })
  if (subRes.error) throw createError({ status: 500, statusText: subRes.error.message })

  return { categories: catRes.data, subcategories: subRes.data }
})
