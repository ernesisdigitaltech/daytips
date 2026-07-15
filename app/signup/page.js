'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account before logging in.')
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 24 }}>
      <h1>Create your DayTips account</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Get 10 free coins instantly, plus 5 more every day.
      </p>

      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 10, marginTop: 12 }}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ width: '100%', padding: 10, marginTop: 12 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, marginTop: 16 }}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      {message && <p style={{ marginTop: 16, fontSize: 14 }}>{message}</p>}

      <p style={{ marginTop: 24, fontSize: 14 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  )
}