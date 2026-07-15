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
  const [checkEmail, setCheckEmail] = useState(false)
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

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // If email confirmation is required, Supabase returns a user but no session.
    // If confirmation is off, a session comes back immediately and we can go straight in.
    if (data.session) {
      router.push('/')
    } else {
      setCheckEmail(true)
    }
  }

  return (
    <div className={sd.authPage}>
      <div className={sd.authCard}>
        <div className={sd.authLogo}>
          <div className={sd.authLogoMark}>D</div>
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        {checkEmail ? (
          <>
            <h1 className={sd.authTitle}>Almost there</h1>
            <p className={sd.authSubtitle}>
              We sent a confirmation link to <strong style={{ color: '#F7F5EF' }}>{email}</strong>. Verify your email to activate your account.
            </p>
            <p className={sd.authFooter}>
              Already confirmed? <Link href="/login" className={sd.linkGold}>Log in</Link>
            </p>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}