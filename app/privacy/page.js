import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — DayTips',
}

export default function PrivacyPolicyPage() {
  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
      </header>

      <main style={styles.main}>
        <p style={styles.eyebrow}>Legal</p>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: {new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <Section title="1. Who we are">
          DayTips ("we", "us") provides football predictions, analysis, and confidence-rated tips through our
          website and Android app. This policy explains what information we collect, how we use it, and the
          choices you have.
        </Section>

        <Section title="2. Information we collect">
          <strong style={{ color: '#F7F5EF' }}>Account information:</strong> your email address, full name, and
          password (stored securely by our authentication provider, never in plain text).
          <br /><br />
          <strong style={{ color: '#F7F5EF' }}>Usage data:</strong> which fixtures you view or unlock, your coin
          balance and transaction history, and your subscription status.
          <br /><br />
          <strong style={{ color: '#F7F5EF' }}>Payment-related data:</strong> when you submit a purchase claim, we
          store which package or plan you selected and which payment corridor (e.g. country or crypto) you used.
          We do not process or store your card, mobile money, or bank details ourselves — payments are handled
          entirely by third-party processors (such as Flutterwave) or, for crypto, by your own wallet, outside of
          our systems.
          <br /><br />
          <strong style={{ color: '#F7F5EF' }}>Technical data:</strong> standard device and app information (such
          as app version and general usage logs) collected automatically to keep the service running reliably.
        </Section>

        <Section title="3. How we use your information">
          We use your information to: create and manage your account; credit coins or activate your Pro
          subscription once a payment claim is approved; show you which fixtures you've already unlocked; respond
          to support requests; and improve the reliability and content of the service.
        </Section>

        <Section title="4. Who we share it with">
          We do not sell your personal information. We share data only with the service providers that make
          DayTips work: our database and authentication provider (Supabase), our hosting provider (Vercel), and
          payment processors (such as Flutterwave) when you choose to pay through them. These providers only
          receive what they need to perform their function.
        </Section>

        <Section title="5. Advertising">
          We may in the future display third-party advertising within the app to support the free tier of the
          service. If and when this is introduced, the ad provider may collect device identifiers for ad
          delivery and personalization, subject to their own privacy policy. We will update this page before
          that happens.
        </Section>

        <Section title="6. Data retention">
          We retain your account information for as long as your account is active. If you request deletion (see
          below), your profile, coin history, and unlock records are permanently removed.
        </Section>

        <Section title="7. Your rights">
          You can request that we delete your account and associated data at any time by contacting us. Account
          deletion is permanent and cannot be undone — it removes your login, coin balance, transaction history,
          and unlock records entirely.
        </Section>

        <Section title="8. Children's privacy">
          DayTips is intended for users aged 18 and over only. We do not knowingly collect information from
          anyone under 18. See our{' '}
          <Link href="/responsible-gambling" style={{ color: '#D4A017' }}>Responsible Gambling</Link> page for
          more on our age policy.
        </Section>

        <Section title="9. Security">
          We use industry-standard measures to protect your data, including encrypted connections (HTTPS) and
          database-level access controls that restrict who can read or modify your information.
        </Section>

        <Section title="10. Changes to this policy">
          We may update this Privacy Policy from time to time. Continued use of DayTips after changes take
          effect means you accept the revised policy.
        </Section>

        <Section title="11. Contact us">
          Questions about this policy or requests regarding your data can be directed to{' '}
          <a href="mailto:ernesisdigitaltech@gmail.com" style={{ color: '#D4A017' }}>ernesisdigitaltech@gmail.com</a>.
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      <p style={styles.body2}>{children}</p>
    </section>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 680, margin: '0 auto', padding: '48px 24px 100px' },
  eyebrow: { fontSize: 12, letterSpacing: '0.15em', color: '#D4A017', textTransform: 'uppercase', margin: 0 },
  h1: { fontWeight: 800, fontSize: 34, margin: '10px 0 4px' },
  updated: { color: '#8B9A92', fontSize: 13, marginBottom: 36 },
  section: { marginTop: 28 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  body2: { color: '#B8C2BC', fontSize: 14, lineHeight: 1.7, margin: 0 },
}