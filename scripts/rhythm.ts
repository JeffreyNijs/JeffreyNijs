// Renders dist/rhythm-{light,dark}.svg from the last year of contributions.
// Runs daily in .github/workflows/profile.yml; locally:
//   GITHUB_TOKEN=$(gh auth token) bun scripts/rhythm.ts
import { esc, sans, themes, type Theme } from './theme.ts';

const login = process.env.PROFILE_USER ?? process.env.GITHUB_REPOSITORY_OWNER ?? 'JeffreyNijs';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');

type Day = { date: string; contributionCount: number; weekday: number };

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query($login: String!) { user(login: $login) { contributionsCollection {
      restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount weekday } } }
    } } }`,
    variables: { login },
  }),
});
const json: any = await res.json();
if (!res.ok || json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? json)}`);

const collection = json.data.user.contributionsCollection;
const total: number = collection.contributionCalendar.totalContributions;
const days: Day[] = collection.contributionCalendar.weeks.flatMap((w: any) => w.contributionDays);
const privateShare = total ? collection.restrictedContributionsCount / total : 0;

// Stats
const activeDays = days.filter((d) => d.contributionCount > 0).length;
let longest = 0;
for (let run = 0, i = 0; i < days.length; i++) {
  run = days[i].contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++;
  else if (i === days.length - 1) continue; // today isn't over yet
  else break;
}
const busiest = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a));

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const byWeekday = ORDER.map((wd) => ({
  wd,
  label: WEEKDAYS[wd].slice(0, 3),
  total: days.filter((d) => d.weekday === wd).reduce((s, d) => s + d.contributionCount, 0),
}));
const peak = byWeekday.reduce((a, b) => (b.total > a.total ? b : a));

const fmt = (n: number) => n.toLocaleString('en-US');
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
const weekend = busiest.weekday === 0 || busiest.weekday === 6;
const quip = [
  `${WEEKDAYS[peak.wd]}s are for shipping.`,
  `Busiest day was ${dayLabel(busiest.date)} (${fmt(busiest.contributionCount)}).`,
  weekend ? `We don't talk about that.` : '',
]
  .filter(Boolean)
  .join(' ');
const now = new Date();
const footnote = [
  privateShare >= 0.01 ? `${Math.round(privateShare * 100)}% of it in private repos` : '',
  `updated ${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`,
]
  .filter(Boolean)
  .join(' · ');

// Layout
const W = 780;
const H = 290;
const PAD = 28;
const CHART_X = 440;
const CHART_W = W - PAD - CHART_X;
const BASE = 176;
const MAX_BAR = 108;
const BAR_W = 24;
const BAND = CHART_W / 7;

const column = (x: number, h: number) => {
  const top = BASE - h;
  const r = Math.min(4, h);
  return `M${x} ${BASE}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + BAR_W - r}Q${x + BAR_W} ${top} ${x + BAR_W} ${top + r}V${BASE}Z`;
};

function render(t: Theme) {
  const max = peak.total || 1;
  const bars = byWeekday
    .map((d, i) => {
      const cx = CHART_X + BAND * i + BAND / 2;
      const h = Math.max(2, Math.round((d.total / max) * MAX_BAR));
      const isPeak = d === peak;
      const value = isPeak
        ? `<text x="${cx}" y="${BASE - h - 8}" text-anchor="middle" class="value" fill="${t.secondary}">${fmt(d.total)}</text>`
        : '';
      return `<g><title>${d.label}: ${fmt(d.total)}</title><path d="${column(cx - BAR_W / 2, h)}" fill="${isPeak ? t.barPeak : t.bar}"/>${value}<text x="${cx}" y="${BASE + 20}" text-anchor="middle" class="small" fill="${isPeak ? t.text : t.muted}">${d.label}</text></g>`;
    })
    .join('\n    ');

  const tile = (x: number, value: string, label: string) =>
    `<text x="${x}" y="176" class="tile" fill="${t.text}">${value}</text><text x="${x}" y="196" class="small" fill="${t.muted}">${label}</text>`;

  const desc = `${fmt(total)} contributions in the last 12 months over ${activeDays} active days; longest streak ${longest} days, current streak ${current} days. By weekday: ${byWeekday.map((d) => `${d.label} ${fmt(d.total)}`).join(', ')}. ${quip} ${footnote}.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">Contribution rhythm</title>
  <desc id="desc">${esc(desc)}</desc>
  <style>
    text { font-family: ${sans}; }
    .label { font-size: 13px; font-weight: 500; }
    .hero { font-size: 52px; font-weight: 650; letter-spacing: -1px; }
    .sub { font-size: 15px; }
    .tile { font-size: 22px; font-weight: 600; }
    .small { font-size: 12.5px; }
    .value { font-size: 12.5px; font-weight: 600; }
    .quip { font-size: 13.5px; }
  </style>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="${t.surface}" stroke="${t.border}"/>

  <circle cx="${PAD + 4}" cy="35.5" r="4" fill="${t.accent}"/>
  <text x="${PAD + 14}" y="40" class="label" fill="${t.muted}">Last 12 months</text>
  <text x="${PAD - 2}" y="100" class="hero" fill="${t.text}">${fmt(total)}</text>
  <text x="${PAD}" y="126" class="sub" fill="${t.secondary}">contributions</text>
  ${tile(PAD, fmt(activeDays), 'active days')}
  ${tile(PAD + 140, `${longest} days`, 'longest streak')}
  ${tile(PAD + 280, `${current} days`, 'current streak')}

  <text x="${CHART_X}" y="40" class="label" fill="${t.muted}">By weekday</text>
  <path d="M${CHART_X} ${BASE + 0.5}H${W - PAD}" stroke="${t.border}"/>
    ${bars}

  <path d="M${PAD} 222.5H${W - PAD}" stroke="${t.border}"/>
  <text x="${PAD}" y="250" class="quip" fill="${t.secondary}">${esc(quip)}</text>
  <text x="${PAD}" y="270" class="small" fill="${t.muted}">${esc(footnote)}</text>
</svg>
`;
}

await Bun.write(new URL('../dist/rhythm-light.svg', import.meta.url), render(themes.light));
await Bun.write(new URL('../dist/rhythm-dark.svg', import.meta.url), render(themes.dark));
console.log(`rhythm: ${fmt(total)} contributions, peak ${peak.label}, busiest ${busiest.date}`);
