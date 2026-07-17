'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function ManagePredictionsPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [scoreInputs, setScoreInputs] = useState({})
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/')
      return
    }

    setChecking(false)
    loadFixtures()
  }

  async function loadFixtures() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fixtures')
      .select('*, leagues(country, name)')
      .order('kickoff_time', { ascending: false })

    if (!error) {
      setFixtures(data)
      const initialScores = {}
      data.forEach((fx) => { initialScores[fx.id] = fx.final_score || '' })
      setScoreInputs(initialScores)
    }
    setLoading(false)
  }

  async function togglePremium(fixture) {
    setSavingId(fixture.id)
    const { error } = await supabase
      .from('fixtures')
      .update({ is_premium: !fixture.is_premium })
      .eq('id', fixture.id)

    if (!error) {
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixture.id ? { ...f, is_premium: !f.is_premium } : f))
      )
    }
    setSavingId(null)
  }

  async function setResult(fixture, result) {
    setSavingId(fixture.id)
    const { error } = await supabase
      .from('fixtures')
      .update({ result })
      .eq('id', fixture.id)

    if (!error) {
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixture.id ? { ...f, result } : f))
      )
    }
    setSavingId(null)
  }

  async function saveScore(fixture) {
    const value = scoreInputs[fixture.id]?.trim() || null
    setSavingId(fixture.id)
    const { error } = await supabase
      .from('fixtures')
      .update({ final_score: value })
      .eq('id', fixture.id)

    if (!error) {
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixture.id ? { ...f, final_score: value } : f))
      )
    }
    setSavingId(null)
  }

  async function toggleArchived(fixture) {
    setSavingId(fixture.id)
    const { error } = await supabase
      .from('fixtures')
      .update({ admin_archived: !fixture.admin_archived })
      .eq('id', fixture.id)

    if (!error) {
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixture.id ? { ...f, admin_archived: !f.admin_archived } : f))
      )
    }
    setSavingId(null)
  }

  if (checking) {
    return <div style={styles.body}><p style={{ padding: 24, color: '#8B9A92' }}>Checking access...</p></div>
  }

  const archivedCount = fixtures.filter((f) => f.admin_archived).length
  const visibleFixtures = fixtures.filter((f) => showArchived || !f.admin_archived)

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
        <Link href="/admin/add-prediction" style={styles.addLink}>+ Add Prediction</Link>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>Manage Predictions</h1>
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived((s) => !s)} style={styles.archiveToggle}>
              {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
            </button>
          )}
        </div>
        <p style={styles.archiveNote}>
          Archiving only tidies this admin list — archived fixtures still show on the public homepage on their date.
        </p>

        {loading && <p style={{ color: '#8B9A92' }}>Loading fixtures...</p>}

        {!loading && visibleFixtures.length === 0 && (
          <p style={{ color: '#8B9A92' }}>No fixtures to show.</p>
        )}

        {!loading && visibleFixtures.map((fx) => (
          <div key={fx.id} style={{ ...styles.card, ...(fx.admin_archived ? styles.cardArchived : {}) }}>
            <div style={styles.cardHeader}>
              <div>
                <div style={{ fontSize: 11, color: '#8B9A92', textTransform: 'uppercase' }}>
                  {fx.leagues.country} — {fx.leagues.name}
                  {fx.admin_archived && <span style={styles.archivedTag}>ARCHIVED</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                  {fx.home_team} vs {fx.away_team}
                </div>
                <div style={{ fontSize: 12, color: '#8B9A92', marginTop: 2 }}>
                  {new Date(fx.kickoff_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#D4A017' }}>
                {fx.tip} — {fx.confidence_percent}%
              </div>
            </div>

            <div style={styles.controlsRow}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={fx.is_premium}
                  onChange={() => togglePremium(fx)}
                  disabled={savingId === fx.id}
                />
                Premium (2 coins)
              </label>

              <div style={styles.resultButtons}>
                <button
                  onClick={() => setResult(fx, 'pending')}
                  disabled={savingId === fx.id}
                  style={{ ...styles.resultBtn, opacity: fx.result === 'pending' ? 1 : 0.5 }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setResult(fx, 'correct')}
                  disabled={savingId === fx.id}
                  style={{ ...styles.resultBtn, borderColor: '#D4A017', opacity: fx.result === 'correct' ? 1 : 0.5 }}
                >
                  ✓ Correct
                </button>
                <button
                  onClick={() => setResult(fx, 'wrong')}
                  disabled={savingId === fx.id}
                  style={{ ...styles.resultBtn, borderColor: '#A63A2E', opacity: fx.result === 'wrong' ? 1 : 0.5 }}
                >
                  ✗ Wrong
                </button>
              </div>
            </div>

            <div style={styles.scoreRow}>
              <input
                type="text"
                placeholder="Final score e.g. 2-1"
                value={scoreInputs[fx.id] ?? ''}
                onChange={(e) => setScoreInputs((prev) => ({ ...prev, [fx.id]: e.target.value }))}
                style={styles.scoreInput}
              />
              <button
                onClick={() => saveScore(fx)}
                disabled={savingId === fx.id}
                style={styles.saveScoreBtn}
              >
                Save score
              </button>
              <button
                onClick={() => toggleArchived(fx)}
                disabled={savingId === fx.id}
                style={styles.archiveBtn}
              >
                {fx.admin_archived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  addLink: { color: '#D4A017', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  main: { maxWidth: 700, margin: '0 auto', padding: '32px 24px 80px' },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  h1: { fontSize: 26, fontWeight: 700, margin: 0 },
  archiveToggle: { background: 'transparent', border: '1px solid rgba(247,245,239,0.2)', color: '#8B9A92', padding: '6px 12px', borderRadius: 14, fontSize: 12, cursor: 'pointer' },
  archiveNote: { fontSize: 12, color: '#8B9A9299', marginTop: 6, marginBottom: 24 },
  card: { background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 10, padding: 18, marginBottom: 14 },
  cardArchived: { opacity: 0.55 },
  archivedTag: { marginLeft: 8, fontSize: 10, color: '#8B9A92', border: '1px solid rgba(247,245,239,0.2)', padding: '1px 6px', borderRadius: 6, letterSpacing: '0.05em' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  controlsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 },
  toggleLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8B9A92' },
  resultButtons: { display: 'flex', gap: 8 },
  resultBtn: { background: 'transparent', border: '1px solid rgba(247,245,239,0.2)', color: '#F7F5EF', padding: '6px 12px', borderRadius: 14, fontSize: 12, cursor: 'pointer' },
  scoreRow: { display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(247,245,239,0.08)', flexWrap: 'wrap' },
  scoreInput: { flex: '1 1 140px', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(247,245,239,0.15)', background: '#0E1912', color: '#F7F5EF', fontSize: 13 },
  saveScoreBtn: { background: '#3B7A57', color: '#F7F5EF', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  archiveBtn: { background: 'transparent', border: '1px solid rgba(247,245,239,0.2)', color: '#8B9A92', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
}