'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import sd from '@/app/styles/scoutsDossier.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

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
          <div className={sd.authLogoMark}>D</div>
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        <h1 className={sd.authTitle}>Welcome back</h1>
        <p className={sd.authSubtitle}>Log in to see today's verdicts.</p>

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