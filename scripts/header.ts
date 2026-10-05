// Renders assets/header-{light,dark}.svg: a terminal that types `bun whoami.ts`
// and prints the real output of whoami.ts, then Mimlet hops in.
// Run with `bun scripts/header.ts` after editing whoami.ts.
import { jeffrey } from '../whoami.ts';
import { esc, mascot, mono, sans, themes, type Theme } from './theme.ts';

const W = 780;
const PAD = 26;
const TITLE_H = 38;
const FONT = 15;
const CW = FONT * 0.6; // monospace advance; tokens are placed by column
const LH = 23;
const COMMAND = 'bun whoami.ts';

const output = Bun.inspect(jeffrey, { colors: false }).split('\n');
const lineCount = output.length + 2; // command, output, final prompt
const firstBaseline = TITLE_H + 30;
const baseline = (i: number) => firstBaseline + i * LH;
const H = baseline(lineCount - 1) + 30;

const TYPE_START = 0.7;
const TYPE_DURATION = 1;
const OUTPUT_START = TYPE_START + TYPE_DURATION + 0.25;
const OUTPUT_STEP = 0.06;
const PROMPT_AT = OUTPUT_START + output.length * OUTPUT_STEP + 0.15;
const HOP_AT = PROMPT_AT + 0.15;

type Token = { col: number; text: string; kind: 'key' | 'string' | 'number' | 'punct' | 'plain' };

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  const re = /("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)(?=:)|([{}[\],:])|([^\s"]+)/g;
  for (const m of line.matchAll(re)) {
    const kind = m[1] ? 'string' : m[2] ? 'number' : m[3] ? 'key' : m[4] ? 'punct' : 'plain';
    tokens.push({ col: m.index!, text: m[0], kind });
  }
  return tokens;
}

function render(t: Theme, mark: string) {
  const x = (col: number) => PAD + col * CW;
  const fill = { key: t.text, string: t.string, number: t.number, punct: t.muted, plain: t.text };
  const prompt = (y: number) =>
    `<text x="${x(0)}" y="${y}" fill="${t.accent}">~</text><text x="${x(2)}" y="${y}" fill="${t.muted}">$</text>`;
  const cmdX = x(4);
  const cmdEnd = cmdX + COMMAND.length * CW;

  const lines = output
    .map((line, i) => {
      const spans = tokenize(line)
        .map((tok) => `<tspan x="${x(tok.col)}" fill="${fill[tok.kind]}">${esc(tok.text)}</tspan>`)
        .join('');
      const delay = (OUTPUT_START + i * OUTPUT_STEP).toFixed(2);
      return `<text class="in" style="animation-delay:${delay}s" y="${baseline(i + 1)}">${spans}</text>`;
    })
    .join('\n    ');

  const last = baseline(lineCount - 1);
  const markW = 124;
  const markH = (markW * 120) / 148;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">bun whoami.ts</title>
  <desc id="desc">A terminal runs bun whoami.ts and prints: ${esc(output.join(' ').replace(/\s+/g, ' '))}</desc>
  <style>
    text { font-family: ${mono}; font-size: ${FONT}px; }
    .title { font-family: ${sans}; font-size: 13px; }
    .type { transform: translateX(${cmdEnd}px); animation: type ${TYPE_DURATION}s steps(${COMMAND.length}, end) ${TYPE_START}s both; }
    @keyframes type { from { transform: translateX(${cmdX}px); } to { transform: translateX(${cmdEnd}px); } }
    .tcur { opacity: 0; animation: tcur ${OUTPUT_START - 0.1}s linear; }
    @keyframes tcur { from, to { opacity: 1; } }
    .in { animation: in .14s ease-out both; }
    @keyframes in { from { opacity: 0; } to { opacity: 1; } }
    .blink { animation: blink 1.1s steps(1, end) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    .hop { animation: hop .75s cubic-bezier(.34, 1.56, .64, 1) ${HOP_AT.toFixed(2)}s both; }
    @keyframes hop { from { transform: translateY(${markH + 10}px); } to { transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .type, .tcur, .in, .blink, .hop { animation: none; } }
  </style>
  <defs><clipPath id="win"><rect width="${W}" height="${H}" rx="12"/></clipPath></defs>
  <g clip-path="url(#win)">
    <rect width="${W}" height="${H}" fill="${t.surface}"/>
    <rect width="${W}" height="${TITLE_H}" fill="${t.chrome}"/>
    <path d="M0 ${TITLE_H - 0.5}H${W}" stroke="${t.border}"/>
    <circle cx="22" cy="${TITLE_H / 2}" r="6" fill="${t.dots[0]}"/>
    <circle cx="42" cy="${TITLE_H / 2}" r="6" fill="${t.dots[1]}"/>
    <circle cx="62" cy="${TITLE_H / 2}" r="6" fill="${t.dots[2]}"/>
    <text class="title" x="${W / 2}" y="${TITLE_H / 2 + 4.5}" text-anchor="middle" fill="${t.muted}">jeffrey@hasselt: ~</text>

    ${prompt(baseline(0))}
    <text x="${cmdX}" y="${baseline(0)}" fill="${t.text}" textLength="${COMMAND.length * CW}" lengthAdjust="spacing">${COMMAND}</text>
    <g class="type">
      <rect x="0" y="${baseline(0) - 16}" width="${(COMMAND.length + 1) * CW}" height="22" fill="${t.surface}"/>
      <rect class="tcur" x="0" y="${baseline(0) - 14}" width="${CW}" height="18" fill="${t.text}"/>
    </g>

    ${lines}

    <g class="in" style="animation-delay:${PROMPT_AT.toFixed(2)}s">
      ${prompt(last)}
      <rect class="blink" x="${x(4)}" y="${last - 14}" width="${CW}" height="18" fill="${t.text}"/>
    </g>

    <g class="hop">
      <svg x="${W - PAD - markW}" y="${H - markH + 3}" width="${markW}" height="${markH}" viewBox="0 0 148 120">${mark}</svg>
    </g>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${t.border}"/>
</svg>
`;
}

await Bun.write(new URL('../assets/header-light.svg', import.meta.url), render(themes.light, mascot('mark.svg')));
await Bun.write(new URL('../assets/header-dark.svg', import.meta.url), render(themes.dark, mascot('mark-dark.svg')));
console.log(`header: ${W}×${H}, ${output.length} output lines`);
