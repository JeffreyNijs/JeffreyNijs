// Renders dist/weekends-{light,dark}.svg: Mimlet walks the contribution grid,
// checks every day against "weekends are for resting", flags the weekend days
// that fail, shrinks them to the worst one and replays it. Loops every 14s.
// Runs daily in .github/workflows/profile.yml; locally:
//   GITHUB_TOKEN=$(gh auth token) bun scripts/weekends.ts
import { dayLabel, fetchCalendar, fmt, type Day, type Level } from './calendar.ts';
import { esc, mascot, mono, themes, type Theme } from './theme.ts';

const LIMIT = 40; // a weekend day with this many contributions fails the property

const { weeks, days } = await fetchCalendar();
const isWeekend = (d: Day) => d.weekday === 0 || d.weekday === 6;
const failing = days.filter((d) => isWeekend(d) && d.contributionCount >= LIMIT);
// Shrink order: least damning first, so the worst day is the one that's left.
const shrinkOrder = [...failing].sort((a, b) => a.contributionCount - b.contributionCount);
const worst = shrinkOrder.at(-1);

// Layout
const W = 780;
const STEP = Math.min(14, Math.floor((W - 40 + 3) / weeks.length));
const CELL = STEP - 3;
const GRID_W = weeks.length * STEP - 3;
const X0 = Math.round((W - GRID_W) / 2);
const GY = 88;
const H = GY + 7 * STEP - 3 + 22;
const MW = 42;
const MH = (MW * 120) / 148;
const colCenter = (w: number) => X0 + w * STEP + CELL / 2;
const LEVEL_INDEX: Record<Level, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

// Timeline, in seconds of one 14s loop
const D = 14;
const T = {
  sweepStart: 0.8,
  sweepEnd: 6,
  verdict: 6.4,
  dim: 6.9,
  shrinkStart: 7.6,
  shrinkEnd: 9.8,
  final: 10.1,
  replay: 11.4,
  fadeOut: 13.3,
};
const pct = (s: number) => `${((s / D) * 100).toFixed(3)}%`;
const revealAt = (w: number) => T.sweepStart + (w / (weeks.length - 1)) * (T.sweepEnd - T.sweepStart);
const shrinkAt = (i: number) =>
  T.shrinkStart + (shrinkOrder.length > 2 ? (i / (shrinkOrder.length - 2)) * (T.shrinkEnd - T.shrinkStart) : 0);
const FADE = 0.15;

// Opacity on from `on` until `off` (or the end of the loop).
const visible = (name: string, on: number, off?: number) =>
  `@keyframes ${name} { 0%, ${pct(on)} { opacity: 0; } ${pct(on + FADE)}${off ? `, ${pct(off)}` : ''} { opacity: 1; }${
    off ? ` ${pct(off + FADE)}, 100% { opacity: 0; }` : ' 100% { opacity: 1; }'
  } }`;

function render(t: Theme, mark: string) {
  const css: string[] = [];
  const anim = (cls: string, kf: string, timing = 'linear') => {
    css.push(kf, `.${cls} { animation: ${cls} ${D}s ${timing} infinite; }`);
  };

  // Scene fades in and out around each loop; the board dims while shrinking.
  anim('scene', `@keyframes scene { 0% { opacity: 0; } ${pct(0.5)}, ${pct(T.fadeOut)} { opacity: 1; } ${pct(T.fadeOut + 0.5)}, 100% { opacity: 0; } }`);
  if (worst) anim('board', `@keyframes board { 0%, ${pct(T.dim)} { opacity: 1; } ${pct(T.dim + 0.4)}, 100% { opacity: .22; } }`);

  const cell = (d: Day, w: number, fill: string, extra = '') =>
    `<rect x="${X0 + w * STEP}" y="${GY + d.weekday * STEP}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}"${extra}/>`;

  // Unchecked grid, then each week's real colors revealed as Mimlet passes.
  const base = weeks.map((week, w) => week.map((d) => cell(d, w, t.levels[0])).join('')).join('');
  const revealed = weeks
    .map((week, w) => {
      anim(`c${w}`, visible(`c${w}`, revealAt(w)));
      const cells = week
        .filter((d) => d.contributionLevel !== 'NONE')
        .map((d) => cell(d, w, t.levels[LEVEL_INDEX[d.contributionLevel]]))
        .join('');
      return `<g class="c${w}">${cells}</g>`;
    })
    .join('\n      ');

  // Failing days turn coral when checked, then shrink away until the worst is left.
  const weekOf = (d: Day) => weeks.findIndex((week) => week.includes(d));
  const fails = shrinkOrder
    .map((d, i) => {
      const w = weekOf(d);
      const isWorst = d === worst;
      if (isWorst) {
        anim('worst', `@keyframes worst { 0%, ${pct(revealAt(w))} { opacity: 0; } ${pct(revealAt(w) + FADE)}, ${pct(T.replay)} { opacity: 1; } ${pct(T.replay + 0.2)}, ${pct(T.replay + 0.5)} { opacity: 0; } ${pct(T.replay + 0.6)}, 100% { opacity: 1; } }`);
        return cell(d, w, t.fail, ' class="worst"');
      }
      anim(`f${i}`, visible(`f${i}`, revealAt(w), shrinkAt(i)));
      return cell(d, w, t.fail, ` class="f${i}"`);
    })
    .join('\n    ');

  let ring = '';
  let mx = colCenter(weeks.length - 1);
  if (worst) {
    const w = weekOf(worst);
    mx = colCenter(w);
    anim('ring', visible('ring', T.final));
    ring = `<rect class="ring" x="${X0 + w * STEP - 2.5}" y="${GY + worst.weekday * STEP - 2.5}" width="${CELL + 5}" height="${CELL + 5}" rx="4" fill="none" stroke="${t.text}" stroke-width="1.5"/>`;
  }

  // Mimlet walks above the column being checked, then steps over to the worst day.
  const startX = Math.max(colCenter(0) - MW / 2, X0);
  const clampX = (x: number) => Math.min(Math.max(x, X0), W - X0 - MW);
  const endX = clampX(colCenter(weeks.length - 1) - MW / 2);
  const finalX = clampX(mx - MW / 2);
  anim('walk', `@keyframes walk { 0%, ${pct(T.sweepStart)} { transform: translateX(${startX}px); } ${pct(T.sweepEnd)}, ${pct(T.final - 0.6)} { transform: translateX(${endX}px); } ${pct(T.final)}, 100% { transform: translateX(${finalX}px); } }`);
  const hopAt = worst ? T.replay : T.verdict + 0.2;
  anim('hop', `@keyframes hop { 0%, ${pct(hopAt)} { transform: translateY(0); } ${pct(hopAt + 0.22)} { transform: translateY(-16px); } ${pct(hopAt + 0.45)}, 100% { transform: translateY(0); } }`, 'ease-in-out');
  css.push(`@keyframes bob { 50% { transform: translateY(-2.5px); } } .bob { animation: bob .5s ease-in-out infinite; }`);

  // Captions, one at a time.
  const cap = (cls: string, on: number, off: number, parts: [string, string][]) => {
    anim(cls, visible(cls, on, off));
    const spans = parts.map(([fill, text]) => `<tspan fill="${fill}">${esc(text)}</tspan>`).join('');
    return `<text class="${cls}" x="${X0}" y="34">${spans}</text>`;
  };
  const captions = [
    cap('k1', 0.3, T.verdict - 0.2, [[t.muted, '▸ '], [t.text, `checking ${days.length} days: weekends are for resting (< ${LIMIT})`]]),
  ];
  if (worst) {
    captions.push(
      cap('k2', T.verdict, T.shrinkStart, [[t.fail, '✗ '], [t.text, `${failing.length} counterexample${failing.length === 1 ? '' : 's'}`]]),
      cap('k3', T.shrinkStart + 0.2, T.final - 0.2, [[t.muted, '… '], [t.text, 'shrinking']]),
      cap('k4', T.final, T.replay - 0.2, [[t.fail, '✗ '], [t.text, `${dayLabel(worst.date)} · ${fmt(worst.contributionCount)} contributions`]]),
      cap('k5', T.replay, T.fadeOut + 0.4, [[t.accent, '↻ '], [t.text, "replayed: still fails. We don't talk about it."]]),
    );
  } else {
    captions.push(cap('k2', T.verdict, T.fadeOut + 0.4, [[t.accent, '✓ '], [t.text, `all ${days.length} days passed. Weekends were for resting.`]]));
  }

  const summary = worst
    ? `${failing.length} weekend days had ${LIMIT} or more contributions; the worst was ${dayLabel(worst.date)} with ${fmt(worst.contributionCount)}.`
    : `No weekend day had ${LIMIT} or more contributions.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">Weekends are for resting</title>
  <desc id="desc">Mimlet checks the last ${days.length} days of contributions against the property that weekends are for resting. ${esc(summary)}</desc>
  <style>
    text { font-family: ${mono}; font-size: 14px; }
    ${css.join('\n    ')}
    /* Static frame for reduced motion: the verdict. */
    ${captions.map((_, i) => `.k${i + 1}`).filter((k) => k !== (worst ? '.k4' : '.k2')).join(', ')} { opacity: 0; }
    .walk { transform: translateX(${finalX}px); }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="${t.surface}" stroke="${t.border}"/>
  <g class="scene">
    ${captions.join('\n    ')}
    <g class="board">
      ${base}
      ${revealed}
    </g>
    ${fails}
    ${ring}
    <g class="walk"><g class="hop"><g class="bob">
      <svg x="0" y="${GY - MH - 6}" width="${MW}" height="${MH}" viewBox="0 0 148 120">${mark}</svg>
    </g></g></g>
  </g>
</svg>
`;
}

await Bun.write(new URL('../dist/weekends-light.svg', import.meta.url), render(themes.light, mascot('mark.svg')));
await Bun.write(new URL('../dist/weekends-dark.svg', import.meta.url), render(themes.dark, mascot('mark-dark.svg')));
console.log(`weekends: ${failing.length} failing, worst ${worst?.date ?? 'none'}`);
