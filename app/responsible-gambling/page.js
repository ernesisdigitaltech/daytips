import Link from 'next/link'

export const metadata = {
  title: 'Responsible Gambling — DayTips',
}

export default function ResponsibleGamblingPage() {
  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
      </header>

      <main style={styles.main}>
        <p style={styles.eyebrow}>18+ Only</p>
        <h1 style={styles.h1}>Responsible Gambling</h1>

        <p style={styles.intro}>
          DayTips provides football predictions and analysis for informational and entertainment purposes.
          We do not accept bets, hold betting accounts, or process wagers. If you choose to use our predictions
          when betting with a licensed third-party operator, please keep the following in mind.
        </p>

        <Section title="No tip is guaranteed">
          Every prediction on DayTips reflects analysis and opinion, not certainty. Confidence ratings indicate how
          strongly we favor an outcome — they are not a promise of that outcome. Past accuracy does not guarantee
          future results.
        </Section>

        <Section title="Bet only what you can afford to lose">
          If you do choose to bet, only ever stake amounts you can comfortably afford to lose, and treat it as
          entertainment spending rather than a way to make money.
        </Section>

        <Section title="Know the warning signs">
          Signs that gambling may be becoming a problem include: betting more than you planned, chasing losses,
          borrowing money to bet, feeling anxious or irritable when not betting, and betting affecting your work,
          relationships, or finances. If any of this sounds familiar, it may be time to step back and seek support.
        </Section>

        <Section title="Set limits">
          Most licensed betting operators offer deposit limits, loss limits, time-outs, and self-exclusion tools.
          If gambling stops feeling fun, these tools can help you take a break or stop entirely.
        </Section>

        <Section title="Get support">
          Free, confidential help is available:
          <ul style={styles.list}>
            <li>United States: National Council on Problem Gambling — 1-800-522-4700</li>
            <li>United Kingdom: GambleAware — begambleaware.org</li>
            <li>Nigeria: Nigeria Responsible Gambling helplines available via your licensed operator</li>
            <li>International: search "problem gambling helpline" plus your country for local support</li>
          </ul>
        </Section>

        <Section title="Under 18?">
          DayTips is strictly for users aged 18 and over. If you are under 18, please do not use this site or any
          betting service.
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      <div style={styles.body2}>{children}</div>
    </section>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 680, margin: '0 auto', padding: '48px 24px 100px' },
  eyebrow: { fontSize: 12, letterSpacing: '0.15em', color: '#D4A017', textTransform: 'uppercase', margin: 0 },
  h1: { fontWeight: 800, fontSize: 34, margin: '10px 0 24px' },
  intro: { color: '#B8C2BC', fontSize: 14.5, lineHeight: 1.7, marginBottom: 8 },
  section: { marginTop: 28 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#D4A017' },
  body2: { color: '#B8C2BC', fontSize: 14, lineHeight: 1.7, margin: 0 },
  list: { marginTop: 10, paddingLeft: 20, lineHeight: 1.9 },
}