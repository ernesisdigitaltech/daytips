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
  const [twoFactorCode, setTwoFactorCode] = useState('')  // NEW: 2FA code
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const justSignedUp = searchParams.get('justSignedUp') === '1'

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // STEP 1: Try admin login with 2FA first
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          twoFactorCode 
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Admin login successful with 2FA
        localStorage.setItem('adminToken', data.token)
        setLoading(false)
        router.push('/admin')
        return
      } else if (response.status === 403 || response.status === 400) {
        // Admin-specific error (not admin, or 2FA not set up)
        // Try regular user login instead
        await regularUserLogin()
        return
      } else {
        // Other error from admin API
        setMessage(data.error || 'Login failed')
        setLoading(false)
        return
      }
    } catch (error) {
      // Admin API failed, fallback to regular user login
      await regularUserLogin()
    }
  }

  // Regular user login (no 2FA)
  async function regularUserLogin() {
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

  return (
    <div className={sd.authPage}>
      <div className={sd.authCard}>
        <div className={sd.authLogo}>
          <img src="/logo.png" alt="DayTips" className={sd.authLogoMark} />
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        <h1 className={sd.authTitle}>Welcome back</h1>
        <p className={sd.authSubtitle}>Log in to see today's verdicts.</p>

        {justSignedUp && (
          <p className={sd.authSuccess} style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Account created — log in to get started.
          </p>
        )}

        <form onSubmit={handleLogin}>
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

          {/* NEW: 2FA Code field - only shown if needed */}
          <div className={sd.field}>
            <label className={sd.fieldLabel} htmlFor="2fa">2FA Code</label>
            <input
              id="2fa"
              type="text"
              placeholder="Enter 6-digit code (admin only)"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              maxLength="6"
              className={sd.input}
            />
            <p style={{ fontSize: '12px', color: '#8B9A92', marginTop: '4px' }}>
              Only required for admin accounts
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={sd.btnPrimary}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {message && <p className={sd.authError}>{message}</p>}

        <p className={sd.authFooter}>
          Don't have an account? <Link href="/signup" className={sd.linkGold}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}