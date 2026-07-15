'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 24 }}>
      <h1>Log in to DayTips</h1>

      <form onSubmit={handleLogin}>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 10, marginTop: 12 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, marginTop: 16 }}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {message && <p style={{ marginTop: 16, fontSize: 14 }}>{message}</p>}

      <p style={{ marginTop: 24, fontSize: 14 }}>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  )
}
