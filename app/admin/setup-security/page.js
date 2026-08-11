'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SetupSecurity() {
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [confirmAnswer, setConfirmAnswer] = useState('')
  const [message, setMessage] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [existingQuestion, setExistingQuestion] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/login')
      return
    }

    // Check if security question already exists
    async function checkExisting() {
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('security_question')
          .eq('id', userData.user.id)
          .single()
        
        if (profile?.security_question) {
          setExistingQuestion(profile.security_question)
        }
      }
      setLoading(false)
    }

    checkExisting()
  }, [router])

  // Generate a random salt
  function generateSalt() {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Hash answer with salt
  async function hashAnswer(answer, salt) {
    const encoder = new TextEncoder()
    const data = encoder.encode(answer + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Generate partial question (hide every 2nd word)
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

  async function handleSetup(e) {
    e.preventDefault()
    setIsSettingUp(true)
    setMessage('')

    if (answer !== confirmAnswer) {
      setMessage('❌ Answers do not match')
      setIsSettingUp(false)
      return
    }

    if (answer.length < 4) {
      setMessage('❌ Answer must be at least 4 characters')
      setIsSettingUp(false)
      return
    }

    if (question.length < 5) {
      setMessage('❌ Question must be at least 5 characters')
      setIsSettingUp(false)
      return
    }

    try {
      const salt = generateSalt()
      const hashedAnswer = await hashAnswer(answer, salt)

      const { data: userData } = await supabase.auth.getUser()
      
      if (!userData.user) {
        setMessage('❌ Not logged in')
        setIsSettingUp(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          security_question: question,
          security_answer_hash: hashedAnswer,
          security_salt: salt,
          security_attempts: 0,
          security_locked_until: null
        })
        .eq('id', userData.user.id)

      if (error) {
        setMessage('❌ Error: ' + error.message)
      } else {
        setMessage('✅ Security question set up successfully! Redirecting...')
        setTimeout(() => router.push('/admin'), 2000)
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    }

    setIsSettingUp(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete your security question?')) return

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          security_question: null,
          security_answer_hash: null,
          security_salt: null,
          security_attempts: 0,
          security_locked_until: null
        })
        .eq('id', userData.user.id)

      if (error) {
        setMessage('❌ Error deleting: ' + error.message)
      } else {
        setMessage('✅ Security question deleted')
        setExistingQuestion('')
        setQuestion('')
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    }
  }

  const partialQuestion = question ? getPartialQuestion(question) : ''

  if (loading) {
    return <div style={{ color: '#F7F5EF', padding: '40px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0E1912',
      color: '#F7F5EF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(247,245,239,0.05)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid rgba(247,245,239,0.12)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>🔐 Security Question</h1>
        <p style={{ textAlign: 'center', color: '#8B9A92', marginBottom: '24px' }}>
          {existingQuestion ? 'Update your security question' : 'Set up your security question for admin login'}
        </p>

        {existingQuestion && (
          <div style={{
            backgroundColor: 'rgba(59,122,87,0.2)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #3B7A57'
          }}>
            <p style={{ color: '#3B7A57', margin: 0, fontSize: '14px' }}>
              ✅ Current question: <strong>{existingQuestion}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSetup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Security Question
            </label>
            <input
              type="text"
              placeholder="e.g., What is your mother's maiden name?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(247,245,239,0.12)',
                background: 'rgba(247,245,239,0.05)',
                color: '#F7F5EF',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {question && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(212,160,23,0.1)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#D4A017'
              }}>
                🔍 Preview: {partialQuestion}
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#8B9A92', marginTop: '4px' }}>
              Every 2nd word will be hidden on the login page for security
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Answer
            </label>
            <input
              type="text"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(247,245,239,0.12)',
                background: 'rgba(247,245,239,0.05)',
                color: '#F7F5EF',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '12px', color: '#8B9A92', marginTop: '4px' }}>
              Use a unique answer that only you know (min 4 characters)
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Confirm Answer
            </label>
            <input
              type="text"
              placeholder="Re-enter your answer"
              value={confirmAnswer}
              onChange={(e) => setConfirmAnswer(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(247,245,239,0.12)',
                background: 'rgba(247,245,239,0.05)',
                color: '#F7F5EF',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: message.includes('✅') ? 'rgba(59,122,87,0.2)' : 'rgba(166,58,46,0.2)',
              color: message.includes('✅') ? '#3B7A57' : '#A63A2E',
              border: '1px solid',
              borderColor: message.includes('✅') ? '#3B7A57' : '#A63A2E'
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSettingUp}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#D4A017',
              color: '#0E1912',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSettingUp ? 'not-allowed' : 'pointer',
              opacity: isSettingUp ? 0.6 : 1
            }}
          >
            {isSettingUp ? 'Saving...' : existingQuestion ? 'Update Security Question' : 'Save Security Question'}
          </button>
        </form>

        {existingQuestion && (
          <button
            onClick={handleDelete}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              backgroundColor: 'transparent',
              color: '#A63A2E',
              border: '1px solid #A63A2E',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Delete Security Question
          </button>
        )}

        <button
          onClick={() => router.push('/admin')}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '12px',
            background: 'transparent',
            color: '#8B9A92',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}