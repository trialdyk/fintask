import { getSupabase, requireUser } from '#server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const query = getQuery(event)

  const limit = query.limit ? Number(query.limit) : undefined
  const offset = query.offset ? Number(query.offset) : 0

  let req = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })

  if (limit !== undefined) {
    req = req.range(offset, offset + limit - 1)
  }

  const { data, error } = await req

  if (error) throw createError({ status: 500, statusText: error.message })

  return data
})
