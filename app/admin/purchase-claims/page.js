'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PAYMENT_OPTIONS } from '@/lib/paymentLinks';

function corridorLabel(key) {
  const opt = PAYMENT_OPTIONS.find(o => o.key === key);
  return opt ? `${opt.flag} ${opt.label}` : (key || 'Unknown');
}

const TABS = ['pending', 'approved', 'rejected'];

export default function PurchaseClaimsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [tab, setTab] = useState('pending');
  const [claims, setClaims] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rowMessage, setRowMessage] = useState({});
  const [flashIds, setFlashIds] = useState(new Set());

  const channelRef = useRef(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, tab]);

  // Real-time: new claims appear instantly while this page is open
  useEffect(() => {
    if (!authorized) return;

    const channel = supabase
      .channel('purchase_claims_admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchase_claims' },
        (payload) => {
          if (tab === 'pending') {
            loadClaims();
            setFlashIds(prev => new Set(prev).add(payload.new.id));
            setTimeout(() => {
              setFlashIds(prev => {
                const next = new Set(prev);
                next.delete(payload.new.id);
                return next;
              });
            }, 2500);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, tab]);

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

  const loadClaims = useCallback(async () => {
    setLoadingClaims(true);

    const { data, error } = await supabase
      .from('purchase_claims')
      .select('id, user_id, coins_claimed, payment_method, claim_type, plan, status, created_at')
      .eq('status', tab)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      setLoadingClaims(false);
      return;
    }

    setClaims(data);

    // Fetch the relevant profiles in one batch
    const userIds = [...new Set(data.map(c => c.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const map = {};
      (profiles || []).forEach(p => { map[p.id] = p; });
      setProfilesById(map);
    }

    setLoadingClaims(false);
  }, [tab]);

  async function handleReview(claimId, approve) {
    setProcessingId(claimId);
    const { data, error } = await supabase.rpc('admin_review_purchase_claim', {
      p_claim_id: claimId,
      p_approve: approve,
    });
    setProcessingId(null);

    if (error) {
      setRowMessage(m => ({ ...m, [claimId]: { type: 'error', text: error.message } }));
      return;
    }

    // Remove from the current (pending) list since it's now reviewed
    setClaims(prev => prev.filter(c => c.id !== claimId));
    setRowMessage(m => ({
      ...m,
      [claimId]: { type: 'success', text: approve ? `Approved — coins credited` : 'Rejected' },
    }));
  }

  if (checking) {
    return <div style={styles.page}><p style={styles.eyebrow}>Checking admin access…</p></div>;
  }
  if (!authorized) return null;

  return (
    <div style={styles.page}>
      <p style={styles.eyebrow}>Admin</p>
      <h1 style={styles.h1}>Purchase Claims</h1>
      <p style={styles.subtitle}>Review coin purchase claims submitted by users.</p>

      <div style={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loadingClaims ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : claims.length === 0 ? (
        <p style={styles.emptyText}>No {tab} claims.</p>
      ) : (
        <div style={styles.list}>
          {claims.map(claim => {
            const profile = profilesById[claim.user_id];
            const msg = rowMessage[claim.id];
            const isFlashing = flashIds.has(claim.id);
            return (
              <div
                key={claim.id}
                style={{ ...styles.card, ...(isFlashing ? styles.cardFlash : {}) }}
              >
                <div style={styles.cardTop}>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.name}>{profile?.full_name || 'No name set'}</div>
                    <div style={styles.email}>{profile?.email || claim.user_id}</div>
                    <div style={styles.meta}>
                      {corridorLabel(claim.payment_method)} ·{' '}
                      {new Date(claim.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {claim.claim_type === 'subscription' ? (
                    <div style={styles.planBadge}>
                      {claim.plan === 'monthly' ? 'Monthly' : 'Weekly'}<span style={styles.coinsLabel}> Pro</span>
                    </div>
                  ) : (
                    <div style={styles.coinsBadge}>
                      {claim.coins_claimed}<span style={styles.coinsLabel}> coins</span>
                    </div>
                  )}
                </div>

                {tab === 'pending' && (
                  <div style={styles.actionRow}>
                    <button
                      disabled={processingId === claim.id}
                      onClick={() => handleReview(claim.id, true)}
                      style={styles.approveBtn}
                    >
                      ✓ Approve &amp; {claim.claim_type === 'subscription' ? 'activate' : 'credit'}
                    </button>
                    <button
                      disabled={processingId === claim.id}
                      onClick={() => handleReview(claim.id, false)}
                      style={styles.rejectBtn}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {msg && (
                  <p style={{ ...styles.rowMessage, color: msg.type === 'error' ? '#E0665A' : '#6FBE8F' }}>
                    {msg.text}
                  </p>
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
  subtitle: { color: '#F7F5EF88', marginBottom: '1.25rem', fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: 8, marginBottom: '1.5rem' },
  tabBtn: { padding: '0.5rem 1rem', background: 'rgba(247,245,239,0.04)', border: '1px solid rgba(247,245,239,0.14)', borderRadius: 999, color: '#F7F5EF99', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  tabBtnActive: { background: 'rgba(212,160,23,0.15)', borderColor: 'rgba(212,160,23,0.4)', color: '#D4A017' },
  emptyText: { color: '#F7F5EF77' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: '#16241a', border: '1px solid #3B7A5744', borderRadius: 12, padding: '1rem 1.1rem', transition: 'background 0.6s ease, border-color 0.6s ease' },
  cardFlash: { background: 'rgba(212,160,23,0.1)', borderColor: 'rgba(212,160,23,0.5)' },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  name: { fontWeight: 700, fontSize: '0.95rem' },
  email: { fontSize: '0.8rem', color: '#F7F5EF99', marginTop: 2 },
  meta: { fontSize: '0.72rem', color: '#F7F5EF66', marginTop: 4 },
  coinsBadge: { fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: '1.2rem', color: '#D4A017', whiteSpace: 'nowrap' },
  planBadge: { fontFamily: '"Big Shoulders Display", sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#D4A017', whiteSpace: 'nowrap' },
  coinsLabel: { fontSize: '0.65rem', color: '#F7F5EF77', fontFamily: 'Inter, sans-serif' },
  actionRow: { display: 'flex', gap: 8, marginTop: 12 },
  approveBtn: { flex: 1, padding: '0.6rem', background: '#3B7A57', color: '#F7F5EF', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  rejectBtn: { flex: 1, padding: '0.6rem', background: 'transparent', color: '#A63A2E', border: '1px solid #A63A2E88', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  rowMessage: { fontSize: '0.78rem', margin: '10px 0 0' },
};