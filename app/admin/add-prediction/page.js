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
  const [kickoffTime, setKickoffTime] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [tip, setTip] = useState('')
  const [confidence, setConfidence] = useState(70)
  const [isPremium, setIsPremium] = useState(true)

  useEffect(() => {
    loadLeagues()
  }, [])

  async function loadLeagues() {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('country', { ascending: true })

    if (!error) setLeagues(data)
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
      kickoff_time: kickoffTime,
      analysis: analysis,
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
      setKickoffTime('')
      setAnalysis('')
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

          <label style={{ fontSize: 13, color: '#555' }}>Kickoff time</label>
          <input
            type="datetime-local"
            value={kickoffTime}
            onChange={(e) => setKickoffTime(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
          />

          <textarea
            placeholder="Analysis"
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
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
    </div>
  )
}