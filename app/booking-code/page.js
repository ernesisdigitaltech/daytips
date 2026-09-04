'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function BookingCodeHistoryPage() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('booking_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (!error) setCodes(data)
    setLoading(false)
  }

  const groupedByDate = codes.reduce((acc, bc) => {
    const key = new Date(bc.created_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(bc)
    return acc
  }, {})

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
      </header>

      <main style={styles.main}>
        <p style={styles.eyebrow}>Archive</p>
        <h1 style={styles.h1}>Booking Code History</h1>
        <p style={styles.subtitle}>Every daily booking code we've posted, in one place.</p>

        {loading && <p style={{ color: '#8B9A92' }}>Loading...</p>}

        {!loading && codes.length === 0 && (
          <p style={{ color: '#8B9A92' }}>No booking codes yet — check back soon.</p>
        )}

        {!loading && Object.entries(groupedByDate).map(([date, dayCodes]) => (
          <div key={date} style={{ marginTop: 32 }}>
            <div style={styles.dateHeader}>{date}</div>
            <div style={styles.grid}>
              {dayCodes.map((bc) => (
                <div key={bc.id} style={styles.card}>
                  <div style={styles.platform}>{bc.platform}</div>
                  <div style={styles.code}>{bc.code}</div>
                  <div style={styles.odds}>Odds {Number(bc.odds).toFixed(2)}</div>
                  <div style={styles.time}>
                    {new Date(bc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' },
  eyebrow: { fontSize: 12, letterSpacing: '0.15em', color: '#D4A017', textTransform: 'uppercase', margin: 0 },
  h1: { fontWeight: 800, fontSize: 30, margin: '8px 0 4px' },
  subtitle: { color: '#8B9A92', fontSize: 14, marginBottom: 8 },
  dateHeader: { fontSize: 13, fontWeight: 700, color: '#F7F5EF', paddingBottom: 8, borderBottom: '2px solid #3B7A57', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 },
  card: { background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 10, padding: '12px 14px' },
  platform: { fontSize: 11, color: '#8B9A92', textTransform: 'uppercase', letterSpacing: '0.06em' },
  code: { fontSize: 18, fontWeight: 800, color: '#D4A017', fontFamily: 'monospace', marginTop: 4 },
  odds: { fontSize: 12, color: '#B8C2BC', marginTop: 4 },
  time: { fontSize: 11, color: '#8B9A9299', marginTop: 4 },
}