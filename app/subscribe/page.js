'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const PRO_PLANS = [
  { id: 'weekly', label: 'Weekly', price: '₦3,000', period: '/ week', link: 'https://flutterwave.com/pay/daytips-weekly-pro' },
  { id: 'monthly', label: 'Monthly', price: '₦10,000', period: '/ month', link: 'https://flutterwave.com/pay/daytips-monthly-pro', badge: 'Best value' },
]

// TODO: Replace these with your real coin-pack Flutterwave payment links
const COIN_PACKAGES = [
  { coins: 20, price: '$2', link: 'https://flutterwave.com/pay/YOUR-LINK-20' },
  { coins: 50, price: '$5', link: 'https://flutterwave.com/pay/YOUR-LINK-50' },
  { coins: 100, price: '$9', link: 'https://flutterwave.com/pay/YOUR-LINK-100' },
  { coins: 200, price: '$17', link: 'https://flutterwave.com/pay/YOUR-LINK-200' },
  { coins: 500, price: '$40', link: 'https://flutterwave.com/pay/YOUR-LINK-500' },
]

// TODO: Replace with your real crypto wallet address
const CRYPTO_ADDRESS = 'your-wallet-address-here'

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <SubscribePageInner />
    </Suspense>
  )
}

function SubscribePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [subscriptionTier, setSubscriptionTier] = useState('free')
  const [subscriptionExpires, setSubscriptionExpires] = useState(null)
  const [loading, setLoading] = useState(true)

  const [coinsClaimed, setCoinsClaimed] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('flutterwave')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const upgradeFailed = searchParams.get('upgrade') === 'failed'

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', currentUser.id)
      .single()

    if (profile) {
      setSubscriptionTier(profile.subscription_tier)
      setSubscriptionExpires(profile.subscription_expires_at)
    }

    setLoading(false)
  }

  const isPro = subscriptionTier === 'pro' && subscriptionExpires && new Date(subscriptionExpires) > new Date()

  async function handleSubmitClaim(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const coinsNum = parseInt(coinsClaimed, 10)
    if (!coinsNum || coinsNum <= 0) {
      setMessage('Enter a valid number of coins.')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('purchase_claims').insert({
      user_id: user.id,
      coins_claimed: coinsNum,
      payment_method: paymentMethod,
    })

    setSubmitting(false)

    if (error) {
      setMessage('Something went wrong: ' + error.message)
    } else {
      setMessage('Submitted! The admin will review and credit your coins shortly.')
      setCoinsClaimed('')
    }
  }

  if (loading) {
    return <div style={styles.body}><p style={{ padding: 24, color: '#8B9A92' }}>Loading...</p></div>
  }

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/dashboard" style={styles.back}>← Dashboard</Link>
      </header>

      <main style={styles.main}>
        <h1 style={styles.h1}>Go Pro</h1>
        <p style={{ color: '#8B9A92', fontSize: 14, marginBottom: 28 }}>
          Unlimited access to every premium fixture, no coins needed.
        </p>

        {upgradeFailed && (
          <div style={styles.errorBanner}>
            Something went wrong verifying your last payment. If you were charged, it usually resolves within a
            few minutes — otherwise contact support.
          </div>
        )}

        {isPro ? (
          <div style={styles.proActiveCard}>
            <div style={styles.proActiveBadge}>✓ Pro Active</div>
            <p style={styles.proActiveText}>
              You have unlimited access to all premium fixtures until{' '}
              {new Date(subscriptionExpires).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        ) : (
          <div style={styles.planGrid}>
            {PRO_PLANS.map((plan) => (
              <a key={plan.id} href={plan.link} style={styles.planCard}>
                {plan.badge && <div style={styles.planBadge}>{plan.badge}</div>}
                <div style={styles.planLabel}>{plan.label}</div>
                <div style={styles.planPrice}>
                  {plan.price} <span style={styles.planPeriod}>{plan.period}</span>
                </div>
                <div style={styles.planCta}>Subscribe →</div>
              </a>
            ))}
          </div>
        )}

        <div style={styles.divider}>
          <span style={styles.dividerText}>or, no commitment</span>
        </div>

        <h2 style={styles.h2}>Buy Coins</h2>
        <p style={{ color: '#8B9A92', fontSize: 13, marginBottom: 20 }}>
          Prefer to pay as you go? Buy a coin pack and spend it on individual premium picks.
        </p>

        {/* COIN PACKAGES */}
        <div style={styles.packageGrid}>
          {COIN_PACKAGES.map((pkg) => (
            <a key={pkg.coins} href={pkg.link} target="_blank" rel="noopener noreferrer" style={styles.packageCard}>
              <div style={styles.packageCoins}>{pkg.coins}</div>
              <div style={{ fontSize: 11, color: '#8B9A92', textTransform: 'uppercase' }}>coins</div>
              <div style={styles.packagePrice}>{pkg.price}</div>
            </a>
          ))}
        </div>

        {/* CRYPTO OPTION */}
        <div style={styles.cryptoBox}>
          <div style={{ fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', marginBottom: 8 }}>
            Or pay with crypto
          </div>
          <div style={styles.cryptoAddress}>{CRYPTO_ADDRESS}</div>
          <p style={{ fontSize: 12, color: '#8B9A92', marginTop: 8 }}>
            Send the equivalent value for your chosen package, then submit the form below.
          </p>
        </div>

        {/* PURCHASE CLAIM FORM (coins only — Pro upgrades are verified automatically) */}
        <div style={styles.claimBox}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Tell us what you paid for coins</h3>
          <form onSubmit={handleSubmitClaim}>
            <label style={styles.label}>Payment method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={styles.input}
            >
              <option value="flutterwave">Flutterwave</option>
              <option value="crypto">Crypto</option>
            </select>

            <label style={styles.label}>How many coins did you pay for?</label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={coinsClaimed}
              onChange={(e) => setCoinsClaimed(e.target.value)}
              style={styles.input}
            />

            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Submitting...' : 'Notify admin'}
            </button>
          </form>

          {message && <p style={{ fontSize: 13, marginTop: 12, color: '#D4A017' }}>{message}</p>}
        </div>
      </main>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  h2: { fontSize: 18, fontWeight: 700, margin: '0 0 4px' },
  errorBanner: { background: 'rgba(166,58,46,0.12)', border: '1px solid rgba(166,58,46,0.4)', borderRadius: 10, padding: 14, fontSize: 13, color: '#F7F5EF', marginBottom: 24 },
  proActiveCard: { background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 12, padding: 24, marginBottom: 36, textAlign: 'center' },
  proActiveBadge: { display: 'inline-block', background: '#D4A017', color: '#0E1912', fontWeight: 800, fontSize: 12, padding: '4px 12px', borderRadius: 20, marginBottom: 10 },
  proActiveText: { fontSize: 14, color: '#F7F5EF', margin: 0 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 8 },
  planCard: { position: 'relative', textDecoration: 'none', color: '#F7F5EF', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 14, padding: '22px 20px' },
  planBadge: { position: 'absolute', top: -10, right: 16, background: '#D4A017', color: '#0E1912', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 12 },
  planLabel: { fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.06em' },
  planPrice: { fontSize: 26, fontWeight: 800, color: '#D4A017', fontFamily: 'monospace', marginTop: 6 },
  planPeriod: { fontSize: 13, color: '#8B9A92', fontFamily: 'sans-serif', fontWeight: 400 },
  planCta: { marginTop: 14, fontSize: 13, fontWeight: 700, color: '#F7F5EF' },
  divider: { display: 'flex', alignItems: 'center', margin: '36px 0 28px', gap: 12 },
  dividerText: { fontSize: 11, color: '#8B9A9299', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' },
  packageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 28 },
  packageCard: { textDecoration: 'none', color: '#F7F5EF', background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 10, padding: '16px 8px', textAlign: 'center' },
  packageCoins: { fontSize: 22, fontWeight: 800, color: '#D4A017', fontFamily: 'monospace' },
  packagePrice: { fontSize: 13, color: '#8B9A92', marginTop: 6 },
  cryptoBox: { background: 'rgba(247,245,239,0.03)', border: '1px dashed rgba(247,245,239,0.15)', borderRadius: 10, padding: 16, marginBottom: 28 },
  cryptoAddress: { fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: '#D4A017' },
  claimBox: { background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 12, padding: 24 },
  label: { fontSize: 12, color: '#8B9A92', display: 'block', marginBottom: 6, marginTop: 12 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(247,245,239,0.15)', background: '#0E1912', color: '#F7F5EF' },
  submitBtn: { width: '100%', padding: 12, marginTop: 16, background: '#D4A017', color: '#0E1912', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer' },
}