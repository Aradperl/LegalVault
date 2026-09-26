import { useMemo } from 'react';
import { Card, Body1, Caption1, Text } from '@fluentui/react-components';
import { C, FONT } from '../theme';
import { useApp } from '../context/AppContext';

// --- Helpers for formatting
function formatAnnual(value: number): string {
  return `$${(value / 1000).toFixed(1)}k`;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatExpiryDate(expiry: string): string {
  try {
    return new Date(expiry).toLocaleDateString();
  } catch {
    return expiry;
  }
}

function formatPaymentLine(item: { contract_id: string; party: string; expiry: string; annual_value?: number }): { contract_id: string; party: string; detail: string } {
  const dateStr = formatExpiryDate(item.expiry);
  const valueStr = item.annual_value ? ` · ${formatAnnual(item.annual_value)}/yr` : '';
  return { contract_id: item.contract_id, party: item.party, detail: `${dateStr}${valueStr}` };
}

// --- Helper: bar height percentage for expiry clusters
function getBarHeightPct(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, (count / max) * 100);
}

// --- Helper: conic gradient for counterparty pie
const PIE_COLORS = ['#14B8A6', '#0EA5E9', '#0D9488', '#38BDF8', '#5EEAD4', '#0369A1', '#99F6E4', '#64748B'];

function getConicGradient(counterparties: { pct: number }[]): string {
  if (counterparties.length === 0) return C.slate;
  const parts = counterparties.map((p, i) => {
    const start = counterparties.slice(0, i).reduce((s, x) => s + x.pct, 0);
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${start + p.pct}%`;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

const pageTitle: React.CSSProperties = {
  fontFamily: FONT.heading,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  color: C.text,
  lineHeight: 1.15,
  margin: '0 0 10px',
};

export function AnalyticsPage() {
  const { analytics } = useApp();

  const maxClusterCount = useMemo(() => {
    if (analytics.expiryClusters.length === 0) return 1;
    return Math.max(...analytics.expiryClusters.map((c) => c.count), 1);
  }, [analytics.expiryClusters]);

  const paymentLines = useMemo(
    () => analytics.upcomingPayments.map(formatPaymentLine),
    [analytics.upcomingPayments]
  );

  const hasPayments = analytics.upcomingPayments.length > 0;
  const hasRisks = analytics.riskCounts.length > 0;
  const hasClusters = analytics.expiryClusters.length > 0;
  const nextBig = analytics.nextBig;
  const hasCounterparties = analytics.topCounterparties.length > 0;

  return (
    <section style={{ marginTop: 0 }}>
      <h1 style={pageTitle}>Analytics</h1>
      <Body1 block style={{ color: C.muted, marginBottom: 28 }}>What your contracts cost, when they end, and where the risk sits.</Body1>

      {/* Financial Exposure */}
      <Card style={{ marginBottom: 24 }}>
        <Text size={500} weight="bold" block style={{ marginBottom: 16, fontFamily: FONT.heading }}>Financial exposure</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <Card>
            <Text size={500} weight="semibold" block>{formatAnnual(analytics.totalAnnual)}</Text>
            <Caption1 block style={{ color: C.muted }}>Total annual liability</Caption1>
          </Card>
          <Card>
            <Text size={500} weight="semibold" block>{formatCurrency(analytics.avgMonthlyBurn)}</Text>
            <Caption1 block style={{ color: C.muted }}>Average monthly spend</Caption1>
          </Card>
        </div>
        <Card style={{ padding: 16 }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: 4 }}>Upcoming payments</Text>
          <Caption1 block style={{ color: C.muted, marginBottom: 12 }}>Next 3 expiries to plan for</Caption1>
          {!hasPayments ? (
            <Body1 style={{ color: C.muted }}>No upcoming payments.</Body1>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20, color: C.textSoft, lineHeight: 1.8 }}>
              {paymentLines.map((line) => (
                <li key={line.contract_id}>
                  <Text weight="semibold">{line.party}</Text>
                  <Caption1 block style={{ color: C.muted }}>{line.detail}</Caption1>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Card>

      {/* Risk Assessment */}
      <Card style={{ marginBottom: 24 }}>
        <Text size={500} weight="bold" block style={{ marginBottom: 16, fontFamily: FONT.heading }}>Risk</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <Card style={{ borderColor: C.warnRing, background: C.warnSoft }}>
            <Text size={500} weight="semibold" block>{analytics.autoRenewalCount}</Text>
            <Caption1 block style={{ color: C.muted }}>Renew automatically</Caption1>
          </Card>
          <Card>
            <Text size={500} weight="semibold" block>{analytics.noticeAvg} days</Text>
            <Caption1 block style={{ color: C.muted }}>Average notice period</Caption1>
          </Card>
        </div>
        <Card style={{ padding: 16 }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: 8 }}>Flagged terms</Text>
          {!hasRisks ? (
            <Body1 style={{ color: C.muted }}>No flagged terms across your contracts.</Body1>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {analytics.riskCounts.map(([flag, count]) => (
                <span
                  key={flag}
                  style={{
                    background: C.dangerSoft,
                    color: C.danger,
                    border: `1px solid ${C.dangerRing}`,
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontFamily: FONT.mono,
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  {flag.replace(/_/g, ' ')}: {count}
                </span>
              ))}
            </div>
          )}
        </Card>
      </Card>

      {/* Expiry Pipeline */}
      <Card style={{ marginBottom: 24 }}>
        <Text size={500} weight="bold" block style={{ marginBottom: 16, fontFamily: FONT.heading }}>Expiry pipeline</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Card style={{ padding: 16 }}>
            <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>Expiries by quarter</Text>
            {!hasClusters ? (
              <Body1 style={{ color: C.muted }}>No expiries in the pipeline.</Body1>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minHeight: 120 }}>
                {analytics.expiryClusters.map(({ quarter, count }) => (
                  <div key={quarter} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 40,
                          height: `${getBarHeightPct(count, maxClusterCount)}%`,
                          background: C.emerald,
                          borderRadius: '3px 3px 0 0',
                        }}
                      />
                    </div>
                    <Caption1 block>{quarter}</Caption1>
                    <Text weight="bold" block>{count}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card style={{ padding: 16 }}>
            <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>Next to expire</Text>
            {!nextBig ? (
              <Body1 style={{ color: C.muted }}>No upcoming expiries.</Body1>
            ) : (
              <Card style={{ padding: 16, background: C.slate }}>
                <Text size={400} weight="bold" block style={{ marginBottom: 4 }}>{nextBig.party}</Text>
                <Caption1 block style={{ marginBottom: 4 }}>{nextBig.subject}</Caption1>
                <Text size={400} weight="semibold" style={{ color: C.emerald }}>
                  Expires: {formatExpiryDate(nextBig.expiry)}
                </Text>
                {nextBig.annual_value > 0 && (
                  <Caption1 block style={{ marginTop: 4 }}>
                    ~{formatAnnual(nextBig.annual_value)}/year
                  </Caption1>
                )}
              </Card>
            )}
          </Card>
        </div>
      </Card>

      {/* Vendor Concentration */}
      <Card style={{ marginBottom: 24 }}>
        <Text size={500} weight="bold" block style={{ marginBottom: 16, fontFamily: FONT.heading }}>Vendor concentration</Text>
        <Card style={{ padding: 16 }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: 4 }}>Top counterparties</Text>
          <Caption1 block style={{ color: C.muted, marginBottom: 12 }}>Who you hold the most contracts with</Caption1>
          {!hasCounterparties ? (
            <Body1 style={{ color: C.muted }}>No contracts yet.</Body1>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: getConicGradient(analytics.topCounterparties),
                }}
              />
              <ul style={{ flex: 1, minWidth: 200, margin: 0, paddingLeft: 20, color: C.textSoft, lineHeight: 1.8 }}>
                {analytics.topCounterparties.map((p) => (
                  <li key={p.name}>
                    <Text weight="semibold">{p.name}</Text>
                    <Caption1> {p.count} ({p.pct}%)</Caption1>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </Card>
    </section>
  );
}
