import { useMemo } from 'react';
import { Card, Subtitle1, Body1, Caption1, Text } from '@fluentui/react-components';
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
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb923c', '#eab308'];

function getConicGradient(counterparties: { pct: number }[]): string {
  if (counterparties.length === 0) return '#e2e8f0';
  const parts = counterparties.map((p, i) => {
    const start = counterparties.slice(0, i).reduce((s, x) => s + x.pct, 0);
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${start + p.pct}%`;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

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
      <Subtitle1 block style={{ marginBottom: 4 }}>Analytics</Subtitle1>
      <Body1 block style={{ color: '#64748b', marginBottom: 24 }}>Contract insights and risk overview</Body1>

      {/* Financial Exposure */}
      <Card style={{ marginBottom: 24 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>Financial Exposure</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <Card>
            <Text size={500} weight="semibold" block>{formatAnnual(analytics.totalAnnual)}</Text>
            <Caption1 block style={{ color: '#64748b' }}>Total Annual Liability</Caption1>
          </Card>
          <Card>
            <Text size={500} weight="semibold" block>{formatCurrency(analytics.avgMonthlyBurn)}</Text>
            <Caption1 block style={{ color: '#64748b' }}>Average Monthly Burn</Caption1>
          </Card>
        </div>
        <Card style={{ padding: 16 }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: 4 }}>Upcoming Payments</Text>
          <Caption1 block style={{ color: '#64748b', marginBottom: 12 }}>Next 3 expiries to plan for</Caption1>
          {!hasPayments ? (
            <Body1 style={{ color: '#64748b' }}>No upcoming payments.</Body1>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', lineHeight: 1.8 }}>
              {paymentLines.map((line) => (
                <li key={line.contract_id}>
                  <Text weight="semibold">{line.party}</Text>
                  <Caption1 block style={{ color: '#64748b' }}>{line.detail}</Caption1>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Card>

      {/* Risk Assessment */}
      <Card style={{ marginBottom: 24 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>Risk Assessment</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <Card style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
            <Text size={500} weight="semibold" block>{analytics.autoRenewalCount}</Text>
            <Caption1 block style={{ color: '#64748b' }}>Auto-Renewal Tracker</Caption1>
          </Card>
          <Card>
            <Text size={500} weight="semibold" block>{analytics.noticeAvg} days</Text>
            <Caption1 block style={{ color: '#64748b' }}>Termination Notice Avg</Caption1>
          </Card>
        </div>
        <Card style={{ padding: 16 }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: 8 }}>Risk Heatmap</Text>
          {!hasRisks ? (
            <Body1 style={{ color: '#64748b' }}>No red flags detected in contracts.</Body1>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {analytics.riskCounts.map(([flag, count]) => (
                <span
                  key={flag}
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
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
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>Expiry Pipeline</Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flexWrap: 'wrap' }}>
          <Card style={{ padding: 16 }}>
            <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>Expiry Clusters</Text>
            {!hasClusters ? (
              <Body1 style={{ color: '#64748b' }}>No expiries in the pipeline.</Body1>
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
                          background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                          borderRadius: '8px 8px 0 0',
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
            <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>Next Big Expiry</Text>
            {!nextBig ? (
              <Body1 style={{ color: '#64748b' }}>No upcoming expiries.</Body1>
            ) : (
              <Card style={{ padding: 16, background: '#f8fafc' }}>
                <Text size={400} weight="bold" block style={{ marginBottom: 4 }}>{nextBig.party}</Text>
                <Caption1 block style={{ marginBottom: 4 }}>{nextBig.subject}</Caption1>
                <Text size={400} weight="semibold" style={{ color: '#6366f1' }}>
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
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>Vendor Concentration</Text>
        <Card style={{ padding: 16 }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: 4 }}>Top Counterparties</Text>
          <Caption1 block style={{ color: '#64748b', marginBottom: 12 }}>With whom you have the most contracts</Caption1>
          {!hasCounterparties ? (
            <Body1 style={{ color: '#64748b' }}>No contracts yet.</Body1>
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
              <ul style={{ flex: 1, minWidth: 200, margin: 0, paddingLeft: 20, color: '#475569', lineHeight: 1.8 }}>
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
