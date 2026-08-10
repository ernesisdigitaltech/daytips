'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Setup2FAPage() {
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  // Check if admin is logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    setup2FA()
  }, [router])

  async function setup2FA() {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/setup-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setError('')
      } else {
        setError(data.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function verify2FA() {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit code from Google Authenticator')
      return
    }

    setIsVerifying(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationCode })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || '2FA enabled successfully!')
        setTimeout(() => {
          router.push('/admin')
        }, 2000)
      } else {
        setError(data.error || 'Verification failed. Please try again.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Setting up 2FA...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 Two-Factor Authentication</h1>
        <p style={styles.subtitle}>Secure your admin account with 2FA</p>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        {!success && (
          <>
            <div style={styles.stepBox}>
              <h3 style={styles.stepTitle}>Step 1: Install Google Authenticator</h3>
              <p style={styles.stepText}>
                Download Google Authenticator from the App Store or Google Play Store.
              </p>
            </div>

            <div style={styles.stepBox}>
              <h3 style={styles.stepTitle}>Step 2: Scan QR Code</h3>
              <p style={styles.stepText}>
                Open Google Authenticator and scan the QR code below:
              </p>
              {qrCode && (
                <div style={styles.qrContainer}>
                  <img src={qrCode} alt="QR Code" style={styles.qrImage} />
                </div>
              )}
              <p style={styles.stepTextSmall}>
                Or enter this secret manually: <strong>{secret}</strong>
              </p>
            </div>

            <div style={styles.stepBox}>
              <h3 style={styles.stepTitle}>Step 3: Verify</h3>
              <p style={styles.stepText}>
                Enter the 6-digit code from Google Authenticator:
              </p>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  style={styles.input}
                />
                <button
                  onClick={verify2FA}
                  disabled={isVerifying || verificationCode.length !== 6}
                  style={{
                    ...styles.verifyBtn,
                    opacity: (isVerifying || verificationCode.length !== 6) ? 0.6 : 1,
                    cursor: (isVerifying || verificationCode.length !== 6) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          </>
        )}

        <button
          onClick={() => router.push('/admin')}
          style={styles.backBtn}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0E1912',
    color: '#F7F5EF',
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  card: {
    background: 'rgba(247,245,239,0.05)',
    padding: '40px',
    borderRadius: '16px',
    border: '1px solid rgba(247,245,239,0.12)',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#8B9A92',
    textAlign: 'center',
    marginBottom: '24px',
  },
  loadingText: {
    textAlign: 'center',
    color: '#8B9A92',
    fontSize: '16px',
  },
  errorBox: {
    backgroundColor: 'rgba(166,58,46,0.2)',
    color: '#A63A2E',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #A63A2E',
  },
  successBox: {
    backgroundColor: 'rgba(59,122,87,0.2)',
    color: '#3B7A57',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #3B7A57',
  },
  stepBox: {
    background: 'rgba(247,245,239,0.03)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  stepTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#D4A017',
    marginBottom: '8px',
  },
  stepText: {
    fontSize: '13px',
    color: '#8B9A92',
    marginBottom: '8px',
  },
  stepTextSmall: {
    fontSize: '12px',
    color: '#8B9A92',
    marginTop: '8px',
    wordBreak: 'break-all',
  },
  qrContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '12px 0',
  },
  qrImage: {
    width: '180px',
    height: '180px',
    border: '2px solid rgba(247,245,239,0.12)',
    borderRadius: '8px',
    padding: '8px',
    background: 'white',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(247,245,239,0.12)',
    background: 'rgba(247,245,239,0.05)',
    color: '#F7F5EF',
    fontSize: '16px',
    textAlign: 'center',
    letterSpacing: '4px',
    outline: 'none',
  },
  verifyBtn: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#D4A017',
    color: '#0E1912',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'background 0.3s',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#8B9A92',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '12px 0 0 0',
    marginTop: '12px',
    width: '100%',
    textAlign: 'center',
  },
}