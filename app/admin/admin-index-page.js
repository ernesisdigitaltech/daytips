const SECTIONS = [
  {
    href: '/admin/overview',
    title: 'Overview',
    description: 'Views, subscribers, coin economy, and top fixtures at a glance.',
  },
  {
    href: '/admin/add-prediction',
    title: 'Add Prediction',
    description: 'Create a new league and fixture with tip, analysis, and confidence.',
  },
  {
    href: '/admin/manage-predictions',
    title: 'Manage Predictions',
    description: 'Toggle free/premium and mark fixture results.',
  },
  {
    href: '/admin/manage-subscribers',
    title: 'Manage Subscribers',
    description: 'Search users and adjust coin balances.',
  },
];

export default function AdminHomePage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Dashboard</h1>
      <p style={styles.subtitle}>Pick a section to get started.</p>

      <div style={styles.grid}>
        {SECTIONS.map(section => (
          <a key={section.href} href={section.href} style={styles.card}>
            <p style={styles.cardTitle}>{section.title}</p>
            <p style={styles.cardDescription}>{section.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '2rem',
    color: '#F7F5EF',
    fontFamily: 'Inter, sans-serif',
  },
  title: {
    fontFamily: '"Big Shoulders Display", sans-serif',
    fontSize: '2.2rem',
    margin: 0,
  },
  subtitle: {
    color: '#F7F5EF99',
    marginTop: '0.25rem',
    marginBottom: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#16241a',
    border: '1px solid #3B7A5744',
    borderRadius: '10px',
    padding: '1.25rem',
    textDecoration: 'none',
    display: 'block',
  },
  cardTitle: {
    fontFamily: '"Big Shoulders Display", sans-serif',
    fontSize: '1.3rem',
    color: '#F7F5EF',
    margin: '0 0 0.4rem 0',
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: '#F7F5EF99',
    margin: 0,
  },
};