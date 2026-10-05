// Mimlet palette (warm paper, deep ink, mint, coral) split into light and dark
// themes. Text pairs are WCAG AA on their surface; bar colors clear 3:1.
export type Theme = {
  surface: string;
  chrome: string;
  border: string;
  text: string;
  secondary: string;
  muted: string;
  accent: string;
  string: string;
  number: string;
  bar: string;
  barPeak: string;
  dots: [string, string, string];
};

export const themes: Record<'light' | 'dark', Theme> = {
  light: {
    surface: '#faf7ee',
    chrome: '#f1ecdd',
    border: '#e2dbc8',
    text: '#152725',
    secondary: '#3f524d',
    muted: '#5f716b',
    accent: '#3d7a1f',
    string: '#3d7a1f',
    number: '#c4492f',
    bar: '#7d8f89',
    barPeak: '#152725',
    dots: ['#f27b62', '#b6ef86', '#c9c2ae'],
  },
  dark: {
    surface: '#152725',
    chrome: '#1b302d',
    border: '#2b4540',
    text: '#faf7ee',
    secondary: '#c9d3cb',
    muted: '#9bada5',
    accent: '#b6ef86',
    string: '#b6ef86',
    number: '#f27b62',
    bar: '#5f7a72',
    barPeak: '#b6ef86',
    dots: ['#f27b62', '#b6ef86', '#5f7a72'],
  },
};

export const mono = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;
export const sans = `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
