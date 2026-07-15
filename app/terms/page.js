import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — DayTips',
}

export default function TermsPage() {
  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
      </header>

      <main style={styles.main}>
        <p style={styles.eyebrow}>Legal</p>
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: {new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <Section title="1. Acceptance of Terms">
          By creating an account or using DayTips ("the Service"), you agree to be bound by these Terms of Service.
          If you do not agree, please do not use the Service.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years old to create an account or use DayTips. By registering, you confirm that
          you meet this age requirement.
        </Section>

        <Section title="3. Description of Service">
          DayTips provides football fixture predictions, analysis, and confidence ratings for informational and
          entertainment purposes only. DayTips does not accept bets, wagers, or stakes of any kind, and is not a
          bookmaker or gambling operator. Predictions are opinions based on analysis and are not guaranteed to be
          accurate.
        </Section>

        <Section title="4. No Financial or Betting Advice">
          Nothing on DayTips constitutes financial, investment, or betting advice. Any decision to place a bet with
          a third-party operator based on information found on DayTips is made entirely at your own risk and
          discretion. DayTips accepts no liability for any losses, financial or otherwise, arising from reliance on
          our content.
        </Section>

        <Section title="5. Coins and Payments">
          DayTips uses a virtual coin system to unlock premium fixture content. Coins have no cash value, are
          non-transferable, and cannot be redeemed for money. Coin purchases are processed via Flutterwave or
          cryptocurrency payment, followed by manual verification of your purchase claim. Purchases are generally
          final; contact support for any payment disputes.
        </Section>

        <Section title="6. Account Responsibilities">
          You are responsible for maintaining the confidentiality of your account credentials and for all activity
          under your account. Notify us immediately of any unauthorized use.
        </Section>

        <Section title="7. Prohibited Conduct">
          You agree not to: misuse or attempt to exploit the coin or unlock system; interfere with the Service's
          operation; use the Service for any unlawful purpose; or attempt to access another user's account without
          authorization.
        </Section>

        <Section title="8. Termination">
          We reserve the right to suspend or terminate your account at our discretion, including for violation of
          these Terms, without refund of unused coins.
        </Section>

        <Section title="9. Changes to These Terms">
          We may update these Terms from time to time. Continued use of the Service after changes take effect
          constitutes acceptance of the revised Terms.
        </Section>

        <Section title="10. Contact">
          Questions about these Terms can be directed to our support contact listed on the Subscribe page.
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