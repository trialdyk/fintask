import { z } from 'zod'
import { getSupabase, requireUser } from '#server/utils/supabase'

const schema = z.object({
  name: z.string().min(1, 'Nama tugas wajib diisi'),
  deadline: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  effort: z.number().nullable().optional(),
  difficulty: z.number().nullable().optional(),
  category_id: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  is_completed: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = await getSupabase(event)
  const body = await readValidatedBody(event, schema.parse)

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) throw createError({ status: 400, statusText: error.message })

  return data
})
