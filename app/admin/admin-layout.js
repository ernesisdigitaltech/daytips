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
];

const TITLES = {
  '/admin': 'Admin Dashboard',
  '/admin/overview': 'Overview',
  '/admin/add-prediction': 'Add Prediction',
  '/admin/manage-predictions': 'Manage Predictions',
};

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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
            return (
              <a
                key={link.href}
                href={link.href}
                className={`${sd.tabItem} ${isActive ? sd.tabItemActive : ''}`}
              >
                <span className={sd.tabIconRing}>{link.icon}</span>
                <span className={sd.tabLabel}>{link.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}