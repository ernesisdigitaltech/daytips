'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ManageSubscribersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // false = newest first
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [openRowId, setOpenRowId] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [rowMessage, setRowMessage] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const t = setTimeout(() => loadUsers(), 300); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, search, sortAsc]);

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

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, coins, is_admin, created_at')
      .order('created_at', { ascending: sortAsc })
      .limit(100);

    if (search.trim()) {
      const term = search.trim().replace(/[%_]/g, '');
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (!error && data) setUsers(data);
    setLoadingUsers(false);
  }, [search, sortAsc]);

  function toggleRow(id) {
    setOpenRowId(openRowId === id ? null : id);
    setAmountInput('');
    setReasonInput('');
  }

  async function submitAdjustment(userId, sign) {
    const raw = parseInt(amountInput, 10);
    if (!raw || raw <= 0) {
      setRowMessage(m => ({ ...m, [userId]: { type: 'error', text: 'Enter a positive number of coins.' } }));
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc('admin_adjust_coins', {
      p_user_id: userId,
      p_amount: raw * sign,
      p_reason: reasonInput || null,
    });
    setSubmitting(false);

    if (error) {
      setRowMessage(m => ({ ...m, [userId]: { type: 'error', text: error.message } }));
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: data.coins } : u));
    setRowMessage(m => ({ ...m, [userId]: { type: 'success', text: `New balance: ${data.coins} coins` } }));
    setAmountInput('');
    setReasonInput('');
  }

  if (checking) {
    return <div style={styles.page}><p style={styles.eyebrow}>Checking admin access…</p></div>;
  }
  if (!authorized) return null;

  return (
    <div style={styles.page}>
      <p style={styles.eyebrow}>Admin</p>
      <h1 style={styles.h1}>Manage Subscribers</h1>
      <p style={styles.subtitle}>Search users, review accounts, and adjust coin balances.</p>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <button onClick={() => setSortAsc(s => !s)} style={styles.sortBtn}>
          {sortAsc ? 'Oldest first ↑' : 'Newest first ↓'}
        </button>
      </div>

      {loadingUsers ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : users.length === 0 ? (
        <p style={styles.emptyText}>No users found.</p>
      ) : (
        <div style={styles.list}>
          {users.map(u => {
            const isOpen = openRowId === u.id;
            const msg = rowMessage[u.id];
            return (
              <div key={u.id} style={styles.card}>
                <div style={styles.cardTop} onClick={() => toggleRow(u.id)}>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.name}>
                      {u.full_name || 'No name set'}
                      {u.is_admin && <span style={styles.adminBadge}>ADMIN</span>}
                    </div>
                    <div style={styles.email}>{u.email}</div>
                    <div style={styles.joined}>
                      Joined {new Date(u.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={styles.coinsBadge}>{u.coins}<span style={styles.coinsLabel}> coins</span></div>
                </div>

                {isOpen && (
                  <div style={styles.expandArea}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Amount"
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      style={styles.amountInput}
                    />
                    <input
                      type="text"
                      placeholder="Reason (optional)"
                      value={reasonInput}
                      onChange={e => setReasonInput(e.target.value)}
                      style={styles.reasonInput}
                    />
                    <div style={styles.actionRow}>
                      <button
                        disabled={submitting}
                        onClick={() => submitAdjustment(u.id, 1)}
                        style={styles.addBtn}
                      >
                        + Add coins
                      </button>
                      <button
                        disabled={submitting}
                        onClick={() => submitAdjustment(u.id, -1)}
                        style={styles.deductBtn}
                      >
                        − Deduct coins
                      </button>
                    </div>
                    {msg && (
                      <p style={{ ...styles.rowMessage, color: msg.type === 'error' ? '#E0665A' : '#6FBE8F' }}>
                        {msg.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '2rem', color: '#F7F5EF', fontFamily: 'Inter, sans-serif' },
  eyebrow: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F7F5EF88', margin: 0 },
  h1: { fontFamily: '"Big Shoulders Display", sans-serif', fontSize: '2rem', fontWeight: 700, margin: '0.15rem 0 0.3rem' },
  subtitle: { color: '#F7F5EF88', marginBottom: '1.5rem', fontSize: '0.9rem' },
  controls: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 220, padding: '0.65rem 0.9rem', background: 'rgba(247,245,239,0.04)', border: '1px solid rgba(247,245,239,0.14)', borderRadius: 10, color: '#F7F5EF', fontSize: '0.9rem' },
  sortBtn: { padding: '0.65rem 1rem', background: 'rgba(247,245,239,0.04)', border: '1px solid rgba(247,245,239,0.14)', borderRadius: 10, color: '#F7F5EF', fontSize: '0.85rem', cursor: 'pointer' },
  emptyText: { color: '#F7F5EF77' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: '#16241a', border: '1px solid #3B7A5744', borderRadius: 12, overflow: 'hidden' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', cursor: 'pointer', gap: 12 },
  name: { fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 },
  adminBadge: { fontSize: '0.6rem', background: 'rgba(212,160,23,0.18)', color: '#D4A017', padding: '2px 6px', borderRadius: 6, letterSpacing: '0.06em', fontFamily: 'IBM Plex Mono, monospace' },
  email: { fontSize: '0.8rem', color: '#F7F5EF99', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' },
  joined: { fontSize: '0.72rem', color: '#F7F5EF66', marginTop: 4 },
  coinsBadge: { fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: '1.2rem', color: '#D4A017', whiteSpace: 'nowrap' },
  coinsLabel: { fontSize: '0.65rem', color: '#F7F5EF77', fontFamily: 'Inter, sans-serif' },
  expandArea: { padding: '0 1.1rem 1.1rem', borderTop: '1px solid rgba(247,245,239,0.08)', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 },
  amountInput: { padding: '0.6rem 0.8rem', background: 'rgba(247,245,239,0.04)', border: '1px solid rgba(247,245,239,0.14)', borderRadius: 8, color: '#F7F5EF', fontSize: '0.85rem' },
  reasonInput: { padding: '0.6rem 0.8rem', background: 'rgba(247,245,239,0.04)', border: '1px solid rgba(247,245,239,0.14)', borderRadius: 8, color: '#F7F5EF', fontSize: '0.85rem' },
  actionRow: { display: 'flex', gap: 8 },
  addBtn: { flex: 1, padding: '0.6rem', background: '#3B7A57', color: '#F7F5EF', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  deductBtn: { flex: 1, padding: '0.6rem', background: 'transparent', color: '#A63A2E', border: '1px solid #A63A2E88', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  rowMessage: { fontSize: '0.78rem', margin: 0 },
};