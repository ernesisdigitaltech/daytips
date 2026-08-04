import Link from 'next/link'

export const metadata = {
  title: 'Download DayTips for Android',
}

// TODO: replace with your real Google Drive share link (or Play Store link once live)
const APK_DOWNLOAD_LINK = '/daytips.apk'
const PLAY_STORE_LIVE = false // flip to true once the Play Store listing goes live

export default function DownloadPage() {
  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <Link href="/" style={styles.back}>← DayTips</Link>
      </header>

      <main style={styles.main}>
        <div style={styles.logoRow}>
          <img src="/logo.png" alt="DayTips" style={styles.logo} />
        </div>

        <p style={styles.eyebrow}>Android App</p>
        <h1 style={styles.h1}>Get DayTips on your phone</h1>
        <p style={styles.subtitle}>
          Faster access, push-free browsing, and the full Scout's Dossier experience — right from your home screen.
        </p>

        {PLAY_STORE_LIVE ? (
          <a href="#" style={styles.primaryBtn}>Get it on Google Play</a>
        ) : (
          <>
            <a href={APK_DOWNLOAD_LINK} download="DayTips.apk" style={styles.primaryBtn}>Download for Android</a>
            <p style={styles.playStoreNote}>
              We're finishing our official Google Play listing — for now, install directly using the button above.
            </p>
          </>
        )}

        <div style={styles.divider} />

        <h2 style={styles.h2}>Why does Android show a warning?</h2>
        <p style={styles.body2}>
          Since this app isn't from the Play Store yet, Android shows a caution screen before installing anything
          from outside it — this is standard for <em>any</em> app installed this way, not specific to DayTips. It
          doesn't mean anything is wrong.
        </p>

        <div style={styles.stepsBox}>
          <Step number="1" text="Tap the download button above and open the downloaded file." />
          <Step number="2" text={`If prompted, tap "Settings" then allow installs from your browser or Files app.`} />
          <Step number="3" text={`Return to the install screen and tap "Install anyway" or "Install".`} />
          <Step number="4" text="Open DayTips and log in with your existing account, or sign up." />
        </div>

        <div style={styles.divider} />

        <p style={styles.altText}>
          Prefer not to install anything? DayTips works fully in your mobile browser too —{' '}
          <Link href="/" style={styles.altLink}>just visit the site</Link>, no download required.
        </p>

        <p style={styles.legalNote}>
          By installing, you agree to our <Link href="/terms" style={styles.legalLink}>Terms of Service</Link> and{' '}
          <Link href="/privacy" style={styles.legalLink}>Privacy Policy</Link>.
        </p>
      </main>
    </div>
  )
}

function Step({ number, text }) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNumber}>{number}</div>
      <p style={styles.stepText}>{text}</p>
    </div>
  )
}

const styles = {
  body: { minHeight: '100vh', background: '#0E1912', color: '#F7F5EF', fontFamily: 'sans-serif' },
  header: { padding: '20px 24px', borderBottom: '1px solid rgba(247,245,239,0.12)' },
  back: { color: '#F7F5EF', textDecoration: 'none', fontWeight: 700 },
  main: { maxWidth: 480, margin: '0 auto', padding: '48px 24px 80px', textAlign: 'center' },
  logoRow: { display: 'flex', justifyContent: 'center', marginBottom: 20 },
  logo: { width: 64, height: 64, borderRadius: '50%' },
  eyebrow: { fontSize: 12, letterSpacing: '0.15em', color: '#D4A017', textTransform: 'uppercase', margin: 0 },
  h1: { fontWeight: 800, fontSize: 30, margin: '10px 0 8px' },
  subtitle: { color: '#8B9A92', fontSize: 14.5, lineHeight: 1.6, marginBottom: 28 },
  primaryBtn: { display: 'inline-block', background: '#D4A017', color: '#0E1912', padding: '14px 32px', borderRadius: 24, fontWeight: 800, fontSize: 15, textDecoration: 'none' },
  playStoreNote: { fontSize: 12.5, color: '#8B9A9299', marginTop: 12 },
  divider: { height: 1, background: 'rgba(247,245,239,0.1)', margin: '36px 0' },
  h2: { fontSize: 17, fontWeight: 700, marginBottom: 10, textAlign: 'left' },
  body2: { color: '#B8C2BC', fontSize: 13.5, lineHeight: 1.7, textAlign: 'left', marginBottom: 20 },
  stepsBox: { display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' },
  step: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  stepNumber: { flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: 'rgba(212,160,23,0.15)', color: '#D4A017', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 13.5, color: '#F7F5EF', lineHeight: 1.6, margin: 0 },
  altText: { fontSize: 13, color: '#8B9A92', lineHeight: 1.7 },
  altLink: { color: '#D4A017', textDecoration: 'none', fontWeight: 600 },
  legalNote: { fontSize: 11.5, color: '#8B9A9277', marginTop: 24, lineHeight: 1.7 },
  legalLink: { color: '#8B9A92aa', textDecoration: 'underline' },
}