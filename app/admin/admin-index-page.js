'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import sd from '@/app/styles/scoutsDossier.module.css';

const NAV_LINKS = [
  {
    href: '/admin/overview',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-6 3 3 5-7" />
      </svg>
    ),
  },
  {
    href: '/admin/add-prediction',
    label: 'Add',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/admin/manage-predictions',
    label: 'Manage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
  },
  {
    href: '/admin/manage-subscribers',
    label: 'Subs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/purchase-claims',
    label: 'Claims',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
];

const TITLES = {
  '/admin': 'Admin Dashboard',
  '/admin/overview': 'Overview',
  '/admin/add-prediction': 'Add Prediction',
  '/admin/manage-predictions': 'Manage Predictions',
  '/admin/manage-subscribers': 'Manage Subscribers',
  '/admin/purchase-claims': 'Purchase Claims',
};

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadPendingCount();

    const channel = supabase
      .channel('purchase_claims_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_claims' }, () => {
        loadPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  async function loadPendingCount() {
    const { count } = await supabase
      .from('purchase_claims')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      router.push('/');
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }

  if (checking) {
    return (
      <div className={sd.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className={sd.eyebrow}>Checking admin access…</p>
      </div>
    );
  }

  if (!authorized) return null;

  const pageTitle = TITLES[pathname] || 'Admin';
  const today = new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className={sd.page}>
      <div className={sd.topBar}>
        <div>
          <p className={sd.eyebrow}>{today}</p>
          <h1 className={sd.h1} style={{ fontSize: '1.6rem' }}>{pageTitle}</h1>
        </div>
        <a href="/dashboard" className={sd.topBarBack}>← Dashboard</a>
      </div>

      <div className={sd.pageShell}>
        {children}
      </div>

      <div className={sd.tabBarWrap}>
        <nav className={sd.tabBar}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href;
            const showBadge = link.href === '/admin/purchase-claims' && pendingCount > 0;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`${sd.tabItem} ${isActive ? sd.tabItemActive : ''}`}
              >
                <span className={sd.tabIconRing} style={{ position: 'relative' }}>
                  {link.icon}
                  {showBadge && (
                    <span style={badgeStyle}>{pendingCount > 9 ? '9+' : pendingCount}</span>
                  )}
                </span>
                <span className={sd.tabLabel}>{link.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

const badgeStyle = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 16,
  height: 16,
  padding: '0 3px',
  borderRadius: 8,
  background: '#A63A2E',
  color: '#F7F5EF',
  fontSize: 9,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, sans-serif',
  boxShadow: '0 0 0 2px #16241a',
};