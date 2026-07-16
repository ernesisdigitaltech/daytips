import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Maps a charged amount to a plan by comparing against the prices you set
// on your two Flutterwave recurring Payment Links. Adjust these two env vars
// to match exactly what you set in the Flutterwave dashboard.
const WEEKLY_AMOUNT = Number(process.env.FLUTTERWAVE_WEEKLY_AMOUNT)
const MONTHLY_AMOUNT = Number(process.env.FLUTTERWAVE_MONTHLY_AMOUNT)

function resolvePlan(amount) {
  const amt = Number(amount)
  if (amt >= MONTHLY_AMOUNT) return { plan: 'monthly', days: 30 }
  if (amt >= WEEKLY_AMOUNT) return { plan: 'weekly', days: 7 }
  return null
}

/**
 * Applies (or extends) a Pro subscription for the user matching `email`.
 * Called from both the payment-return verify route and the renewal webhook,
 * so renewals correctly extend from the current expiry rather than from "now".
 */
export async function applyProSubscription({ email, amount, txRef }) {
  const resolved = resolvePlan(amount)
  if (!resolved) {
    return { success: false, reason: `Amount ${amount} did not match a known plan price` }
  }

  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_expires_at')
    .eq('email', email)
    .single()

  if (findError || !profile) {
    return { success: false, reason: `No profile found for email ${email}` }
  }

  // Extend from current expiry if still active, otherwise from now
  const now = new Date()
  const currentExpiry = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now
  const newExpiry = new Date(base.getTime() + resolved.days * 24 * 60 * 60 * 1000)

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      subscription_expires_at: newExpiry.toISOString(),
      flutterwave_tx_ref: txRef || null,
    })
    .eq('id', profile.id)

  if (updateError) {
    return { success: false, reason: updateError.message }
  }

  return { success: true, plan: resolved.plan, expiresAt: newExpiry.toISOString() }
}