'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import sd from '@/app/styles/scoutsDossier.module.css'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const justSignedUp = searchParams.get('justSignedUp') === '1'

  // ADMIN EMAIL - Hardcoded for now
  const ADMIN_EMAIL = 'dominicernest38@gmail.com'

  async function handleInitialLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setShow2FA(false)

    try {
      // Check if this is the admin email
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.log('✅ Admin email detected - showing 2FA')
        setShow2FA(true)
        setLoading(false)
        return
      }

      // Not admin - regular login
      console.log('👤 Regular user - logging in')
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

    } catch (error) {
      setMessage('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  async function handle2FALogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (twoFactorCode.length !== 6) {
      setMessage('Please enter a 6-digit 2FA code')
      setLoading(false)
      return
    }

    try {
      // First, login with Supabase to get the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      // Now verify 2FA with our API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          twoFactorCode: twoFactorCode
        })
      })

      const data2 = await response.json()

      if (response.ok) {
        localStorage.setItem('adminToken', data2.token)
        setLoading(false)
        router.push('/admin')
      } else {
        // If 2FA fails, sign out the user
        await supabase.auth.signOut()
        setMessage(data2.error || 'Invalid 2FA code')
        setLoading(false)
      }
    } catch (error) {
      await supabase.auth.signOut()
      setMessage('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (show2FA) {
      handle2FALogin(e)
    } else {
      handleInitialLogin(e)
    }
  }

  function handleBack() {
    setShow2FA(false)
    setMessage('')
    setTwoFactorCode('')
    setLoading(false)
  }

  return (
    <div className={sd.authPage}>
      <div className={sd.authCard}>
        <div className={sd.authLogo}>
          <img src="/logo.png" alt="DayTips" className={sd.authLogoMark} />
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        <h1 className={sd.authTitle}>
          {show2FA ? '2FA Verification' : 'Welcome back'}
        </h1>
        <p className={sd.authSubtitle}>
          {show2FA
            ? 'Enter the 6-digit code from Google Authenticator'
            : 'Log in to see today\'s verdicts.'
          }
        </p>

        {justSignedUp && !show2FA && (
          <p className={sd.authSuccess} style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Account created — log in to get started.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {!show2FA ? (
            <>
              <div className={sd.field}>
                <label className={sd.fieldLabel} htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={sd.input}
                />
              </div>

              <div className={sd.field}>
                <label className={sd.fieldLabel} htmlFor="password">Password</label>
                <input
                  id="password"
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
                style={{ marginTop: '1.5rem' }}
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
                <p style={{ color: '#D4A017', fontSize: '14px', margin: 0 }}>
                  🔐 Admin account detected
                </p>
                <p style={{ color: '#8B9A92', fontSize: '12px', marginTop: '4px' }}>
                  {email}
                </p>
              </div>

              <div className={sd.field}>
                <label className={sd.fieldLabel} htmlFor="2fa">2FA Code</label>
                <input
                  id="2fa"
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
                  Enter 123456 for test mode
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className={sd.btnPrimary}
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Verifying…' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={handleBack}
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
                ← Back to login
              </button>
            </>
          )}
        </form>

        {message && <p className={sd.authError}>{message}</p>}

        {!show2FA && (
          <p className={sd.authFooter}>
            Don't have an account? <Link href="/signup" className={sd.linkGold}>Sign up</Link>
          </p>
        )}
      </div>
    </div>
  )
}