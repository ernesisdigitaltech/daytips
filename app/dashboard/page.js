'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import sd from '@/app/styles/scoutsDossier.module.css'

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  )
}

function DashboardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const upgradedPlan = searchParams.get('upgraded')
  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(null)
  const [displayCoins, setDisplayCoins] = useState(0)
  const [lastClaim, setLastClaim] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [fullName, setFullName] = useState(null)
  const [subscriptionTier, setSubscriptionTier] = useState('free')
  const [subscriptionExpires, setSubscriptionExpires] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState('')
  const [pulse, setPulse] = useState(false)
  const firstLoad = useRef(true)

  useEffect(() => {
    loadProfile()
  }, [])

  // Animate the coin number counting up whenever `coins` changes
  useEffect(() => {
    if (coins === null) return

    if (firstLoad.current) {
      // count up from 0 on first load
      firstLoad.current = false
      const duration = 700
      const start = performance.now()
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayCoins(Math.round(eased * coins))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } else {
      // just pulse on subsequent changes (e.g. after claiming)
      setDisplayCoins(coins)
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 500)
      return () => clearTimeout(t)
    }
  }, [coins])

  async function loadProfile() {
    setLoading(true)

    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    const { data: profile } = await supabase
      .from('profiles')
      .select('coins, last_daily_claim, is_admin, full_name, subscription_tier, subscription_expires_at')
      .eq('id', currentUser.id)
      .single()

    if (profile) {
      setCoins(profile.coins)
      setLastClaim(profile.last_daily_claim)
      setIsAdmin(!!profile.is_admin)
      setFullName(profile.full_name)
      setSubscriptionTier(profile.subscription_tier)
      setSubscriptionExpires(profile.subscription_expires_at)
    }

    setLoading(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const alreadyClaimedToday = lastClaim === todayStr

  async function handleClaim() {
    setClaiming(true)
    setMessage('')

    const { data, error } = await supabase.rpc('claim_daily_coins')

    setClaiming(false)

    if (error) {
      setMessage('Something went wrong. Try again.')
      return
    }

    if (data.success) {
      setCoins(data.coins)
      setLastClaim(todayStr)
      setMessage('Claimed 5 coins! 🎉')
    } else {
      setMessage(data.message)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className={sd.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className={sd.eyebrow}>Loading…</p>
      </div>
    )
  }

  return (
    <div className={sd.page}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' }}>
        <Link href="/" className={sd.linkGold} style={{ color: '#F7F5EF' }}>← DayTips</Link>
      </header>

      <main style={{ maxWidth: 500, margin: '0 auto', padding: '48px 24px 80px' }} className={sd.stagger}>
        <div>
          <p className={sd.eyebrow}>Manager's Desk</p>
          <h1 className={sd.h1}>{fullName ? `Hey, ${fullName.split(' ')[0]}` : 'Your Dashboard'}</h1>
          <p style={{ color: '#F7F5EF88', fontSize: 14, marginBottom: 8 }}>{user.email}</p>
        </div>

        {upgradedPlan && (
          <div style={{
            background: 'rgba(212,160,23,0.1)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 12,
            padding: '14px 18px',
            fontSize: 13,
            color: '#F7F5EF',
          }}>
            🎉 You're now on the <strong style={{ color: '#D4A017' }}>{upgradedPlan}</strong> Pro plan — unlimited premium fixtures unlocked.
          </div>
        )}

        {subscriptionTier === 'pro' && subscriptionExpires && new Date(subscriptionExpires) > new Date() && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(212,160,23,0.12)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: '#D4A017',
          }}>
            ✓ Pro member
          </div>
        )}

        <div className={sd.card} style={{ textAlign: 'center', marginTop: 24 }}>
          <div className={sd.eyebrow}>Coin Balance</div>

          <div className={sd.stampRing}>
            <div className={sd.stampRingInner}>
              <span className={`${sd.coinNumber} ${pulse ? sd.pulse : ''}`}>{displayCoins}</span>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={claiming || alreadyClaimedToday}
            className={sd.btnPrimary}
          >
            {alreadyClaimedToday
              ? 'Daily coins already claimed ✓'
              : claiming
              ? 'Claiming…'
              : 'Claim your 5 free daily coins'}
          </button>

          {message && <p className={sd.message}>{message}</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <Link href="/subscribe" className={sd.linkGold}>Buy more coins →</Link>
          <button onClick={handleLogout} className={sd.btnGhost}>Log out</button>
        </div>

        {isAdmin && (
          <div className={sd.adminPanel}>
            <div className={sd.adminLabel}>Admin Panel</div>
            <div className={sd.adminLinks}>
              <Link href="/admin/overview" className={sd.adminLink}>Overview</Link>
              <Link href="/admin/add-prediction" className={sd.adminLink}>Add Prediction</Link>
              <Link href="/admin/manage-predictions" className={sd.adminLink}>Manage Predictions</Link>
              <Link href="/admin/manage-subscribers" className={sd.adminLink}>Manage Subscribers</Link>
              <Link href="/admin/purchase-claims" className={sd.adminLink}>Purchase Claims</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}