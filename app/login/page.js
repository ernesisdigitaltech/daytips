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
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1) // 1 = email/password, 2 = security question
  const [securityQuestion, setSecurityQuestion] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const justSignedUp = searchParams.get('justSignedUp') === '1'

  const ADMIN_EMAIL = 'dominicernest38@gmail.com'
  const SECURITY_QUESTION = 'ane bhora ete-ete-anum'

  // STEP 1: Check if admin
  const handleStep1 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Check if this is the admin email
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      // Check if security is set up in database
      const { data, error } = await supabase
        .from('profiles')
        .select('security_answer_hash')
        .eq('email', email)
        .single()

      if (error || !data?.security_answer_hash) {
        setMessage('Security not set up. Contact administrator.')
        setLoading(false)
        return
      }

      setSecurityQuestion(SECURITY_QUESTION)
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

  // STEP 2: Verify security answer via API
  const handleStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!securityAnswer || securityAnswer.length < 2) {
      setMessage('Please enter your security answer')
      setLoading(false)
      return
    }

    try {
      // Call API to verify answer (answer NEVER exposed to browser)
      const response = await fetch('/api/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          answer: securityAnswer
        })
      })

      const data = await response.json()

      if (response.ok) {
        // ✅ Answer correct - login with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          setMessage('Invalid password')
          setLoading(false)
          return
        }

        if (authData.user) {
          const token = Buffer.from(
            JSON.stringify({
              userId: authData.user.id,
              email: email,
              isAdmin: true,
              timestamp: Date.now()
            })
          ).toString('base64')

          localStorage.setItem('adminToken', token)
          setLoading(false)
          router.push('/admin')
        }
      } else {
        setMessage(data.error || 'Incorrect answer')
        setLoading(false)
      }
    } catch (error) {
      setMessage('Error verifying answer')
      setLoading(false)
    }
  }

  // Hide every 2nd word in the question
  function getPartialQuestion(fullQuestion) {
    if (!fullQuestion) return ''
    const words = fullQuestion.split(' ')
    return words.map((word, index) => {
      if (index % 2 === 1 && word.length > 2) {
        return '*'.repeat(word.length)
      }
      return word
    }).join(' ')
  }

  const goBack = () => {
    setStep(1)
    setMessage('')
    setSecurityAnswer('')
  }

  const partialQuestion = getPartialQuestion(SECURITY_QUESTION)

  return (
    <div className={sd.authPage}>
      <div className={sd.authCard}>
        <div className={sd.authLogo}>
          <img src="/logo.png" alt="DayTips" className={sd.authLogoMark} />
          <div className={sd.authLogoText}>DayTips</div>
        </div>

        <h1 className={sd.authTitle}>
          {step === 1 ? 'Welcome back' : 'Security Verification'}
        </h1>
        <p className={sd.authSubtitle}>
          {step === 1 
            ? 'Log in to see today\'s verdicts.' 
            : 'Answer your security question to continue'
          }
        </p>

        {justSignedUp && step === 1 && (
          <p className={sd.authSuccess} style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Account created — log in to get started.
          </p>
        )}

        <form onSubmit={step === 1 ? handleStep1 : handleStep2}>
          {step === 1 ? (
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
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </>
          ) : (
            <>
              <div style={{
                backgroundColor: 'rgba(212,160,23,0.1)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#D4A017', margin: '0 0 4px 0', fontWeight: '600' }}>
                  🔐 Security Question
                </p>
                <p style={{ color: '#F7F5EF', margin: 0, fontSize: '16px' }}>
                  {partialQuestion}
                </p>
                <p style={{ color: '#8B9A92', marginTop: '4px', fontSize: '12px' }}>
                  Enter your complete answer below
                </p>
              </div>

              <div className={sd.field}>
                <label className={sd.fieldLabel} htmlFor="securityAnswer">Your Answer</label>
                <input
                  id="securityAnswer"
                  type="text"
                  placeholder="Enter your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                  className={sd.input}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
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
                ← Back to login
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