import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'

/**
 * Get a typed Supabase client for server-side operations.
 * Uses the user's JWT from the Authorization header — RLS enforced.
 */
export async function getSupabase(event: H3Event) {
  return serverSupabaseClient<Database>(event)
}

/**
 * Extract and validate the authenticated user from the request.
 * Throws 401 if not authenticated.
 * Returns an object with `id` (the user UUID) for convenience.
 */
export async function requireUser(event: H3Event) {
  const claims = await serverSupabaseUser(event)
  // serverSupabaseUser returns JWT claims; user ID is in `sub` (or `id` in older versions)
  const userId = (claims as any)?.sub ?? (claims as any)?.id
  if (!userId) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }
  return { ...claims, id: userId as string }
}
