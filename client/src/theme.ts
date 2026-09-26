import { createDarkTheme, createLightTheme, type BrandVariants, type Theme } from '@fluentui/react-components';

// CSS custom properties (see index.css [data-theme]) so inline styles follow the toggle.
export const C = {
  vault: 'var(--vault)',
  panel: 'var(--panel)',
  slate: 'var(--slate)',
  line: 'var(--line)',
  lineStrong: 'var(--line-strong)',
  text: 'var(--text)',
  textSoft: 'var(--text-soft)',
  muted: 'var(--muted)',
  faint: 'var(--faint)',
  teal: 'var(--teal)',
  emerald: 'var(--emerald)',
  emeraldSoft: 'var(--emerald-soft)',
  cyber: 'var(--cyber)',
  cyberSoft: 'var(--cyber-soft)',
  danger: 'var(--danger)',
  dangerStrong: 'var(--danger-strong)',
  dangerSoft: 'var(--danger-soft)',
  warn: 'var(--warn)',
  warnSoft: 'var(--warn-soft)',
  warnRing: 'var(--warn-ring)',
  dangerRing: 'var(--danger-ring)',
};

export const FONT = {
  heading: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

const teal: BrandVariants = {
  10: '#021514',
  20: '#042523',
  30: '#063A36',
  40: '#084C47',
  50: '#0A5F58',
  60: '#0B726A',
  70: '#0D9488',
  80: '#0F9E90',
  90: '#11A898',
  100: '#14B8A6',
  110: '#2DD4BF',
  120: '#5EEAD4',
  130: '#88F0DE',
  140: '#99F6E4',
  150: '#C0F9EE',
  160: '#CCFBF1',
};

export const legalVaultDarkTheme: Theme = {
  ...createDarkTheme(teal),
  fontFamilyBase: FONT.body,
  fontFamilyMonospace: FONT.mono,
  colorNeutralBackground1: '#0F1724',
  colorNeutralBackground1Hover: '#152033',
  colorNeutralBackground1Pressed: '#1E293B',
  colorNeutralBackground2: '#090E17',
  colorNeutralBackground3: '#1E293B',
  colorNeutralCardBackground: '#0F1724',
  colorNeutralCardBackgroundHover: '#131D2E',
  colorNeutralCardBackgroundPressed: '#1E293B',
  colorNeutralForeground1: '#E2E8F0',
  colorNeutralForeground2: '#CBD5E1',
  colorNeutralForeground3: '#94A3B8',
  colorNeutralStroke1: '#2B3A52',
  colorNeutralStroke2: '#1E293B',
  colorNeutralStrokeAccessible: '#94A3B8',
  colorBrandForegroundLink: '#0EA5E9',
  colorBrandForegroundLinkHover: '#38BDF8',
  colorNeutralShadowAmbient: 'rgba(0,0,0,0.4)',
  colorNeutralShadowKey: 'rgba(0,0,0,0.5)',
};

export const legalVaultLightTheme: Theme = {
  ...createLightTheme(teal),
  fontFamilyBase: FONT.body,
  fontFamilyMonospace: FONT.mono,
  colorNeutralBackground1: '#FFFFFF',
  colorNeutralBackground1Hover: '#F1F5F9',
  colorNeutralBackground1Pressed: '#E2E8F0',
  colorNeutralBackground2: '#F3F6F8',
  colorNeutralBackground3: '#E8EEF2',
  colorNeutralCardBackground: '#FFFFFF',
  colorNeutralCardBackgroundHover: '#F8FAFC',
  colorNeutralCardBackgroundPressed: '#F1F5F9',
  colorNeutralForeground1: '#0F172A',
  colorNeutralForeground2: '#334155',
  colorNeutralForeground3: '#64748B',
  colorNeutralStroke1: '#CBD5E1',
  colorNeutralStroke2: '#E2E8F0',
  colorNeutralStrokeAccessible: '#64748B',
  colorBrandForegroundLink: '#0284C7',
  colorBrandForegroundLinkHover: '#0369A1',
  colorNeutralShadowAmbient: 'rgba(15, 23, 42, 0.06)',
  colorNeutralShadowKey: 'rgba(15, 23, 42, 0.10)',
};

/** @deprecated Use legalVaultDarkTheme; kept so existing imports keep working. */
export const legalVaultTheme = legalVaultDarkTheme;
