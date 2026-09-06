'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

function formatDateKey(date) {
  // Use LOCAL calendar date components, not toISOString() (which is always
  // UTC) — otherwise fixtures can shift by a day depending on the viewer's
  // timezone and the time of day.
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Rotating palette for league header rows — dark, muted, on-brand tints so
// each league is visually distinct when scanning many at once, without
// clashing with the pitch-ink theme.
const LEAGUE_COLORS = [
  '#1c2e22', // deep green
  '#2e2418', // deep amber
  '#1e2a30', // deep teal-blue
  '#2a1e26', // deep wine
  '#242e1c', // deep olive
  '#1e2230', // deep indigo
  '#301e1e', // deep rust
  '#1e2e2c', // deep teal-green
]

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  )
}

function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allFixtures, setAllFixtures] = useState([])
  const [unlockedIds, setUnlockedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const initialDateKey = (() => {
    const fromUrl = searchParams.get('date')
    return fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl) ? fromUrl : formatDateKey(new Date())
  })()

  const initialWeekOffset = (() => {
    const diffDays = Math.round(
      (new Date(initialDateKey) - new Date(formatDateKey(new Date()))) / (1000 * 60 * 60 * 24)
    )
    return Math.round(diffDays / 7)
  })()

  const [weekOffset, setWeekOffset] = useState(initialWeekOffset)
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey)

  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [expandedLeagues, setExpandedLeagues] = useState(new Set())

  const [unlockingId, setUnlockingId] = useState(null)
  const [unlockError, setUnlockError] = useState({})
  const [bookingCodes, setBookingCodes] = useState([])

  useEffect(() => {
    setExpandedLeagues(new Set())
  }, [selectedDateKey])

  function toggleLeague(key) {
    setExpandedLeagues((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectDate(key) {
    setSelectedDateKey(key)
    router.replace(`/?date=${key}`, { scroll: false })
  }

  useEffect(() => {
    loadFixtures()
  }, [])

  async function loadFixtures() {
    setLoading(true)

    const todayKeyLocal = formatDateKey(new Date())
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [fixturesResult, userResult, bookingCodesResult] = await Promise.all([
      supabase
        .from('fixtures')
        .select('*, leagues(country, name)')
        .order('kickoff_time', { ascending: true }),
      supabase.auth.getUser(),
      supabase
        .from('booking_codes')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false }),
    ])

    if (bookingCodesResult.data) setBookingCodes(bookingCodesResult.data)

    if (fixturesResult.error) {
      console.error(fixturesResult.error)
      setLoading(false)
      return
    }

    const currentUser = userResult.data.user
    let isAdmin = false

    if (currentUser) {
      setUser(currentUser)

      const [{ data: unlocks }, { data: profile }] = await Promise.all([
        supabase
          .from('unlocked_fixtures')
          .select('fixture_id')
          .eq('user_id', currentUser.id),
        supabase
          .from('profiles')
          .select('coins, subscription_tier, subscription_expires_at, is_admin')
          .eq('id', currentUser.id)
          .single(),
      ])

      if (unlocks) setUnlockedIds(new Set(unlocks.map((u) => u.fixture_id)))
      if (profile) {
        setCoins(profile.coins)
        isAdmin = !!profile.is_admin
        const proActive =
          profile.subscription_tier === 'pro' &&
          profile.subscription_expires_at &&
          new Date(profile.subscription_expires_at) > new Date()
        setIsPro(proActive)
      }
    }

    if (!isAdmin) {
      supabase.from('page_views').insert({
        user_id: currentUser ? currentUser.id : null,
      }).then(({ error }) => {
        if (error) console.error('Page view tracking failed:', error)
      })
    }

    setAllFixtures(fixturesResult.data)
    setLoading(false)
  }

  async function handleUnlock(fixtureId) {
    setUnlockingId(fixtureId)
    setUnlockError((prev) => ({ ...prev, [fixtureId]: '' }))

    const { data, error } = await supabase.rpc('unlock_fixture', { p_fixture_id: fixtureId })

    setUnlockingId(null)

    if (error) {
      setUnlockError((prev) => ({ ...prev, [fixtureId]: 'Something went wrong. Try again.' }))
      return
    }

    if (data.success) {
      setUnlockedIds((prev) => new Set(prev).add(fixtureId))
      if (data.coins !== undefined) setCoins(data.coins)
    } else {
      setUnlockError((prev) => ({ ...prev, [fixtureId]: data.message }))
    }
  }

  const visibleDays = useMemo(() => {
    const days = []
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7 - 3)
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      days.push(d)
    }
    return days
  }, [weekOffset])

  const todayKey = formatDateKey(new Date())

  // Strips a leading flag emoji (or any non-letter prefix) so alphabetical
  // sorting happens on the actual country name, not the emoji's Unicode
  // code point — matches the same fix used on the Add Prediction page.
  function stripLeadingEmoji(str) {
    return str.replace(/^[^a-zA-Z]+/, '').trim()
  }

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
      const countryCompare = stripLeadingEmoji(a.country).localeCompare(stripLeadingEmoji(b.country))
      if (countryCompare !== 0) return countryCompare
      return a.name.localeCompare(b.name)
    })
  }, [allFixtures, selectedDateKey])

  const dayStats = useMemo(() => {
    const dayFixtures = allFixtures.filter(
      (fx) => formatDateKey(new Date(fx.kickoff_time)) === selectedDateKey
    )
    const correct = dayFixtures.filter((fx) => fx.result === 'correct').length
    const wrong = dayFixtures.filter((fx) => fx.result === 'wrong').length
    const pending = dayFixtures.filter((fx) => fx.result === 'pending').length
    const resolved = correct + wrong
    const winRate = resolved > 0 ? Math.round((correct / resolved) * 100) : null
    return { correct, wrong, pending, total: dayFixtures.length, winRate }
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

      <div style={styles.telegramRow}>
        <a
          href="https://t.me/daytipsadmin"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.telegramBtn}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
          </svg>
          Chat Admin
        </a>
      </div>

      <main style={styles.main}>
        <section style={styles.hero}>
          <span style={styles.eyebrow}>Matchday Dossier</span>
          <h1 style={styles.h1}>Today's<br />Verdicts.</h1>
          <p style={styles.heroText}>
            Every fixture rated and stamped before kickoff.
          </p>
        </section>

        {bookingCodes.length > 0 && (
          <section style={styles.bookingSection}>
            <div style={styles.bookingHeader}>
              <span style={styles.bookingTitle}>🎟️ Daily Booking Codes</span>
              <Link href="/booking-codes" style={styles.bookingHistoryLink}>Full history →</Link>
            </div>
            <div style={styles.bookingGrid}>
              {bookingCodes.map((bc) => (
                <div key={bc.id} style={styles.bookingCard}>
                  <div style={styles.bookingPlatform}>{bc.platform}</div>
                  <div style={styles.bookingCode}>{bc.code}</div>
                  <div style={styles.bookingOdds}>Odds {Number(bc.odds).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  onClick={() => selectDate(key)}
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

        {!loading && fixturesByLeague.map((league, index) => {
          const leagueKey = league.country + league.name
          const foldable = league.fixtures.length > 1
          const isExpanded = !foldable || expandedLeagues.has(leagueKey)
          const bgColor = LEAGUE_COLORS[index % LEAGUE_COLORS.length]

          return (
            <div key={leagueKey} style={{ marginTop: 40 }}>
              <div
                style={{ ...styles.leagueHeader, background: bgColor, cursor: foldable ? 'pointer' : 'default' }}
                onClick={() => foldable && toggleLeague(leagueKey)}
              >
                {league.country && <span style={styles.leagueCountry}>{league.country}</span>}
                <span style={styles.leagueName}>{league.name}</span>
                {foldable && (
                  <span style={styles.leagueMeta}>
                    {!isExpanded && `${league.fixtures.length} fixtures · `}
                    <span style={{ ...styles.chevron, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </span>
                )}
              </div>

              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: isExpanded ? 6000 : 0,
                  opacity: isExpanded ? 1 : 0,
                  transition: 'max-height 0.35s ease, opacity 0.25s ease',
                }}
              >
                {league.fixtures.map((fx) => {
                  const isLocked = fx.is_premium && !unlockedIds.has(fx.id) && !fx.admin_archived && !isPro
                  const stampColor =
                    fx.result === 'correct' ? '#6FBE8F' :
                    fx.result === 'wrong' ? '#A63A2E' :
                    '#D4A017' // pending — yellow/gold

                  return (
                    <div key={fx.id} style={styles.fixture}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>
                          {isLocked ? (
                            <span style={styles.hiddenTeams}>🔒 Teams hidden until unlocked</span>
                          ) : (
                            <>
                              <span style={styles.teamName}>{fx.home_team}</span>
                              <span style={styles.vs}> vs </span>
                              <span style={styles.teamName}>{fx.away_team}</span>
                              {fx.final_score && fx.result !== 'pending' && (
                                <span style={styles.finalScore}>FT {fx.final_score}</span>
                              )}
                            </>
                          )}
                        </div>

                        {isLocked ? (
                          <div style={styles.unlockRow}>
                            {!user ? (
                              <Link href="/login" style={styles.unlockLink}>Log in to unlock</Link>
                            ) : (
                              <button
                                onClick={() => handleUnlock(fx.id)}
                                disabled={unlockingId === fx.id}
                                style={styles.unlockBtn}
                              >
                                {unlockingId === fx.id ? 'Unlocking…' : '🔒 Unlock for 2 coins'}
                              </button>
                            )}
                            {unlockError[fx.id] && (
                              <span style={styles.unlockErrorText}>{unlockError[fx.id]}</span>
                            )}
                          </div>
                        ) : (
                          <div style={styles.tipLine}>Tip: {fx.tip}</div>
                        )}
                      </div>

                      <div style={{ ...styles.stamp, borderColor: stampColor, color: stampColor, borderStyle: fx.result === 'pending' ? 'dashed' : 'solid' }}>
                        {fx.result === 'pending' ? (
                          <>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>{fx.confidence_percent}%</div>
                            <div style={{ fontSize: 7, color: '#8B9A92' }}>CONF.</div>
                          </>
                        ) : (
                          <div style={{ fontWeight: 800, fontSize: 11 }}>
                            {fx.result === 'correct' ? 'Correct' : 'Wrong'}
                          </div>
                        )}
                      </div>

                      <div style={styles.lock}>
                        {fx.is_premium ? (isLocked ? '🔒 2' : '✓ Unlocked') : 'Free'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!loading && dayStats.total > 0 && (
          <div style={styles.statsSummary}>
            <p style={styles.statsSummaryTitle}>Day Summary</p>
            <div style={styles.statsRow}>
              <div style={styles.statBlock}>
                <div style={{ ...styles.statNumber, color: '#6FBE8F' }}>{dayStats.correct}</div>
                <div style={styles.statLabel}>Correct</div>
              </div>
              <div style={styles.statBlock}>
                <div style={{ ...styles.statNumber, color: '#A63A2E' }}>{dayStats.wrong}</div>
                <div style={styles.statLabel}>Wrong</div>
              </div>
              <div style={styles.statBlock}>
                <div style={{ ...styles.statNumber, color: '#D4A017' }}>{dayStats.pending}</div>
                <div style={styles.statLabel}>Pending</div>
              </div>
              {dayStats.winRate !== null && (
                <div style={styles.statBlock}>
                  <div style={{ ...styles.statNumber, color: '#F7F5EF' }}>{dayStats.winRate}%</div>
                  <div style={styles.statLabel}>Win Rate</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.footerLinks}>
            <Link href="/download" style={styles.footerLink}>Get the App</Link>
            <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
            <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
            <Link href="/responsible-gambling" style={styles.footerLink}>Responsible Gambling</Link>
          </div>
        </div>

        <p style={styles.footerNotice}>
          DayTips provides football predictions for informational and entertainment purposes only.
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
  telegramRow: { display: 'flex', justifyContent: 'center', padding: '12px 24px 0' },
  telegramBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#229ED9', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 600, fontSize: 12.5, textDecoration: 'none' },
  welcomeBarLink: { textDecoration: 'none', color: 'inherit', display: 'block' },
  welcomeBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '10px 24px', background: 'rgba(212,160,23,0.1)', borderBottom: '1px solid rgba(212,160,23,0.3)', fontSize: 13, color: '#F7F5EF' },
  welcomeBarArrow: { color: '#D4A017', fontWeight: 600 },
  main: { maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' },
  hero: { padding: '56px 0 30px' },
  eyebrow: { fontSize: 12, letterSpacing: '0.15em', color: '#D4A017', textTransform: 'uppercase' },
  h1: { fontWeight: 800, fontSize: 52, lineHeight: 0.95, margin: '14px 0' },
  heroText: { color: '#8B9A92', fontSize: 15 },
  bookingSection: { background: 'linear-gradient(165deg, rgba(212,160,23,0.12), rgba(212,160,23,0.03))', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 14, padding: '18px 20px', marginBottom: 28 },
  bookingHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 },
  bookingTitle: { fontWeight: 800, fontSize: 16, color: '#F7F5EF' },
  bookingHistoryLink: { fontSize: 12.5, color: '#D4A017', textDecoration: 'none', fontWeight: 600 },
  bookingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 },
  bookingCard: { background: 'rgba(14,25,18,0.5)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 10, padding: '12px 14px' },
  bookingPlatform: { fontSize: 11, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.06em' },
  bookingCode: { fontSize: 20, fontWeight: 800, color: '#D4A017', fontFamily: 'monospace', marginTop: 4 },
  bookingOdds: { fontSize: 12, color: '#B8C2BC', marginTop: 4 },
  statsSummary: { marginTop: 48, background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 14, padding: '20px 24px' },
  statsSummaryTitle: { fontSize: 11, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', textAlign: 'center' },
  statsRow: { display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 },
  statBlock: { textAlign: 'center' },
  statNumber: { fontSize: 26, fontWeight: 800, fontFamily: 'monospace' },
  statLabel: { fontSize: 11, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 },
  calendarRow: { display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(247,245,239,0.12)', borderBottom: '1px solid rgba(247,245,239,0.12)', padding: '16px 0' },
  calArrow: { background: 'transparent', border: 'none', color: '#8B9A92', fontSize: 20, cursor: 'pointer', padding: '0 4px' },
  calendar: { display: 'flex', gap: 8, overflowX: 'auto', flex: 1 },
  calDay: { flex: '0 0 auto', width: 52, textAlign: 'center', padding: '8px 0', borderRadius: 10, border: '1px solid', cursor: 'pointer', color: '#F7F5EF' },
  calDow: { fontSize: 10, color: '#8B9A92', textTransform: 'uppercase' },
  calNum: { fontSize: 15, marginTop: 3 },
  leagueHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #D4A017' },
  leagueCountry: { fontSize: 11, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.1em' },
  leagueName: { fontWeight: 700, fontSize: 22, flex: 1 },
  leagueMeta: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8B9A92' },
  chevron: { display: 'inline-block', transition: 'transform 0.25s ease', color: '#D4A017', fontSize: 14 },
  fixture: { display: 'flex', alignItems: 'center', gap: 16, padding: '18px 4px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  teamName: { fontSize: 14, fontWeight: 500 },
  hiddenTeams: { fontSize: 14, fontWeight: 500, color: '#8B9A92', fontStyle: 'italic' },
  vs: { color: '#8B9A92', fontSize: 11 },
  finalScore: { marginLeft: 10, fontSize: 12, fontWeight: 700, color: '#D4A017', fontFamily: 'monospace' },
  tipLine: { fontSize: 12.5, color: '#D4A017', marginTop: 6, fontWeight: 600 },
  unlockRow: { marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  unlockBtn: { background: '#D4A017', color: '#0E1912', border: 'none', padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  unlockLink: { background: 'transparent', color: '#D4A017', border: '1px solid rgba(212,160,23,0.5)', padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 700, textDecoration: 'none' },
  unlockErrorText: { fontSize: 11.5, color: '#E0665A' },
  stamp: { flex: '0 0 60px', width: 60, height: 60, borderRadius: '50%', borderWidth: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  lock: { fontSize: 11, color: '#8B9A92', border: '1px solid rgba(247,245,239,0.12)', padding: '6px 10px', borderRadius: 14, whiteSpace: 'nowrap' },
  footer: { maxWidth: 900, margin: '40px auto 0', padding: '32px 24px 48px', borderTop: '1px solid rgba(247,245,239,0.12)' },
  footerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  footerLinks: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  footerLink: { color: '#8B9A92', textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  footerNotice: { color: '#8B9A92', fontSize: 12, lineHeight: 1.6, marginTop: 20, maxWidth: 640 },
  footerCopyright: { color: '#8B9A9299', fontSize: 11, marginTop: 16 },
}