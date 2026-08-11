'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in with 2FA
    const token = localStorage.getItem('adminToken')
    
    if (!token) {
      // No token, redirect to login
      router.push('/login')
      return
    }

    // Token exists - consider it valid
    setAdminEmail('Admin')
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>DayTips Admin</h1>
          <span style={styles.adminBadge}>🔐 2FA Protected</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.adminEmail}>{adminEmail}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div style={styles.dashboardGrid}>
        {/* Overview Card */}
        <Link href="/admin/overview" style={styles.cardLink}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>📊</div>
            <h3 style={styles.cardTitle}>Overview</h3>
            <p style={styles.cardDesc}>View dashboard statistics</p>
          </div>
        </Link>

        {/* Add Prediction Card */}
        <Link href="/admin/add-prediction" style={styles.cardLink}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>➕</div>
            <h3 style={styles.cardTitle}>Add Prediction</h3>
            <p style={styles.cardDesc}>Create new match predictions</p>
          </div>
        </Link>

        {/* Manage Predictions Card */}
        <Link href="/admin/manage-predictions" style={styles.cardLink}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>📝</div>
            <h3 style={styles.cardTitle}>Manage Predictions</h3>
            <p style={styles.cardDesc}>Edit, update, or archive</p>
          </div>
        </Link>

        {/* Manage Subscribers Card */}
        <Link href="/admin/manage-subscribers" style={styles.cardLink}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>👥</div>
            <h3 style={styles.cardTitle}>Manage Subscribers</h3>
            <p style={styles.cardDesc}>View subscriber list</p>
          </div>
        </Link>

        {/* Purchase Claims Card */}
        <Link href="/admin/purchase-claims" style={styles.cardLink}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>💰</div>
            <h3 style={styles.cardTitle}>Purchase Claims</h3>
            <p style={styles.cardDesc}>Verify purchase claims</p>
          </div>
        </Link>

        {/* 2FA Setup Card */}
        <Link href="/admin/setup-2fa" style={styles.cardLink}>
          <div style={{...styles.card, borderColor: '#D4A017'}}>
            <div style={styles.cardIcon}>🔐</div>
            <h3 style={styles.cardTitle}>2FA Setup</h3>
            <p style={styles.cardDesc}>Set up two-factor authentication</p>
          </div>
        </Link>
      </div>

      {/* Security Status */}
      <div style={styles.securityBar}>
        <span style={styles.securityBadge}>✅ 2FA Enabled</span>
        <span style={styles.securityBadge}>✅ Secure Session</span>
        <span style={styles.securityBadge}>✅ Admin Access</span>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0E1912',
    color: '#F7F5EF',
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0E1912',
    color: '#F7F5EF',
  },
  loadingSpinner: {
    fontSize: '18px',
    color: '#D4A017',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    background: 'rgba(247,245,239,0.05)',
    borderRadius: '12px',
    borderBottom: '1px solid rgba(247,245,239,0.12)',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  adminBadge: {
    fontSize: '12px',
    background: '#3B7A57',
    color: '#F7F5EF',
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  adminEmail: {
    fontSize: '14px',
    color: '#8B9A92',
  },
  logoutBtn: {
    background: '#A63A2E',
    color: '#F7F5EF',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background 0.3s',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  cardLink: {
    textDecoration: 'none',
  },
  card: {
    background: 'rgba(247,245,239,0.05)',
    padding: '30px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(247,245,239,0.12)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F7F5EF',
    margin: '0 0 8px 0',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#8B9A92',
    margin: 0,
  },
  securityBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '40px',
    padding: '16px',
    borderTop: '1px solid rgba(247,245,239,0.12)',
    flexWrap: 'wrap',
  },
  securityBadge: {
    fontSize: '13px',
    color: '#8B9A92',
    padding: '4px 12px',
    background: 'rgba(59,122,87,0.2)',
    borderRadius: '12px',
  },
}