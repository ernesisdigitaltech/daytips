'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AddPredictionPage() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [selectedLeagueId, setSelectedLeagueId] = useState('')
  const [newLeagueCountry, setNewLeagueCountry] = useState('')
  const [newLeagueName, setNewLeagueName] = useState('')

  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [kickoffDate, setKickoffDate] = useState('')
  const [tip, setTip] = useState('')
  const [confidence, setConfidence] = useState(70)
  const [isPremium, setIsPremium] = useState(true)

  const [bookingCodes, setBookingCodes] = useState([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [bcCode, setBcCode] = useState('')
  const [bcPlatform, setBcPlatform] = useState('')
  const [bcOdds, setBcOdds] = useState('')
  const [bcSaving, setBcSaving] = useState(false)
  const [bcMessage, setBcMessage] = useState('')

  useEffect(() => {
    loadLeagues()
    loadBookingCodes()
  }, [])

  async function loadLeagues() {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('country', { ascending: true })

    if (!error) setLeagues(data)
  }

  async function loadBookingCodes() {
    setLoadingCodes(true)
    const { data, error } = await supabase
      .from('booking_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error) setBookingCodes(data)
    setLoadingCodes(false)
  }

  async function handleCreateBookingCode(e) {
    e.preventDefault()
    setBcMessage('')

    if (!bcCode || !bcPlatform || !bcOdds) {
      setBcMessage('Fill in all three fields.')
      return
    }

    setBcSaving(true)
    const { error } = await supabase.from('booking_codes').insert({
      code: bcCode.trim(),
      platform: bcPlatform.trim(),
      odds: parseFloat(bcOdds),
    })
    setBcSaving(false)

    if (error) {
      setBcMessage('Error: ' + error.message)
    } else {
      setBcMessage('Booking code added ✅')
      setBcCode('')
      setBcPlatform('')
      setBcOdds('')
      loadBookingCodes()
    }
  }

  async function handleDeleteBookingCode(id) {
    if (!confirm('Delete this booking code?')) return
    const { error } = await supabase.from('booking_codes').delete().eq('id', id)
    if (!error) setBookingCodes((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleCreateLeague(e) {
    e.preventDefault()
    if (!newLeagueCountry || !newLeagueName) return

    const { data, error } = await supabase
      .from('leagues')
      .insert({ country: newLeagueCountry, name: newLeagueName })
      .select()
      .single()

    if (error) {
      setMessage('Error creating league: ' + error.message)
    } else {
      setMessage('League created ✅')
      setNewLeagueCountry('')
      setNewLeagueName('')
      loadLeagues()
      setSelectedLeagueId(data.id)
    }
  }

  async function handleCreateFixture(e) {
    e.preventDefault()

    if (!selectedLeagueId) {
      setMessage('Please select a league first.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('fixtures').insert({
      league_id: selectedLeagueId,
      home_team: homeTeam,
      away_team: awayTeam,
      kickoff_time: kickoffDate ? new Date(`${kickoffDate}T12:00:00`).toISOString() : null,
      analysis: '', // no longer collected — homepage doesn't display it anymore
      tip: tip,
      confidence_percent: confidence,
      is_premium: isPremium,
    })

    setLoading(false)

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Fixture added ✅')
      setHomeTeam('')
      setAwayTeam('')
      setKickoffDate('')
      setTip('')
      setConfidence(70)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Add Prediction</h1>

      {/* CREATE LEAGUE */}
      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>1. Add a new league (skip if it already exists below)</h3>
        <form onSubmit={handleCreateLeague}>
          <input
            placeholder="Country (e.g. England)"
            value={newLeagueCountry}
            onChange={(e) => setNewLeagueCountry(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 8 }}
          />
          <input
            placeholder="League name (e.g. Premier League)"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 8 }}
          />
          <button type="submit" style={{ marginTop: 8, padding: '8px 14px' }}>
            Create league
          </button>
        </form>
      </section>

      {/* CREATE FIXTURE */}
      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>2. Add fixture</h3>
        <form onSubmit={handleCreateFixture}>
          <label style={{ fontSize: 13, color: '#555' }}>League</label>
          <select
            value={selectedLeagueId}
            onChange={(e) => setSelectedLeagueId(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
          >
            <option value="">Select a league...</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.country} — {l.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Home team"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="Away team"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />

          <label style={{ fontSize: 13, color: '#555' }}>Match date</label>
          <input
            type="date"
            value={kickoffDate}
            onChange={(e) => setKickoffDate(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
          />

          <input
            placeholder="Tip (e.g. Over 2.5 goals)"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />

          <label style={{ fontSize: 13, color: '#555' }}>
            Confidence: {confidence}%
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Premium (requires coins to unlock)
          </label>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12 }}>
            {loading ? 'Saving...' : 'Add fixture'}
          </button>
        </form>
      </section>

      {message && <p style={{ marginTop: 16 }}>{message}</p>}

      {/* BOOKING CODES */}
      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginTop: 32 }}>
        <h3 style={{ marginTop: 0 }}>3. Add Booking Code</h3>
        <form onSubmit={handleCreateBookingCode}>
          <input
            placeholder="Booking Code (e.g. XR7F92)"
            value={bcCode}
            onChange={(e) => setBcCode(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="Bet Platform (e.g. SportyBet, Bet9ja)"
            value={bcPlatform}
            onChange={(e) => setBcPlatform(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Odds (e.g. 45.20)"
            value={bcOdds}
            onChange={(e) => setBcOdds(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button type="submit" disabled={bcSaving} style={{ width: '100%', padding: 12 }}>
            {bcSaving ? 'Saving...' : 'Add booking code'}
          </button>
        </form>
        {bcMessage && <p style={{ marginTop: 12 }}>{bcMessage}</p>}
      </section>

      {/* BOOKING CODE HISTORY — separate from the add form above */}
      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Booking Code History</h3>
        {loadingCodes ? (
          <p style={{ color: '#777' }}>Loading...</p>
        ) : bookingCodes.length === 0 ? (
          <p style={{ color: '#777' }}>No booking codes yet.</p>
        ) : (
          <div>
            {bookingCodes.map((bc) => (
              <div
                key={bc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{bc.platform} — {bc.code}</div>
                  <div style={{ fontSize: 12, color: '#777' }}>
                    Odds {bc.odds} · {new Date(bc.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBookingCode(bc.id)}
                  style={{ background: 'none', border: 'none', color: '#a63a2e', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}