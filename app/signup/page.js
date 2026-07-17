'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import sd from '@/app/styles/scoutsDossier.module.css'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    // Supabase sometimes returns success (no error) for an email that's
    // already registered, as an anti-enumeration measure — this is the
    // reliable way to detect that case regardless of your confirm-email setting.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false)
      setError('That email is already registered. Try logging in instead.')
      return
    }

    // This flow assumes email confirmation is OFF in Supabase (Authentication →
    // Providers → Email → "Confirm email"). If it's on, signUp still returns a
    // session-less success here, and the user won't be able to log in until they
    // confirm — so no "check your email" messaging is shown, by design.
    if (data.session) {
      await supabase.auth.signOut()
    }

    setLoading(false)
    router.push('/login?justSignedUp=1')
  }

  return (
    <div className={sd.authPage}>
      <div className={sd.authCard}>
        <div className={sd.authLogo}>
          <img src="/logo.png" alt="DayTips" className={sd.authLogoMark} />
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        <h1 className={sd.authTitle}>Create your account</h1>
        <p className={sd.authSubtitle}>Get 10 free coins to start unlocking tips.</p>

        <form onSubmit={handleSignup}>
          <div className={sd.field}>
            <label className={sd.fieldLabel} htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Jamie Rivera"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={sd.input}
            />
          </div>

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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={sd.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={sd.btnPrimary}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        {error && <p className={sd.authError}>{error}</p>}

        <p className={sd.authFooter}>
          Already have an account? <Link href="/login" className={sd.linkGold}>Log in</Link>
        </p>
      </div>
    </div>
  )
}