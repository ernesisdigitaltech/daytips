'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    viewsToday: 0,
    totalUsers: 0,
    newUsersToday: 0,
    coinsPurchased: 0,
    coinsSpent: 0,
    pendingClaims: 0,
    totalFixtures: 0,
    premiumFixtures: 0,
    freeFixtures: 0,
    topFixtures: [],
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
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
    await loadStats();
    setLoading(false);
  }

  async function loadStats() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [
        totalViewsRes,
        viewsTodayRes,
        totalUsersRes,
        newUsersTodayRes,
        coinTxRes,
        pendingClaimsRes,
        fixturesRes,
        unlockedRes,
      ] = await Promise.all([
        supabase.from('page_views').select('id', { count: 'exact', head: true }),
        supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('coin_transactions').select('amount, type'),
        supabase.from('purchase_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('fixtures').select('id, is_premium, home_team, away_team'),
        supabase.from('unlocked_fixtures').select('fixture_id'),
      ]);

      let coinsPurchased = 0;
      let coinsSpent = 0;
      if (coinTxRes.data) {
        for (const tx of coinTxRes.data) {
          if (tx.type === 'purchase') {
            coinsPurchased += tx.amount;
          } else if (tx.type === 'unlock') {
            coinsSpent += Math.abs(tx.amount);
          }
        }
      }

      const totalFixtures = fixturesRes.data?.length || 0;
      const premiumFixtures = fixturesRes.data?.filter(f => f.is_premium).length || 0;
      const freeFixtures = totalFixtures - premiumFixtures;

      const unlockCounts = {};
      (unlockedRes.data || []).forEach(u => {
        unlockCounts[u.fixture_id] = (unlockCounts[u.fixture_id] || 0) + 1;
      });
      const topFixtureIds = Object.entries(unlockCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));

      const fixtureMap = {};
      (fixturesRes.data || []).forEach(f => { fixtureMap[f.id] = f; });

      const topFixtures = topFixtureIds.map(({ id, count }) => ({
        id,
        count,
        label: fixtureMap[id]
          ? `${fixtureMap[id].home_team} vs ${fixtureMap[id].away_team}`
          : 'Unknown fixture',
      }));

      setStats({
        totalViews: totalViewsRes.count || 0,
        viewsToday: viewsTodayRes.count || 0,
        totalUsers: totalUsersRes.count || 0,
        newUsersToday: newUsersTodayRes.count || 0,
        coinsPurchased,
        coinsSpent,
        pendingClaims: pendingClaimsRes.count || 0,
        totalFixtures,
        premiumFixtures,
        freeFixtures,
        topFixtures,
      });
    } catch (err) {
      console.error('Error loading overview stats:', err);
      setError('Some stats could not be loaded. Check that table/column names match your schema.');
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.loadingText}>Loading dashboard…</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Overview</h1>
      <p style={styles.subtitle}>Match-day intelligence, at a glance.</p>

      {error && <p style={styles.errorBanner}>{error}</p>}

      <div style={styles.grid}>
        <StatCard label="Total Page Views" value={stats.totalViews} sub={`${stats.viewsToday} today`} />
        <StatCard label="Total Subscribers" value={stats.totalUsers} sub={`${stats.newUsersToday} joined today`} />
        <StatCard label="Coins Purchased" value={stats.coinsPurchased} sub="all-time" accent="gold" />
        <StatCard label="Coins Spent" value={stats.coinsSpent} sub="on unlocks" accent="gold" />
        <StatCard
          label="Pending Purchase Claims"
          value={stats.pendingClaims}
          sub={stats.pendingClaims > 0 ? 'needs review' : 'all clear'}
          accent={stats.pendingClaims > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Fixtures"
          value={stats.totalFixtures}
          sub={`${stats.premiumFixtures} premium / ${stats.freeFixtures} free`}
        />
      </div>

      <div style={styles.tableCard}>
        <h2 style={styles.tableTitle}>Top Unlocked Fixtures</h2>
        {stats.topFixtures.length === 0 ? (
          <p style={styles.emptyText}>No unlocks yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fixture</th>
                <th style={styles.th}>Unlocks</th>
              </tr>
            </thead>
            <tbody>
              {stats.topFixtures.map(f => (
                <tr key={f.id}>
                  <td style={styles.td}>{f.label}</td>
                  <td style={styles.td}>{f.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  const accentColor =
    accent === 'gold' ? '#D4A017' :
    accent === 'red' ? '#A63A2E' :
    accent === 'green' ? '#3B7A57' :
    '#F7F5EF';

  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color: accentColor }}>{value.toLocaleString()}</p>
      {sub && <p style={styles.cardSub}>{sub}</p>}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0E1912',
    color: '#F7F5EF',
    padding: '2rem',
    fontFamily: 'Inter, sans-serif',
  },
  loadingText: {
    fontFamily: 'IBM Plex Mono, monospace',
    color: '#F7F5EF',
  },
  title: {
    fontFamily: '"Big Shoulders Display", sans-serif',
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    color: '#F7F5EF99',
    marginTop: '0.25rem',
    marginBottom: '2rem',
  },
  errorBanner: {
    backgroundColor: '#A63A2E22',
    border: '1px solid #A63A2E',
    color: '#F7F5EF',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  card: {
    backgroundColor: '#16241a',
    border: '1px solid #3B7A5744',
    borderRadius: '10px',
    padding: '1.25rem',
  },
  cardLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#F7F5EF99',
    margin: 0,
  },
  cardValue: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: '2rem',
    fontWeight: 600,
    margin: '0.4rem 0',
  },
  cardSub: {
    fontSize: '0.8rem',
    color: '#F7F5EF77',
    margin: 0,
  },
  tableCard: {
    backgroundColor: '#16241a',
    border: '1px solid #3B7A5744',
    borderRadius: '10px',
    padding: '1.5rem',
  },
  tableTitle: {
    fontFamily: '"Big Shoulders Display", sans-serif',
    fontSize: '1.4rem',
    margin: '0 0 1rem 0',
  },
  emptyText: {
    color: '#F7F5EF77',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#F7F5EF99',
    borderBottom: '1px solid #3B7A5744',
    padding: '0.5rem 0',
  },
  td: {
    padding: '0.6rem 0',
    borderBottom: '1px solid #3B7A5722',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: '0.9rem',
  },
};