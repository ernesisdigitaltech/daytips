'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function FixturePage() {
  const params = useParams()
  const [fixture, setFixture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadEverything()
  }, [params.id])

  async function loadEverything() {
    setLoading(true)

    // Fetch the fixture and the current user at the same time — they don't depend on each other
    const [fixtureResult, userResult] = await Promise.all([
      supabase
        .from('fixtures')
        .select('*, leagues(country, name)')
        .eq('id', params.id)
        .single(),
      supabase.auth.getUser(),
    ])

    if (fixtureResult.error || !fixtureResult.data) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setFixture(fixtureResult.data)

    const currentUser = userResult.data.user
    setUser(currentUser)

    if (currentUser) {
      // Profile (coins + subscription) and unlock status don't depend on each other either — fetch together
      const [profileResult, unlockResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('coins, subscription_tier, subscription_expires_at')
          .eq('id', currentUser.id)
          .single(),
        supabase
          .from('unlocked_fixtures')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('fixture_id', params.id)
          .maybeSingle(),
      ])

      if (profileResult.data) {
        setCoins(profileResult.data.coins)
        const proActive =
          profileResult.data.subscription_tier === 'pro' &&
          profileResult.data.subscription_expires_at &&
          new Date(profileResult.data.subscription_expires_at) > new Date()
        setIsPro(proActive)
      }
      setUnlocked(!!unlockResult.data)
    }

    setLoading(false)
  }

  async function handleUnlock() {
    setUnlocking(true)
    setMessage('')

    const { data, error } = await supabase.rpc('unlock_fixture', {
      p_fixture_id: params.id,
    })

    setUnlocking(false)

    if (error) {
      setMessage('Something went wrong. Try again.')
      return
    }

    if (data.success) {
      setUnlocked(true)
      if (data.coins !== undefined) setCoins(data.coins)
    } else {
      setMessage(data.message)
    }
  }

  if (loading) {
    return <div style={styles.body}><p style={{ padding: 24, color: '#8B9A92' }}>Loading...</p></div>
  }

  if (notFound) {
    return (
      <div style={styles.body}>
        <div style={{ padding: 24 }}>
          <p>Fixture not found.</p>
          <Link href="/" style={{ color: '#D4A017' }}>← Back to fixtures</Link>
        </div>
      </div>
    )
  }

  const kickoff = new Date(fixture.kickoff_time)
  // Pro subscribers see every fixture unlocked, regardless of coin-unlock history
  const isLocked = fixture.is_premium && !unlocked && !isPro

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
        {user && (
          <span style={{ float: 'right', fontSize: 13 }}>
            {isPro && <span style={styles.proBadge}>✓ PRO</span>}
            {coins !== null && <span style={{ color: '#D4A017' }}>{coins} coins</span>}
          </span>
        )}
      </header>

      <main style={styles.main}>
        <div style={styles.leagueTag}>
          {fixture.leagues.country} — {fixture.leagues.name}
        </div>

        <h1 style={styles.matchTitle}>
          {fixture.home_team} <span style={{ color: '#8B9A92', fontWeight: 400 }}>vs</span> {fixture.away_team}
        </h1>

        <div style={styles.kickoffRow}>
          <span>{kickoff.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <span>•</span>
          <span>{kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {fixture.final_score && (
            <>
              <span>•</span>
              <span style={{ color: '#D4A017', fontWeight: 700 }}>FT {fixture.final_score}</span>
            </>
          )}
        </div>

        <div style={styles.stampRow}>
          {fixture.result === 'pending' ? (
            <div style={styles.stampPending}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{fixture.confidence_percent}%</div>
              <div style={{ fontSize: 9, color: '#8B9A92' }}>CONFIDENCE</div>
            </div>
          ) : (
            <div style={{
              ...styles.stampVerdict,
              borderColor: fixture.result === 'correct' ? '#D4A017' : '#A63A2E',
              color: fixture.result === 'correct' ? '#D4A017' : '#A63A2E',
            }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {fixture.result === 'correct' ? 'Correct' : 'Wrong'}
              </div>
              <div style={{ fontSize: 11 }}>{fixture.confidence_percent}% conf.</div>
            </div>
          )}

          {!isLocked && (
            <div style={styles.tipBox}>
              <div style={{ fontSize: 11, color: '#8B9A72', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tip</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#D4A017', marginTop: 4 }}>{fixture.tip}</div>
            </div>
          )}
        </div>

        {isLocked ? (
          <div style={styles.lockedBox}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <p style={{ color: '#8B9A92', fontSize: 14, marginBottom: 16 }}>
              The tip and full analysis for this fixture are locked. Unlock for 2 coins, or go Pro for unlimited access.
            </p>

            {!user && (
              <Link href="/login" style={styles.unlockBtn}>Log in to unlock</Link>
            )}

            {user && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleUnlock} disabled={unlocking} style={styles.unlockBtn}>
                  {unlocking ? 'Unlocking...' : 'Unlock for 2 coins'}
                </button>
                <Link href="/subscribe" style={styles.proBtn}>Go Pro instead →</Link>
              </div>
            )}

            {message && <p style={{ color: '#A63A2E', fontSize: 13, marginTop: 12 }}>{message}</p>}
          </div>
        ) : (
          <div style={styles.analysisBox}>
            <h3 style={{ marginTop: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8B9A92' }}>
              Full Analysis
              {fixture.is_premium && isPro && !unlocked && (
                <span style={styles.unlockedViaPro}>— unlocked with Pro</span>
              )}
            </h3>
            <p style={{ lineHeight: 1.7, fontSize: 15 }}>{fixture.analysis}</p>
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
  proBadge: { background: 'rgba(212,160,23,0.18)', color: '#D4A017', fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 10, marginRight: 10 },
  main: { maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' },
  leagueTag: { fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
  matchTitle: { fontSize: 32, fontWeight: 700, margin: '0 0 12px' },
  kickoffRow: { display: 'flex', gap: 10, color: '#8B9A92', fontSize: 14, marginBottom: 32 },
  stampRow: { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 },
  stampPending: { width: 90, height: 90, borderRadius: '50%', border: '3px dashed rgba(212,160,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 },
  stampVerdict: { width: 90, height: 90, borderRadius: '50%', border: '4px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transform: 'rotate(-8deg)', flexShrink: 0 },
  tipBox: { flex: 1 },
  analysisBox: { background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 12, padding: 24 },
  unlockedViaPro: { color: '#D4A017', textTransform: 'none', letterSpacing: 0, fontSize: 12, marginLeft: 8 },
  lockedBox: { background: 'rgba(212,160,23,0.05)', border: '1px dashed rgba(212,160,23,0.4)', borderRadius: 12, padding: 32, textAlign: 'center' },
  unlockBtn: { display: 'inline-block', background: '#D4A017', color: '#0E1912', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 700, fontSize: 14, textDecoration: 'none', cursor: 'pointer' },
  proBtn: { display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#D4A017', border: '1px solid rgba(212,160,23,0.5)', padding: '12px 20px', borderRadius: 20, fontWeight: 700, fontSize: 14, textDecoration: 'none' },
}