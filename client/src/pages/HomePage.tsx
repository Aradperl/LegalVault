import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { useApp } from '../context/AppContext';
import type { ContractItem } from '../context/AppContext';
import { safeParse } from '../utils/contractHelpers';
import { C, FONT } from '../theme';
import { timeOfDayGreeting } from '../utils/greeting';

// --- Helper: extract party from contract analysis
function getContractParty(contract: ContractItem): string {
  const party = safeParse(contract.analysis).party;
  return (party && String(party).trim()) || 'Contract';
}

// --- Helper: extract summary (subject or filename), capped length
function getContractSummary(contract: ContractItem, maxLength = 80): string {
  const subject = safeParse(contract.analysis).subject;
  const text = String(subject || contract.filename);
  return text.slice(0, maxLength) + (text.length > maxLength ? '…' : '');
}

// --- Helper: format annual value for display
function formatAnnual(value: number): string {
  return `$${(value / 1000).toFixed(1)}k`;
}

const sectionHeading: CSSProperties = {
  fontFamily: FONT.heading,
  fontSize: 18,
  fontWeight: 700,
  color: C.text,
  margin: 0,
  letterSpacing: '-0.01em',
};

const linkStyle: CSSProperties = { fontSize: 14, color: C.emerald, fontWeight: 600, textDecoration: 'none' };

const panel: CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.slate}`,
  borderRadius: 10,
};

export function HomePage() {
  const { analytics, filteredAndSortedHistory, loading, handleUpload, handleUploadFile, currentUser } = useApp();
  const greeting = timeOfDayGreeting(currentUser);

  const recentContracts = filteredAndSortedHistory.slice(0, 5);
  const hasContracts = recentContracts.length > 0;

  const stats = [
    { value: String(analytics.totalContracts), label: 'Contracts in your vault' },
    { value: formatAnnual(analytics.totalAnnual), label: 'Annual contract value' },
    { value: String(analytics.autoRenewalCount), label: 'Renew automatically' },
  ];

  return (
    <div style={{ maxWidth: 1080 }}>
      <DashboardHeader
        loading={loading}
        onUpload={handleUpload}
        onFileDrop={handleUploadFile}
        showFilterBar={false}
        greeting={greeting}
      />

      <section style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={sectionHeading}>At a glance</h2>
          <Link to="/analytics" style={linkStyle}>Open analytics</Link>
        </div>
        <dl style={{ ...panel, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ padding: '22px 24px', borderLeft: i === 0 ? 'none' : `1px solid ${C.slate}` }}>
              <dd style={{ margin: 0, fontFamily: FONT.heading, fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {s.value}
              </dd>
              <dt style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={sectionHeading}>Recent contracts</h2>
          {filteredAndSortedHistory.length > 0 && (
            <Link to="/contracts" style={linkStyle}>View all {filteredAndSortedHistory.length}</Link>
          )}
        </div>

        {!hasContracts ? (
          <p style={{ ...panel, margin: 0, padding: '22px 24px', color: C.muted, fontSize: 15 }}>
            Your vault is empty. Upload your first contract above and it will show up here.
          </p>
        ) : (
          <ul style={{ ...panel, listStyle: 'none', margin: 0, padding: 0, overflow: 'hidden' }}>
            {recentContracts.map((c, i) => {
              const d = safeParse(c.analysis);
              return (
                <li key={c.contract_id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.slate}` }}>
                  <Link
                    to="/contracts"
                    className="row-link"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr) auto',
                      gap: 20,
                      alignItems: 'center',
                      padding: '14px 24px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getContractParty(c)}
                    </span>
                    <span style={{ fontSize: 14, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getContractSummary(c)}
                    </span>
                    <span style={{ fontFamily: FONT.mono, fontSize: 12.5, color: d.expiry !== 'N/A' ? C.textSoft : C.faint, whiteSpace: 'nowrap' }}>
                      {d.expiry !== 'N/A' ? `ends ${d.expiry}` : 'no end date'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
