import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY. Never import this file from a 'use client' component —
// the service role key must never reach the browser.
//
// Built lazily (only when actually called), not at import time — this
// avoids build failures if Vercel inspects this route before env vars
// are attached to the build/runtime context.
let _client = null

export function getSupabaseAdmin() {
  if (_client) return _client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Set both in Vercel → Project → Settings → Environment Variables.'
    )
  }

  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _client
}