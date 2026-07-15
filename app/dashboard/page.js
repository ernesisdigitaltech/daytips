'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(null)
  const [lastClaim, setLastClaim] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

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
      .select('coins, last_daily_claim, is_admin')
      .eq('id', currentUser.id)
      .single()

    if (profile) {
      setCoins(profile.coins)
      setLastClaim(profile.last_daily_claim)
      setIsAdmin(!!profile.is_admin)
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
    return <div style={styles.body}><p style={{ padding: 24, color: '#8B9A92' }}>Loading...</p></div>
  }

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
      </header>

      <main style={styles.main}>
        <h1 style={styles.h1}>Your Dashboard</h1>
        <p style={{ color: '#8B9A92', fontSize: 14, marginBottom: 32 }}>{user.email}</p>

        <div style={styles.coinCard}>
          <div style={{ fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Coin Balance
          </div>
          <div style={styles.coinNumber}>{coins}</div>

          <button
            onClick={handleClaim}
            disabled={claiming || alreadyClaimedToday}
            style={{
              ...styles.claimBtn,
              opacity: alreadyClaimedToday ? 0.4 : 1,
              cursor: alreadyClaimedToday ? 'not-allowed' : 'pointer',
            }}
          >
            {alreadyClaimedToday
              ? 'Daily coins already claimed ✓'
              : claiming
              ? 'Claiming...'
              : 'Claim your 5 free daily coins'}
          </button>

          {message && <p style={{ fontSize: 13, marginTop: 12, color: '#D4A017' }}>{message}</p>}
        </div>

        <div style={styles.linksRow}>
          <Link href="/subscribe" style={styles.linkBtn}>Buy more coins →</Link>
          <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
        </div>

        {isAdmin && (
          <div style={styles.adminCard}>
            <div style={styles.adminLabel}>Admin Panel</div>
            <div style={styles.adminLinks}>
              <Link href="/admin/overview" style={styles.adminLink}>Overview</Link>
              <Link href="/admin/add-prediction" style={styles.adminLink}>Add Prediction</Link>
              <Link href="/admin/manage-predictions" style={styles.adminLink}>Manage Predictions</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 500, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  coinCard: { background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 12, padding: 28, textAlign: 'center' },
  coinNumber: { fontSize: 48, fontWeight: 800, color: '#D4A017', margin: '8px 0 20px', fontFamily: 'monospace' },
  claimBtn: { width: '100%', padding: 14, background: '#3B7A57', color: '#F7F5EF', border: 'none', borderRadius: 20, fontWeight: 700, fontSize: 14 },
  linksRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  linkBtn: { color: '#D4A017', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(247,245,239,0.2)', color: '#F7F5EF', padding: '8px 16px', borderRadius: 16, fontSize: 13, cursor: 'pointer' },
  adminCard: { marginTop: 32, background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 12, padding: 20 },
  adminLabel: { fontSize: 12, color: '#D4A017', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12 },
  adminLinks: { display: 'flex', flexDirection: 'column', gap: 10 },
  adminLink: { color: '#F7F5EF', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '8px 12px', background: 'rgba(247,245,239,0.04)', borderRadius: 8, border: '1px solid rgba(247,245,239,0.1)' },
}