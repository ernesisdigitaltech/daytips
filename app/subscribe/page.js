'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { PAYMENT_OPTIONS, isRealLink } from '@/lib/paymentLinks'

const COIN_PACKS = [
  { key: 'coins20', coins: 20 },
  { key: 'coins50', coins: 50 },
]

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

  const [selectedCountry, setSelectedCountry] = useState('nigeria')

  const [proPlan, setProPlan] = useState('weekly')
  const [proSubmitting, setProSubmitting] = useState(false)
  const [proMessage, setProMessage] = useState('')

  const [coinPack, setCoinPack] = useState('coins20')
  const [coinSubmitting, setCoinSubmitting] = useState(false)
  const [coinMessage, setCoinMessage] = useState('')

  const upgradeFailed = searchParams.get('upgrade') === 'failed'
  const option = PAYMENT_OPTIONS.find(o => o.key === selectedCountry)

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

  async function submitProClaim(e) {
    e.preventDefault()
    setProSubmitting(true)
    setProMessage('')

    const { error } = await supabase.from('purchase_claims').insert({
      user_id: user.id,
      claim_type: 'subscription',
      plan: proPlan,
      payment_method: selectedCountry,
    })

    setProSubmitting(false)

    if (error) {
      setProMessage('Something went wrong: ' + error.message)
    } else {
      setProMessage('Submitted! The admin will review and activate your Pro plan shortly.')
    }
  }

  async function submitCoinClaim(e) {
    e.preventDefault()
    setCoinSubmitting(true)
    setCoinMessage('')

    const coinsNum = coinPack === 'coins50' ? 50 : 20

    const { error } = await supabase.from('purchase_claims').insert({
      user_id: user.id,
      claim_type: 'coins',
      coins_claimed: coinsNum,
      payment_method: selectedCountry,
    })

    setCoinSubmitting(false)

    if (error) {
      setCoinMessage('Something went wrong: ' + error.message)
    } else {
      setCoinMessage('Submitted! The admin will review and credit your coins shortly.')
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
        <h1 style={styles.h1}>Go Pro or Buy Coins</h1>
        <p style={{ color: '#8B9A92', fontSize: 14, marginBottom: 28 }}>
          Pick your country or crypto, pay however works for you — card, mobile money, USSD, bank — then tell us
          below so we can activate your plan or credit your coins.
        </p>

        {upgradeFailed && (
          <div style={styles.errorBanner}>
            Something went wrong verifying your last payment. If you were charged, it usually resolves within a
            few minutes — otherwise contact support.
          </div>
        )}

        {/* COUNTRY / PAYMENT CORRIDOR SELECTOR */}
        <div style={styles.countryRow}>
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedCountry(opt.key)}
              style={{
                ...styles.countryPill,
                ...(selectedCountry === opt.key ? styles.countryPillActive : {}),
              }}
            >
              <span style={styles.flag}>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* GO PRO */}
        <h2 style={styles.h2}>Go Pro</h2>
        <p style={{ color: '#8B9A92', fontSize: 13, marginBottom: 16 }}>
          Unlimited access to every premium fixture, no coins needed.
        </p>

        {isPro ? (
          <div style={styles.proActiveCard}>
            <div style={styles.proActiveBadge}>✓ Pro Active</div>
            <p style={styles.proActiveText}>
              You have unlimited access until{' '}
              {new Date(subscriptionExpires).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        ) : option.isCrypto ? (
          <CryptoBox address={option.walletAddress} />
        ) : (
          <div style={styles.planGrid}>
            <PayButton label="Weekly" link={option.links.weekly} currency={option.currency} />
            <PayButton label="Monthly" link={option.links.monthly} currency={option.currency} badge="Best value" />
          </div>
        )}

        {!isPro && (
          <form onSubmit={submitProClaim} style={styles.claimBox}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Notify us after paying for Pro</h3>
            <label style={styles.label}>Which plan did you pay for?</label>
            <select value={proPlan} onChange={(e) => setProPlan(e.target.value)} style={styles.input}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p style={styles.selectedCorridor}>Paid via: {option.flag} {option.label}</p>
            <button type="submit" disabled={proSubmitting} style={styles.submitBtn}>
              {proSubmitting ? 'Submitting...' : 'Notify admin'}
            </button>
            {proMessage && <p style={styles.confirmMsg}>{proMessage}</p>}
          </form>
        )}

        <div style={styles.divider}>
          <span style={styles.dividerText}>or, no commitment</span>
        </div>

        {/* BUY COINS */}
        <h2 style={styles.h2}>Buy Coins</h2>
        <p style={{ color: '#8B9A92', fontSize: 13, marginBottom: 16 }}>
          Prefer to pay as you go? Buy a coin pack and spend it on individual premium picks.
        </p>

        {option.isCrypto ? (
          <CryptoBox address={option.walletAddress} />
        ) : (
          <div style={styles.planGrid}>
            <PayButton label="20 coins" link={option.links.coins20} currency={option.currency} />
            <PayButton label="50 coins" link={option.links.coins50} currency={option.currency} />
          </div>
        )}

        <form onSubmit={submitCoinClaim} style={styles.claimBox}>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Notify us after paying for coins</h3>
          <label style={styles.label}>Which pack did you pay for?</label>
          <select value={coinPack} onChange={(e) => setCoinPack(e.target.value)} style={styles.input}>
            <option value="coins20">20 coins</option>
            <option value="coins50">50 coins</option>
          </select>
          <p style={styles.selectedCorridor}>Paid via: {option.flag} {option.label}</p>
          <button type="submit" disabled={coinSubmitting} style={styles.submitBtn}>
            {coinSubmitting ? 'Submitting...' : 'Notify admin'}
          </button>
          {coinMessage && <p style={styles.confirmMsg}>{coinMessage}</p>}
        </form>
      </main>
    </div>
  )
}

function PayButton({ label, link, currency, badge }) {
  const real = isRealLink(link)
  return (
    <a
      href={real ? link : undefined}
      target={real ? '_blank' : undefined}
      rel={real ? 'noopener noreferrer' : undefined}
      style={{
        ...styles.planCard,
        ...(real ? {} : styles.planCardDisabled),
      }}
      onClick={(e) => { if (!real) e.preventDefault() }}
    >
      {badge && real && <div style={styles.planBadge}>{badge}</div>}
      <div style={styles.planLabel}>{label}</div>
      <div style={styles.planPrice}>{real ? `Pay in ${currency}` : 'Coming soon'}</div>
      {real && <div style={styles.planCta}>Continue →</div>}
    </a>
  )
}

function CryptoBox({ address }) {
  return (
    <div style={styles.cryptoBox}>
      <div style={{ fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', marginBottom: 8 }}>
        Pay with crypto
      </div>
      <div style={styles.cryptoAddress}>{address}</div>
      <p style={{ fontSize: 12, color: '#8B9A92', marginTop: 8 }}>
        Send the equivalent value for your chosen plan or pack, then submit the form below.
      </p>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 620, margin: '0 auto', padding: '48px 24px 100px' },
  h1: { fontSize: 26, fontWeight: 700, margin: '0 0 4px' },
  h2: { fontSize: 18, fontWeight: 700, margin: '0 0 4px' },
  errorBanner: { background: 'rgba(166,58,46,0.12)', border: '1px solid rgba(166,58,46,0.4)', borderRadius: 10, padding: 14, fontSize: 13, color: '#F7F5EF', marginBottom: 24 },
  countryRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 },
  countryPill: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(247,245,239,0.04)', border: '1px solid rgba(247,245,239,0.14)', borderRadius: 999, color: '#F7F5EFcc', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  countryPillActive: { background: 'rgba(212,160,23,0.15)', borderColor: 'rgba(212,160,23,0.5)', color: '#D4A017' },
  flag: { fontSize: 18 },
  proActiveCard: { background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 12, padding: 24, marginBottom: 20, textAlign: 'center' },
  proActiveBadge: { display: 'inline-block', background: '#D4A017', color: '#0E1912', fontWeight: 800, fontSize: 12, padding: '4px 12px', borderRadius: 20, marginBottom: 10 },
  proActiveText: { fontSize: 14, color: '#F7F5EF', margin: 0 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 },
  planCard: { position: 'relative', textDecoration: 'none', color: '#F7F5EF', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 14, padding: '20px 18px' },
  planCardDisabled: { opacity: 0.45, cursor: 'not-allowed', color: '#8B9A92' },
  planBadge: { position: 'absolute', top: -10, right: 16, background: '#D4A017', color: '#0E1912', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 12 },
  planLabel: { fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.06em' },
  planPrice: { fontSize: 16, fontWeight: 700, color: '#D4A017', marginTop: 6 },
  planCta: { marginTop: 12, fontSize: 13, fontWeight: 700, color: '#F7F5EF' },
  divider: { display: 'flex', alignItems: 'center', margin: '36px 0 28px', gap: 12 },
  dividerText: { fontSize: 11, color: '#8B9A9299', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' },
  cryptoBox: { background: 'rgba(247,245,239,0.03)', border: '1px dashed rgba(247,245,239,0.15)', borderRadius: 10, padding: 16, marginBottom: 20 },
  cryptoAddress: { fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: '#D4A017' },
  claimBox: { background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 12, padding: 22, marginBottom: 8 },
  label: { fontSize: 12, color: '#8B9A92', display: 'block', marginBottom: 6, marginTop: 10 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(247,245,239,0.15)', background: '#0E1912', color: '#F7F5EF' },
  selectedCorridor: { fontSize: 12, color: '#8B9A92', marginTop: 12 },
  submitBtn: { width: '100%', padding: 12, marginTop: 14, background: '#D4A017', color: '#0E1912', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer' },
  confirmMsg: { fontSize: 13, marginTop: 12, color: '#D4A017' },
}