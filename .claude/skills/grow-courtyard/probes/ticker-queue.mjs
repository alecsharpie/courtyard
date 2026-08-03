#!/usr/bin/env node
/* probe-ticker.mjs — the census is blind to a text surface, so measure it.
 *
 * Two questions, numerically:
 *   1. At nine o'clock on day 2+, do BOTH the clock line and the church line
 *      reach the screen, in that order, each held long enough to read?
 *   2. Does a burst of announcements in one frame ever cut a line mid-life —
 *      i.e. is any line ever displayed for less than TICK_DWELL?
 *
 * Under ?pause + __warp(step, step), simStep gets dt === sdt, so the ticker's
 * real-second bucket advances 1:1 with sim time — exactly normal speed.
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '42');

// hour = (6 + p*24) % 24 over a 55 s day  ->  09:00 is 6.875 s in, 18:00 is 27.5 s in
const AT = { 'day2 09:00': 110 + 6.875 - 1, 'day2 18:00': 110 + 27.5 - 1, 'day3 09:00': 165 + 6.875 - 1 };

const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
await p.waitForFunction('typeof window.__warp === "function"');

let bad = 0;
for (const [label, t0] of Object.entries(AT)) {
  const series = await p.evaluate(async ({ t0 }) => {
    window.__reseed(); window.__setTime(t0);
    // scenarios share one page, so blank the WHOLE ticker, queue included —
    // otherwise a line left dwelling from the last scenario delays this one's
    // first strike and the series measures the probe, not the town
    document.getElementById('ticker').textContent = '';
    tickerQ.length = 0; tickerTimer = -99; tickerAge = 99;
    const out = [];
    for (let i = 0; i < 40; i++) {           // 40 * 0.25 s = 10 s of sim/real time
      window.__warp(0.25, 1 / 30);
      const el = document.getElementById('ticker');
      out.push({ t: +(i * 0.25 + 0.25).toFixed(2), txt: el.textContent, faded: el.classList.contains('fade') });
    }
    return out;
  }, { t0 });

  // collapse the sample series into the distinct lines that actually reached the screen
  const lines = [];
  for (const s of series) {
    if (!s.txt) continue;
    if (lines.length && lines[lines.length - 1].txt === s.txt) { lines[lines.length - 1].until = s.t; continue; }
    lines.push({ txt: s.txt, from: s.t, until: s.t });
  }
  console.log(`\n${label}  (seed ${seed})`);
  for (const l of lines) {
    const held = +(l.until - l.from + 0.25).toFixed(2);
    // 2.25 not 2.5: the series is sampled every 0.25 s, so a true 2.5 s dwell can
    // read as low as 2.25 s. Anything below that is a real cut.
    const flag = held < 2.25 && l !== lines[lines.length - 1] ? '  <-- CUT SHORT' : '';
    if (flag) bad++;
    console.log(`  ${String(l.from).padStart(5)}s +${String(held).padStart(4)}s  ${l.txt}${flag}`);
  }
  if (label.endsWith('09:00') || label.endsWith('18:00')) {
    const clock = lines.findIndex(l => /strikes/.test(l.txt));
    const church = lines.findIndex(l => /church bell answers/.test(l.txt));
    // the answer must be present, and must be IMMEDIATELY behind its own strike —
    // an orphaned "the church bell answers" is worse than no answer at all
    const ok = clock !== -1 && church === clock + 1;
    console.log(`  => clock@${clock} church@${church}  ${ok ? 'OK — answered, next line' : 'FAIL'}`);
    if (!ok) bad++;
  }
}

// a deliberate same-frame burst: five lines at once, none may vanish unread
const burst = await p.evaluate(() => {
  const el = document.getElementById('ticker');
  el.textContent = ''; tickerQ.length = 0; tickerTimer = -99; tickerAge = 99;
  ['one', 'two', 'three', 'four', 'five'].forEach(t => announce(t));
  const seen = [];
  for (let i = 0; i < 40; i++) {
    window.__warp(0.25, 1 / 30);
    if (!seen.length || seen[seen.length - 1] !== el.textContent) seen.push(el.textContent);
  }
  return seen;
});
console.log(`\nsame-frame burst of 5 -> shown: ${JSON.stringify(burst)}`);
console.log(`  (queue is capped at 2 + the line on screen; the OLDEST pending is dropped)`);

console.log(`\npage errors: ${errs.length}${errs.length ? '\n  ' + errs.join('\n  ') : ''}`);
console.log(bad || errs.length ? 'VERDICT: FAIL' : 'VERDICT: PASS');
await b.close();
process.exit(bad || errs.length ? 1 : 0);
