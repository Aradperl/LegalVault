import { createDarkTheme, type BrandVariants, type Theme } from '@fluentui/react-components';

// LegalVault brand palette (Brand Guidelines v1.0, dark theme default)
export const C = {
  vault: '#090E17',      // Vault Deep Dark: page background
  panel: '#0F1724',      // one step up from vault, for cards and panels
  slate: '#1E293B',      // Surface Slate: raised surfaces, inputs
  line: '#1E293B',
  lineStrong: '#2B3A52',
  text: '#E2E8F0',       // Pure Text / Crisp
  textSoft: '#CBD5E1',
  muted: '#94A3B8',
  faint: '#64748B',
  teal: '#0D9488',       // Teal Accent: primary actions
  emerald: '#14B8A6',    // Emerald Gold: highlights on dark
  emeraldSoft: 'rgba(20, 184, 166, 0.12)',
  cyber: '#0EA5E9',      // Cyber Blue: info, links
  cyberSoft: 'rgba(14, 165, 233, 0.12)',
  danger: '#F87171',
  dangerStrong: '#DC2626',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
  warn: '#FBBF24',
  warnSoft: 'rgba(251, 191, 36, 0.12)',
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

export const legalVaultTheme: Theme = {
  ...createDarkTheme(teal),
  fontFamilyBase: FONT.body,
  fontFamilyMonospace: FONT.mono,
  colorNeutralBackground1: C.panel,
  colorNeutralBackground1Hover: '#152033',
  colorNeutralBackground1Pressed: C.slate,
  colorNeutralBackground2: C.vault,
  colorNeutralBackground3: C.slate,
  colorNeutralCardBackground: C.panel,
  colorNeutralCardBackgroundHover: '#131D2E',
  colorNeutralCardBackgroundPressed: C.slate,
  colorNeutralForeground1: C.text,
  colorNeutralForeground2: C.textSoft,
  colorNeutralForeground3: C.muted,
  colorNeutralStroke1: C.lineStrong,
  colorNeutralStroke2: C.line,
  colorNeutralStrokeAccessible: C.muted,
  colorBrandForegroundLink: C.cyber,
  colorBrandForegroundLinkHover: '#38BDF8',
  colorNeutralShadowAmbient: 'rgba(0,0,0,0.4)',
  colorNeutralShadowKey: 'rgba(0,0,0,0.5)',
};
