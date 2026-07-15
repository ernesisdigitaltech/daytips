'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

function formatDateKey(date) {
  return date.toISOString().split('T')[0]
}

export default function HomePage() {
  const [allFixtures, setAllFixtures] = useState([])
  const [unlockedIds, setUnlockedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const [weekOffset, setWeekOffset] = useState(0) // shifts the 7-day window by whole weeks
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()))

  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(null)

  useEffect(() => {
    loadFixtures()
  }, [])

  async function loadFixtures() {
    setLoading(true)

    const [fixturesResult, userResult] = await Promise.all([
      supabase
        .from('fixtures')
        .select('*, leagues(country, name)')
        .order('kickoff_time', { ascending: true }),
      supabase.auth.getUser(),
    ])

    if (fixturesResult.error) {
      console.error(fixturesResult.error)
      setLoading(false)
      return
    }

    const currentUser = userResult.data.user
    if (currentUser) {
      setUser(currentUser)

      const [{ data: unlocks }, { data: profile }] = await Promise.all([
        supabase
          .from('unlocked_fixtures')
          .select('fixture_id')
          .eq('user_id', currentUser.id),
        supabase
          .from('profiles')
          .select('coins')
          .eq('id', currentUser.id)
          .single(),
      ])

      if (unlocks) setUnlockedIds(new Set(unlocks.map((u) => u.fixture_id)))
      if (profile) setCoins(profile.coins)
    }

    setAllFixtures(fixturesResult.data)
    setLoading(false)
  }

  // Build the 7 visible calendar days based on weekOffset
  const visibleDays = useMemo(() => {
    const days = []
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7 - 3) // center today when offset is 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      days.push(d)
    }
    return days
  }, [weekOffset])

  const todayKey = formatDateKey(new Date())

  // Group the fixtures for the selected day only, by league
  const fixturesByLeague = useMemo(() => {
    const dayFixtures = allFixtures.filter(
      (fx) => formatDateKey(new Date(fx.kickoff_time)) === selectedDateKey
    )

    const groups = {}
    for (const fixture of dayFixtures) {
      const key = `${fixture.leagues.country}|${fixture.leagues.name}`
      if (!groups[key]) {
        groups[key] = { country: fixture.leagues.country, name: fixture.leagues.name, fixtures: [] }
      }
      groups[key].fixtures.push(fixture)
    }

    return Object.values(groups).sort((a, b) => {
      if (a.country !== b.country) return a.country.localeCompare(b.country)
      return a.name.localeCompare(b.name)
    })
  }, [allFixtures, selectedDateKey])

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <img src="/logo.png" alt="DayTips" style={styles.logoMark} />
          <div style={styles.logoText}>DayTips</div>
        </div>
        {user ? (
          <Link href="/dashboard" style={styles.dashboardBtn}>My Dashboard</Link>
        ) : (
          <Link href="/login" style={styles.loginBtn}>Log in</Link>
        )}
      </header>

      {user && (
        <Link href="/dashboard" style={styles.welcomeBarLink}>
          <div style={styles.welcomeBar}>
            <span>Welcome back{coins !== null ? ` — ${coins} coin${coins === 1 ? '' : 's'} available` : ''}</span>
            <span style={styles.welcomeBarArrow}>Go to dashboard →</span>
          </div>
        </Link>
      )}

      <main style={styles.main}>
        <section style={styles.hero}>
          <span style={styles.eyebrow}>Matchday Dossier</span>
          <h1 style={styles.h1}>Today's<br />Verdicts.</h1>
          <p style={styles.heroText}>
            Every fixture analysed, rated, and stamped before kickoff.
          </p>
        </section>

        {/* CALENDAR STRIP */}
        <div style={styles.calendarRow}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={styles.calArrow}>‹</button>
          <div style={styles.calendar}>
            {visibleDays.map((d) => {
              const key = formatDateKey(d)
              const isSelected = key === selectedDateKey
              const isToday = key === todayKey
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDateKey(key)}
                  style={{
                    ...styles.calDay,
                    background: isSelected ? '#3B7A57' : 'transparent',
                    borderColor: isToday ? '#D4A017' : 'rgba(247,245,239,0.12)',
                  }}
                >
                  <div style={styles.calDow}>{d.toLocaleDateString([], { weekday: 'short' })}</div>
                  <div style={styles.calNum}>{d.getDate()}</div>
                </button>
              )
            })}
          </div>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={styles.calArrow}>›</button>
        </div>

        {loading && <p style={{ color: '#8B9A92', marginTop: 24 }}>Loading fixtures...</p>}

        {!loading && fixturesByLeague.length === 0 && (
          <p style={{ color: '#8B9A92', marginTop: 24 }}>
            No fixtures for {new Date(selectedDateKey).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        )}

        {!loading && fixturesByLeague.map((league) => (
          <div key={league.country + league.name} style={{ marginTop: 40 }}>
            <div style={styles.leagueHeader}>
              <span style={styles.leagueCountry}>{league.country}</span>
              <span style={styles.leagueName}>{league.name}</span>
            </div>

            {league.fixtures.map((fx) => {
              const isLocked = fx.is_premium && !unlockedIds.has(fx.id)

              return (
                <Link key={fx.id} href={`/fixtures/${fx.id}`} style={styles.fixtureLink}>
                  <div style={styles.fixture}>
                    <div style={styles.fxTime}>
                      {new Date(fx.kickoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div>
                        <span style={styles.teamName}>{fx.home_team}</span>
                        <span style={styles.vs}> vs </span>
                        <span style={styles.teamName}>{fx.away_team}</span>
                      </div>

                      {isLocked ? (
                        <div style={styles.lockedPreview}>🔒 Tip and analysis locked — unlock for 2 coins</div>
                      ) : (
                        <>
                          <div style={styles.tip}>Tip: {fx.tip}</div>
                          <div style={styles.analysis}>{fx.analysis}</div>
                        </>
                      )}
                    </div>

                    {fx.result === 'pending' ? (
                      <div style={styles.stampPending}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{fx.confidence_percent}%</div>
                        <div style={{ fontSize: 7, color: '#8B9A92' }}>CONF.</div>
                      </div>
                    ) : (
                      <div style={{
                        ...styles.stampVerdict,
                        borderColor: fx.result === 'correct' ? '#D4A017' : '#A63A2E',
                        color: fx.result === 'correct' ? '#D4A017' : '#A63A2E',
                      }}>
                        <div style={{ fontWeight: 800, fontSize: 11 }}>
                          {fx.result === 'correct' ? 'Correct' : 'Wrong'}
                        </div>
                      </div>
                    )}

                    <div style={styles.lock}>
                      {fx.is_premium ? (isLocked ? '🔒 2' : '✓ Unlocked') : 'Free'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.footerLinks}>
            <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
            <Link href="/responsible-gambling" style={styles.footerLink}>Responsible Gambling</Link>
          </div>
        </div>

        <p style={styles.footerNotice}>
          DayTips provides football predictions and analysis for informational and entertainment purposes only.
          We do not accept bets or wagers. Tips are not guaranteed and should never be treated as financial advice.
          You must be 18 or older to use this service. If you choose to bet with a licensed operator based on
          information found here, please gamble responsibly.
        </p>

        <p style={styles.footerCopyright}>© {new Date().getFullYear()} DayTips. All rights reserved.</p>
      </footer>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' },
  logoText: { fontWeight: 800, fontSize: 22 },
  loginBtn: { background: '#D4A017', color: '#0E1912', border: 'none', padding: '9px 16px', borderRadius: 20, fontWeight: 600, fontSize: 13, textDecoration: 'none' },
  dashboardBtn: { background: '#3B7A57', color: '#F7F5EF', border: 'none', padding: '9px 16px', borderRadius: 20, fontWeight: 600, fontSize: 13, textDecoration: 'none' },
  welcomeBarLink: { textDecoration: 'none', color: 'inherit', display: 'block' },
  welcomeBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '10px 24px', background: 'rgba(212,160,23,0.1)', borderBottom: '1px solid rgba(212,160,23,0.3)', fontSize: 13, color: '#F7F5EF' },
  welcomeBarArrow: { color: '#D4A017', fontWeight: 600 },
  main: { maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' },
  hero: { padding: '56px 0 30px' },
  eyebrow: { fontSize: 12, letterSpacing: '0.15em', color: '#D4A017', textTransform: 'uppercase' },
  h1: { fontWeight: 800, fontSize: 52, lineHeight: 0.95, margin: '14px 0' },
  heroText: { color: '#8B9A92', fontSize: 15 },
  calendarRow: { display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(247,245,239,0.12)', borderBottom: '1px solid rgba(247,245,239,0.12)', padding: '16px 0' },
  calArrow: { background: 'transparent', border: 'none', color: '#8B9A92', fontSize: 20, cursor: 'pointer', padding: '0 4px' },
  calendar: { display: 'flex', gap: 8, overflowX: 'auto', flex: 1 },
  calDay: { flex: '0 0 auto', width: 52, textAlign: 'center', padding: '8px 0', borderRadius: 10, border: '1px solid', cursor: 'pointer', color: '#F7F5EF' },
  calDow: { fontSize: 10, color: '#8B9A92', textTransform: 'uppercase' },
  calNum: { fontSize: 15, marginTop: 3 },
  leagueHeader: { display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 10, borderBottom: '2px solid #3B7A57' },
  leagueCountry: { fontSize: 11, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.1em' },
  leagueName: { fontWeight: 700, fontSize: 22 },
  fixtureLink: { textDecoration: 'none', color: 'inherit' },
  fixture: { display: 'flex', alignItems: 'center', gap: 16, padding: '18px 4px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  fxTime: { fontSize: 12, color: '#8B9A92', width: 44, flex: '0 0 44px' },
  teamName: { fontSize: 14, fontWeight: 500 },
  vs: { color: '#8B9A92', fontSize: 11 },
  tip: { fontSize: 11, color: '#D4A017', textTransform: 'uppercase', marginTop: 4 },
  analysis: { fontSize: 12.5, color: '#8B9A92', marginTop: 6, maxWidth: 480 },
  lockedPreview: { fontSize: 12.5, color: '#D4A017', marginTop: 6, fontStyle: 'italic' },
  stampPending: { flex: '0 0 60px', width: 60, height: 60, borderRadius: '50%', border: '2px dashed rgba(212,160,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#D4A017' },
  stampVerdict: { flex: '0 0 60px', width: 60, height: 60, borderRadius: '50%', border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-8deg)' },
  lock: { fontSize: 11, color: '#8B9A92', border: '1px solid rgba(247,245,239,0.12)', padding: '6px 10px', borderRadius: 14, whiteSpace: 'nowrap' },
  footer: { maxWidth: 900, margin: '40px auto 0', padding: '32px 24px 48px', borderTop: '1px solid rgba(247,245,239,0.12)' },
  footerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  footerLinks: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  footerLink: { color: '#8B9A92', textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  footerNotice: { color: '#8B9A92', fontSize: 12, lineHeight: 1.6, marginTop: 20, maxWidth: 640 },
  footerCopyright: { color: '#8B9A9299', fontSize: 11, marginTop: 16 },
}