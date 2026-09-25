import type { CSSProperties, FormEvent } from 'react';
import { FileSearch, ShieldAlert, CalendarClock } from 'lucide-react';
import { C, FONT } from '../theme';

interface LandingPageProps {
  authMode: 'login' | 'signup';
  onToggleMode: () => void;
  username: string;
  onUsernameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

// --- Specimen contract: what LegalVault pulls out of each clause
type Tone = 'ok' | 'warn' | 'risk';

const CLAUSES: { ref: string; title: string; text: string; tag: string; tone: Tone }[] = [
  {
    ref: '§2',
    title: 'Term',
    text: 'This Agreement commences on 1 April 2025 and remains in force until 31 March 2027 unless terminated earlier.',
    tag: 'expiry: 2027-03-31',
    tone: 'ok',
  },
  {
    ref: '§4.2',
    title: 'Renewal',
    text: 'The term renews automatically for successive twelve-month periods unless either party gives 60 days written notice.',
    tag: 'auto_renew: true | notice: 60d',
    tone: 'warn',
  },
  {
    ref: '§7',
    title: 'Fees',
    text: 'Client shall pay an annual subscription fee of USD 48,000, invoiced quarterly in advance.',
    tag: 'annual_value: 48000',
    tone: 'ok',
  },
  {
    ref: '§11',
    title: 'Liability',
    text: 'Nothing in this Agreement limits the Client’s liability for any losses arising from use of the Services.',
    tag: 'risk: UNCAPPED_LIABILITY',
    tone: 'risk',
  },
];

const TONE: Record<Tone, { color: string; bg: string }> = {
  ok: { color: C.emerald, bg: C.emeraldSoft },
  warn: { color: C.warn, bg: C.warnSoft },
  risk: { color: C.danger, bg: C.dangerSoft },
};

// Scan runs 0.4s → 3.0s across the page; tags appear as the line reaches them
const tagDelay = (i: number) => `${0.9 + i * 0.52}s`;

function Specimen() {
  return (
    <div className="specimen" aria-label="Example: a services agreement with extracted terms">
      <div className="specimen-scan" aria-hidden />

      <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.faint, marginBottom: 18 }}>
        msa_northwind_2025.pdf
      </div>
      <h2 style={{ fontFamily: FONT.heading, fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
        Master Services Agreement
      </h2>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
        Between Northwind Analytics Ltd. (“Provider”) and Harbor &amp; Pine LLP (“Client”).
      </p>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {CLAUSES.map((c, i) => (
          <li key={c.ref} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.faint, paddingTop: 2 }}>{c.ref}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: C.textSoft }}>
                <strong style={{ color: C.text, fontWeight: 600 }}>{c.title}. </strong>
                {c.text}
              </p>
              <span
                className="clause-tag"
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  fontFamily: FONT.mono,
                  fontSize: 11.5,
                  color: TONE[c.tone].color,
                  background: TONE[c.tone].bg,
                  border: `1px solid ${TONE[c.tone].color}33`,
                  borderRadius: 4,
                  padding: '3px 8px',
                  animationDelay: tagDelay(i),
                  maxWidth: '100%',
                  overflowWrap: 'anywhere',
                }}
              >
                {c.tag}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28, paddingTop: 20, borderTop: `1px dashed ${C.lineStrong}` }}>
        {['For Provider', 'For Client'].map((who) => (
          <div key={who}>
            <div style={{ height: 22, borderBottom: `1px solid ${C.lineStrong}` }} />
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>{who}</div>
          </div>
        ))}
      </div>
      <span
        className="clause-tag"
        style={{
          display: 'inline-block',
          marginTop: 12,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          color: C.warn,
          background: C.warnSoft,
          border: `1px solid ${C.warn}33`,
          borderRadius: 4,
          padding: '3px 8px',
          animationDelay: tagDelay(CLAUSES.length),
        }}
      >
        signed: false
      </span>
    </div>
  );
}

// --- Auth form styles
const labelStyle: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.textSoft, marginBottom: 6 };

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: `1px solid ${C.lineStrong}`,
  background: C.panel,
  color: C.text,
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const primaryBtn: CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 8,
  border: 'none',
  background: C.teal,
  color: '#fff',
  fontFamily: FONT.heading,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  marginTop: 6,
};

const FACTS = [
  { icon: FileSearch, text: 'Pulls parties, dates and fees from any contract PDF' },
  { icon: ShieldAlert, text: 'Flags auto-renewals, uncapped liability and missing signatures' },
  { icon: CalendarClock, text: 'Emails you and adds calendar reminders before a contract expires' },
];

export function LandingPage(props: LandingPageProps) {
  const { authMode, loading } = props;
  const isLogin = authMode === 'login';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    props.onSubmit();
  };

  return (
    <div className="landing">
      <header style={{ maxWidth: 1240, width: '100%', margin: '0 auto', padding: '24px clamp(16px, 4vw, 48px)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo-mark.png" alt="" width={40} height={35} style={{ objectFit: 'contain' }} />
        <span style={{ fontFamily: FONT.heading, fontWeight: 800, fontSize: 19, letterSpacing: '0.06em', color: C.text }}>
          LEGALVAULT
        </span>
      </header>

      <main className="landing-main">
        <section style={{ maxWidth: 480 }}>
          <h1
            style={{
              fontFamily: FONT.heading,
              fontSize: 'clamp(40px, 5.2vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              color: C.text,
              margin: '0 0 20px',
            }}
          >
            Every clause, accounted for.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: C.muted, margin: '0 0 36px', maxWidth: 440 }}>
            Upload a contract and LegalVault reads it for you: who it’s with, what it costs, when it ends, and which terms deserve a second look.
          </p>

          <form onSubmit={submit} noValidate style={{ maxWidth: 400 }}>
            <h2 style={{ fontFamily: FONT.heading, fontSize: 18, fontWeight: 700, margin: '0 0 18px', color: C.text }}>
              {isLogin ? 'Sign in to your vault' : 'Create your vault'}
            </h2>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="lv-username" style={labelStyle}>Username</label>
              <input
                id="lv-username"
                className="auth-input"
                value={props.username}
                onChange={(e) => props.onUsernameChange(e.target.value)}
                style={inputStyle}
                autoComplete="username"
              />
            </div>
            {!isLogin && (
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="lv-email" style={labelStyle}>Email</label>
                <input
                  id="lv-email"
                  className="auth-input"
                  type="email"
                  value={props.email}
                  onChange={(e) => props.onEmailChange(e.target.value)}
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>
            )}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="lv-password" style={labelStyle}>Password</label>
              <input
                id="lv-password"
                className="auth-input"
                type="password"
                value={props.password}
                onChange={(e) => props.onPasswordChange(e.target.value)}
                style={inputStyle}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" disabled={loading} style={primaryBtn} className="btn-primary">
              {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
            </button>

            <p style={{ fontSize: 14, color: C.muted, margin: '18px 0 0' }}>
              {isLogin ? 'New to LegalVault? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={props.onToggleMode}
                style={{ background: 'none', border: 'none', padding: 0, color: C.emerald, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </form>
        </section>

        <section className="specimen-wrap" style={{ minWidth: 0 }}>
          <Specimen />
        </section>
      </main>

      <footer style={{ borderTop: `1px solid ${C.slate}` }}>
        <ul
          style={{
            listStyle: 'none',
            margin: '0 auto',
            maxWidth: 1240,
            padding: '22px clamp(16px, 4vw, 48px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px 40px',
          }}
        >
          {FACTS.map(({ icon: Icon, text }) => (
            <li key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
              <Icon size={18} strokeWidth={2} color={C.emerald} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
