'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const NAV_LINKS = [
  { href: '/admin/overview', label: 'Overview' },
  { href: '/admin/add-prediction', label: 'Add Prediction' },
  { href: '/admin/manage-predictions', label: 'Manage Predictions' },
];

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
      <div style={styles.loadingPage}>
        <p style={styles.loadingText}>Checking admin access…</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <p style={styles.sidebarTitle}>DayTips Admin</p>
        <nav style={styles.nav}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                }}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
        <a href="/" style={styles.backLink}>← Back to site</a>
      </aside>
      <main style={styles.content}>{children}</main>
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: '100vh',
    backgroundColor: '#0E1912',
    color: '#F7F5EF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  loadingText: {
    fontFamily: 'IBM Plex Mono, monospace',
  },
  shell: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0E1912',
  },
  sidebar: {
    width: '220px',
    flexShrink: 0,
    backgroundColor: '#16241a',
    borderRight: '1px solid #3B7A5744',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sidebarTitle: {
    fontFamily: '"Big Shoulders Display", sans-serif',
    fontSize: '1.3rem',
    color: '#F7F5EF',
    margin: '0 0 1.5rem 0.5rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  navLink: {
    display: 'block',
    padding: '0.65rem 0.75rem',
    borderRadius: '6px',
    color: '#F7F5EFcc',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontFamily: 'Inter, sans-serif',
  },
  navLinkActive: {
    backgroundColor: '#3B7A5733',
    color: '#F7F5EF',
    fontWeight: 600,
    borderLeft: '3px solid #D4A017',
    paddingLeft: 'calc(0.75rem - 3px)',
  },
  backLink: {
    marginTop: 'auto',
    color: '#F7F5EF77',
    textDecoration: 'none',
    fontSize: '0.85rem',
    padding: '0.5rem',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
};