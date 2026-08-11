'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import sd from '@/app/styles/scoutsDossier.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1) // 1 = email/password, 2 = 2FA
  const router = useRouter()

  const ADMIN_EMAIL = 'dominicernest38@gmail.com'

  // STEP 1: Handle email/password submission
  const handleStep1 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Check if admin
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setStep(2)
      setLoading(false)
      return
    }

    // Regular user login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/')
    }
  }

  // STEP 2: Handle 2FA submission
  const handleStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (twoFactorCode.length !== 6) {
      setMessage('Enter a 6-digit code')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('adminToken', data.token)
        router.push('/admin')
      } else {
        setMessage(data.error || 'Login failed')
        setLoading(false)
      }
    } catch (err) {
      setMessage('Error connecting to server')
      setLoading(false)
    }
  }

  // Reset to step 1
  const goBack = () => {
    setStep(1)
    setMessage('')
    setTwoFactorCode('')
  }

  return (
    <div className={sd.authPage}>
      <div className={sd.authCard}>
        <div className={sd.authLogo}>
          <img src="/logo.png" alt="DayTips" className={sd.authLogoMark} />
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        <h1 className={sd.authTitle}>
          {step === 1 ? 'Welcome back' : '2FA Verification'}
        </h1>
        <p className={sd.authSubtitle}>
          {step === 1 
            ? 'Log in to see today\'s verdicts.' 
            : 'Enter the 6-digit code from your authenticator app'}
        </p>

        <form onSubmit={step === 1 ? handleStep1 : handleStep2}>
          {step === 1 ? (
            <>
              <div className={sd.field}>
                <label className={sd.fieldLabel}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={sd.input}
                />
              </div>

              <div className={sd.field}>
                <label className={sd.fieldLabel}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={sd.input}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={sd.btnPrimary}
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </>
          ) : (
            <>
              <div style={{
                backgroundColor: 'rgba(212,160,23,0.1)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#D4A017', margin: 0 }}>🔐 Admin: {email}</p>
              </div>

              <div className={sd.field}>
                <label className={sd.fieldLabel}>2FA Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  maxLength="6"
                  className={sd.input}
                  autoFocus
                  required
                />
                <p style={{ fontSize: '12px', color: '#8B9A92', marginTop: '4px' }}>
                  Enter any 6-digit number
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className={sd.btnPrimary}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                {loading ? 'Verifying…' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={goBack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8B9A92',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginTop: '12px',
                  width: '100%'
                }}
              >
                ← Back
              </button>
            </>
          )}
        </form>

        {message && <p className={sd.authError}>{message}</p>}

        {step === 1 && (
          <p className={sd.authFooter}>
            Don't have an account? <Link href="/signup" className={sd.linkGold}>Sign up</Link>
          </p>
        )}
      </div>
    </div>
  )
}