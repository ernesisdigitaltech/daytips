'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/login')
  }

  if (loading) {
    return <div style={{ color: '#F7F5EF', padding: '40px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(247,245,239,0.05)', borderRadius: '12px' }}>
        <h1>DayTips Admin</h1>
        <button onClick={handleLogout} style={{ background: '#A63A2E', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <Link href="/admin/overview" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(247,245,239,0.05)', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#F7F5EF' }}>
            <div style={{ fontSize: '40px' }}>📊</div>
            <h3>Overview</h3>
          </div>
        </Link>

        <Link href="/admin/add-prediction" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(247,245,239,0.05)', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#F7F5EF' }}>
            <div style={{ fontSize: '40px' }}>➕</div>
            <h3>Add Prediction</h3>
          </div>
        </Link>

        <Link href="/admin/manage-predictions" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(247,245,239,0.05)', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#F7F5EF' }}>
            <div style={{ fontSize: '40px' }}>📝</div>
            <h3>Manage Predictions</h3>
          </div>
        </Link>

        <Link href="/admin/manage-subscribers" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(247,245,239,0.05)', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#F7F5EF' }}>
            <div style={{ fontSize: '40px' }}>👥</div>
            <h3>Subscribers</h3>
          </div>
        </Link>

        <Link href="/admin/purchase-claims" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(247,245,239,0.05)', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#F7F5EF' }}>
            <div style={{ fontSize: '40px' }}>💰</div>
            <h3>Purchase Claims</h3>
          </div>
        </Link>
      </div>
    </div>
  )
}