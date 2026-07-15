'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

// TODO: Replace these with your real Flutterwave payment links once created
const COIN_PACKAGES = [
  { coins: 20, price: '$2', link: 'https://flutterwave.com/pay/YOUR-LINK-20' },
  { coins: 50, price: '$5', link: 'https://flutterwave.com/pay/YOUR-LINK-50' },
  { coins: 100, price: '$9', link: 'https://flutterwave.com/pay/YOUR-LINK-100' },
  { coins: 200, price: '$17', link: 'https://flutterwave.com/pay/YOUR-LINK-200' },
  { coins: 500, price: '$40', link: 'https://flutterwave.com/pay/YOUR-LINK-500' },
]

// TODO: Replace with your real crypto wallet address
const CRYPTO_ADDRESS = 'your-wallet-address-here'

export default function SubscribePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [coinsClaimed, setCoinsClaimed] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('flutterwave')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

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
    setLoading(false)
  }

  async function handleSubmitClaim(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const coinsNum = parseInt(coinsClaimed, 10)
    if (!coinsNum || coinsNum <= 0) {
      setMessage('Enter a valid number of coins.')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('purchase_claims').insert({
      user_id: user.id,
      coins_claimed: coinsNum,
      payment_method: paymentMethod,
    })

    setSubmitting(false)

    if (error) {
      setMessage('Something went wrong: ' + error.message)
    } else {
      setMessage('Submitted! The admin will review and credit your coins shortly.')
      setCoinsClaimed('')
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
        <h1 style={styles.h1}>Buy Coins</h1>
        <p style={{ color: '#8B9A92', fontSize: 14, marginBottom: 32 }}>
          Pick a package, pay via Flutterwave or crypto, then tell us what you paid below.
        </p>

        {/* COIN PACKAGES */}
        <div style={styles.packageGrid}>
          {COIN_PACKAGES.map((pkg) => (
            <a key={pkg.coins} href={pkg.link} target="_blank" rel="noopener noreferrer" style={styles.packageCard}>
              <div style={styles.packageCoins}>{pkg.coins}</div>
              <div style={{ fontSize: 11, color: '#8B9A92', textTransform: 'uppercase' }}>coins</div>
              <div style={styles.packagePrice}>{pkg.price}</div>
            </a>
          ))}
        </div>

        {/* CRYPTO OPTION */}
        <div style={styles.cryptoBox}>
          <div style={{ fontSize: 12, color: '#8B9A92', textTransform: 'uppercase', marginBottom: 8 }}>
            Or pay with crypto
          </div>
          <div style={styles.cryptoAddress}>{CRYPTO_ADDRESS}</div>
          <p style={{ fontSize: 12, color: '#8B9A92', marginTop: 8 }}>
            Send the equivalent value for your chosen package, then submit the form below.
          </p>
        </div>

        {/* PURCHASE CLAIM FORM */}
        <div style={styles.claimBox}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Tell us what you paid</h3>
          <form onSubmit={handleSubmitClaim}>
            <label style={styles.label}>Payment method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={styles.input}
            >
              <option value="flutterwave">Flutterwave</option>
              <option value="crypto">Crypto</option>
            </select>

            <label style={styles.label}>How many coins did you pay for?</label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={coinsClaimed}
              onChange={(e) => setCoinsClaimed(e.target.value)}
              style={styles.input}
            />

            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Submitting...' : 'Notify admin'}
            </button>
          </form>

          {message && <p style={{ fontSize: 13, marginTop: 12, color: '#D4A017' }}>{message}</p>}
        </div>
      </main>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  packageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 28 },
  packageCard: { textDecoration: 'none', color: '#F7F5EF', background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 10, padding: '16px 8px', textAlign: 'center' },
  packageCoins: { fontSize: 22, fontWeight: 800, color: '#D4A017', fontFamily: 'monospace' },
  packagePrice: { fontSize: 13, color: '#8B9A92', marginTop: 6 },
  cryptoBox: { background: 'rgba(247,245,239,0.03)', border: '1px dashed rgba(247,245,239,0.15)', borderRadius: 10, padding: 16, marginBottom: 28 },
  cryptoAddress: { fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: '#D4A017' },
  claimBox: { background: 'rgba(247,245,239,0.03)', border: '1px solid rgba(247,245,239,0.1)', borderRadius: 12, padding: 24 },
  label: { fontSize: 12, color: '#8B9A92', display: 'block', marginBottom: 6, marginTop: 12 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(247,245,239,0.15)', background: '#0E1912', color: '#F7F5EF' },
  submitBtn: { width: '100%', padding: 12, marginTop: 16, background: '#D4A017', color: '#0E1912', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer' },
}