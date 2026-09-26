import type { CSSProperties, FormEvent } from 'react';
import { FileSearch, ShieldAlert, Folder, BarChart3, CalendarClock } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
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
    text: 'This Agreement commences on 1 April 2026 and remains in force until 31 March 2028 unless terminated earlier.',
    tag: 'expiry: 2028-03-31',
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

const HUD_FIELDS: { key: string; value: string; tone?: Tone }[] = [
  { key: 'subject', value: 'Master Services Agreement' },
  { key: 'party', value: 'Harbor & Pine LLP' },
  { key: 'expiry', value: '2028-03-31' },
  { key: 'annual_value', value: '48000' },
  { key: 'has_auto_renewal', value: 'true', tone: 'warn' },
  { key: 'is_signed', value: 'false', tone: 'warn' },
  { key: 'risk_flags', value: 'auto_renewal', tone: 'risk' },
];

const FACTS = [
  { icon: FileSearch, text: 'Pulls parties, dates and fees from any contract PDF' },
  { icon: ShieldAlert, text: 'Flags auto-renewals, uncapped liability and missing signatures' },
  { icon: CalendarClock, text: 'Emails you and adds calendar reminders before a contract expires' },
];

const FEATURES = [
  { icon: FileSearch, label: 'AI extraction' },
  { icon: ShieldAlert, label: 'Risk flags' },
  { icon: Folder, label: 'Folders' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: CalendarClock, label: 'Calendar + email' },
];

const TONE: Record<Tone, { color: string; bg: string }> = {
  ok: { color: C.emerald, bg: C.emeraldSoft },
  warn: { color: C.warn, bg: C.warnSoft },
  risk: { color: C.danger, bg: C.dangerSoft },
};

// Scan runs 0.4s → 3.0s across the page; tags appear as the line reaches them
const tagDelay = (i: number) => `${1.2 + i * 0.7}s`;

function Specimen() {
  return (
    <div className="specimen" aria-label="Example: a services agreement with extracted terms">
      <div className="specimen-scan" aria-hidden />

      <div className="specimen-file" style={{ fontFamily: FONT.mono, color: C.faint }}>
        msa_northwind_2026.pdf
      </div>
      <h2 className="specimen-title" style={{ fontFamily: FONT.heading, fontWeight: 700, color: C.text, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
        Master Services Agreement
      </h2>
      <p className="specimen-parties" style={{ color: C.muted, margin: 0, lineHeight: 1.5 }}>
        Between Northwind Analytics Ltd. (“Provider”) and Harbor &amp; Pine LLP (“Client”).
      </p>

      <ol className="specimen-clauses">
        {CLAUSES.map((c, i) => (
          <li key={c.ref} className="specimen-clause">
            <span style={{ fontFamily: FONT.mono, color: C.faint, paddingTop: 2 }}>{c.ref}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, lineHeight: 1.55, color: C.textSoft }}>
                <strong style={{ color: C.text, fontWeight: 600 }}>{c.title}. </strong>
                {c.text}
              </p>
              <span
                className="clause-tag"
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  fontFamily: FONT.mono,
                  color: TONE[c.tone].color,
                  background: TONE[c.tone].bg,
                  border: `1px solid ${c.tone === 'ok' ? 'var(--emerald-ring)' : c.tone === 'warn' ? C.warnRing : C.dangerRing}`,
                  borderRadius: 4,
                  padding: '2px 7px',
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

      <div className="specimen-sign" style={{ borderTop: `1px dashed ${C.lineStrong}` }}>
        {['For Provider', 'For Client'].map((who) => (
          <div key={who}>
            <div style={{ height: 18, borderBottom: `1px solid ${C.lineStrong}` }} />
            <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{who}</div>
          </div>
        ))}
      </div>
      <span
        className="clause-tag"
        style={{
          display: 'inline-block',
          marginTop: 8,
          fontFamily: FONT.mono,
          color: C.warn,
          background: C.warnSoft,
          border: `1px solid ${C.warnRing}`,
          borderRadius: 4,
          padding: '2px 7px',
          animationDelay: tagDelay(CLAUSES.length),
        }}
      >
        signed: false
      </span>

      <aside className="specimen-hud" aria-label="Extracted contract fields">
        <div className="specimen-hud-label" style={{ fontFamily: FONT.mono, color: C.emerald }}>
          extracted
        </div>
        <dl className="specimen-hud-grid">
          {HUD_FIELDS.map((field) => {
            const tone = field.tone ? TONE[field.tone] : null;
            return (
              <div key={field.key} className="specimen-hud-row">
                <dt style={{ fontFamily: FONT.mono, color: C.faint }}>{field.key}</dt>
                <dd
                  style={{
                    fontFamily: FONT.mono,
                    color: tone?.color ?? C.textSoft,
                    margin: 0,
                  }}
                >
                  {field.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </aside>
    </div>
  );
}

// --- Auth form styles
const labelStyle: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 500, color: C.textSoft, marginBottom: 5 };

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${C.lineStrong}`,
  background: C.panel,
  color: C.text,
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const primaryBtn: CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: 8,
  border: 'none',
  background: C.teal,
  color: '#fff',
  fontFamily: FONT.heading,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 4,
};

export function LandingPage(props: LandingPageProps) {
  const { authMode, loading } = props;
  const isLogin = authMode === 'login';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    props.onSubmit();
  };

  return (
    <div className="landing">
      <main className="landing-main">
        <section className="landing-left">
          <div className="landing-story">
            <div className="landing-brand landing-in">
              <img className="logo-mark landing-logo-mark" src="/logo-mark.png" alt="" width={60} height={54} />
              <span className="landing-wordmark">LEGALVAULT</span>
            </div>
            <p className="landing-in landing-kicker">
              For the contracts you still have to live with
            </p>
            <h1 className="landing-headline">
              <span className="landing-line">
                <span className="landing-word" style={{ animationDelay: '0.28s' }}>Every</span>
                <span className="landing-word" style={{ animationDelay: '0.46s' }}>clause,</span>
              </span>
              <span className="landing-line">
                <span className="landing-word" style={{ animationDelay: '0.66s' }}>accounted</span>
                <span className="landing-word" style={{ animationDelay: '0.84s' }}>for.</span>
              </span>
            </h1>
            <p className="landing-in landing-purpose">
              You sign something, drop the PDF in a folder, and move on. Months later a renewal date appears, a fee ticks up, or nobody can say whether it was even signed.
            </p>

            <ul className="landing-chips" aria-label="Product capabilities">
              {FEATURES.map(({ icon: Icon, label }, i) => (
                <li key={label} className="landing-chip" style={{ animationDelay: `${1.05 + i * 0.12}s` }}>
                  <Icon size={13} strokeWidth={2} color={C.emerald} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <form className="landing-form landing-in" onSubmit={submit} noValidate>
            <div className="landing-form-head">
              <h2 style={{ fontFamily: FONT.heading, fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
                {isLogin ? 'Sign in to your vault' : 'Create your vault'}
              </h2>
              <ThemeToggle />
            </div>

            <div style={{ marginBottom: 10 }}>
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
              <div style={{ marginBottom: 10 }}>
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
            <div style={{ marginBottom: isLogin ? 14 : 8 }}>
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
            {!isLogin && (
              <ul className="signup-rules" aria-label="Account requirements">
                <li>Username: at least 3 characters; letters, numbers, _ or -</li>
                <li>Valid email address</li>
                <li>Password: 10+ characters, with a letter and a number</li>
                <li>Avoid obvious passwords (password, qwerty, letmein, …)</li>
              </ul>
            )}

            <button type="submit" disabled={loading} style={primaryBtn} className="btn-primary">
              {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
            </button>

            <p style={{ fontSize: 13, color: C.muted, margin: '14px 0 0' }}>
              {isLogin ? 'New to LegalVault? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={props.onToggleMode}
                style={{ background: 'none', border: 'none', padding: 0, color: C.emerald, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </form>
        </section>

        <section className="specimen-wrap landing-in">
          <Specimen />
        </section>
      </main>

      <footer className="landing-footer landing-in">
        <ul className="landing-facts">
          {FACTS.map(({ icon: Icon, text }) => (
            <li key={text} className="landing-fact">
              <Icon size={13} strokeWidth={2} color={C.emerald} aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
