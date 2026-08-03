/* working-day — is the town's working day hung off the sun, or off the clock?
 *
 *   node .claude/skills/grow-courtyard/probes/working-day.mjs [path-to-courtyard.html]
 *
 * #11 put sunrise and sunset on the year and nothing anybody DOES followed. The census
 * cannot see this at all — kioskOpen() and marketActive() are predicates, not counts —
 * so this scans four market days spread across the 26-day season year, samples every
 * predicate at 1/16 h, and reports each boundary as an OFFSET FROM THE SUN AT THAT
 * INSTANT rather than as a clock time. The claim under test is that the clock times
 * move by hours while the offsets hold.
 *
 * Season drifts 1/26 of a year within a single day, so sunUp itself moves ~0.4 h across
 * an equinox day. Hence the offset is taken against sunUp/sunDown sampled at the flip,
 * never against the day's opening value (LAWS: hold the season fixed, or the axis
 * measures the season).
 *
 * ?pause + __setTime is enough here: every predicate is a pure function of (day, hour),
 * so nothing needs the sim stepped. __reseed() still runs first, because isMarketDay()
 * and isWindy() are hash-based and a fresh page is not a rewound one.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const file = resolve(process.argv[2] || 'courtyard.html');
// market days (day % 4 === 2) spread round the season year. SEASON_LEN 26, SEASON_START
// 0.25, so phase = 0.25 + day/26: day 26 lands exactly on the anchor phase, where every
// offset must reduce to the constant it replaced.
const DAYS = [
  { day: 26, label: 'spring  (anchor phase 0.250)' },
  { day: 6,  label: 'summer  (phase 0.481)' },
  { day: 14, label: 'autumn  (phase 0.788)' },
  { day: 18, label: 'winter  (phase 0.942)' },
];
const DAY_LEN = 55, STEP = DAY_LEN / 24 / 16;   // 1/16 of an hour

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
p.on('pageerror', e => { console.log('PAGE ERROR', e.message); process.exitCode = 1; });
await p.goto(pathToFileURL(file).href + '?seed=42&t=0&pause');
await p.waitForFunction(() => window.__warp);

const rows = await p.evaluate(({ DAYS, DAY_LEN, STEP }) => {
  window.__reseed();
  const out = [];
  for (const { day, label } of DAYS){
    const s = [];
    // one full sim day, plus the hour past the rollover so a pack-away that runs late
    // is still seen; `hour` runs 6.00 -> 6.00 so this is 6am to 7am next morning
    for (let t = day * DAY_LEN; t < (day + 1) * DAY_LEN + DAY_LEN / 24; t += STEP){
      window.__setTime(t);
      s.push({
        hour, sunUp, sunDown,
        kiosk: kioskOpen(), mkt: marketActive(),
        r0: marketRaise(0), r2: marketRaise(2),
        sweep: hour > sunUp - 0.5 && hour < sunUp + 1,
        mktDay: isMarketDay(),
      });
    }
    // a flip is the first sample where f() is true and the one before it was not
    const flip = (f, rise) => {
      for (let i = 1; i < s.length; i++) if (rise ? (f(s[i]) && !f(s[i - 1])) : (!f(s[i]) && f(s[i - 1]))) return s[rise ? i : i - 1];
      return null;
    };
    const at = x => x && { hour: +x.hour.toFixed(2), sunUp: +x.sunUp.toFixed(2), sunDown: +x.sunDown.toFixed(2) };
    out.push({
      label, day,
      isMarketDay: s.some(x => x.mktDay),
      sun: { up: +s[0].sunUp.toFixed(2), down: +s[0].sunDown.toFixed(2) },
      kioskOpen:  at(flip(x => x.kiosk, true)),
      kioskShut:  at(flip(x => x.kiosk, false)),
      mktOpen:    at(flip(x => x.mkt, true)),
      mktShut:    at(flip(x => x.mkt, false)),
      raiseStart: at(flip(x => x.r0 > 0, true)),          // first trestle touches the ground
      packEnd:    at(flip(x => x.r2 > 0, false)),         // last pole away
      sweepStart: at(flip(x => x.sweep, true)),
      // the pop guard: largest single-step change in any stall's raise progress
      maxStallStep: +Math.max(...s.slice(1).map((x, i) =>
        Math.max(Math.abs(x.r0 - s[i].r0), Math.abs(x.r2 - s[i].r2)))).toFixed(3),
    });
  }
  return out;
}, { DAYS, DAY_LEN, STEP });

/* The anchor cannot be read off the scan above: simT 0 is phase 0.250 exactly, but the
 * season drifts 1/26 of a year within any single day, so by evening of an equinox day
 * sunDown has already moved ~0.36 h. Neutrality is a claim about the INSTANT, so it gets
 * evaluated at the instant — every boundary, against the constant it replaced. */
const anchorRow = await p.evaluate(() => {
  window.__setTime(0);
  return { sunUp, sunDown, mktOpen: marketOpen(), mktShut: marketClose(),
           kioskOpen: sunUp + 2, kioskShut: sunDown - 1.5,
           sweepFrom: sunUp - 0.5, sweepTo: sunUp + 1, windFrom: sunUp + 1.5, windTo: sunUp + 3.5 };
});
await b.close();

const f = (n, w = 6) => (n === null || n === undefined ? '  --  ' : n.toFixed(2)).padStart(w);
const line = (name, x, rel) => {
  if (!x) return `  ${name.padEnd(12)}      —  (never)`;
  const off = rel === 'up' ? x.hour - x.sunUp : x.sunDown - x.hour;
  return `  ${name.padEnd(12)} ${f(x.hour)}   ${rel === 'up' ? 'sunUp +' : 'sunDown -'}${f(off, 5)}`;
};

console.log('\nthe working day, as offsets from the sun at the moment of the flip\n');
for (const r of rows){
  console.log(`${r.label}   day ${r.day}   sunUp ${f(r.sun.up)}  sunDown ${f(r.sun.down)}   marketDay=${r.isMarketDay}`);
  console.log(line('sweeper', r.sweepStart, 'up'));
  console.log(line('kiosk open', r.kioskOpen, 'up'));
  console.log(line('raise start', r.raiseStart, 'up'));
  console.log(line('market open', r.mktOpen, 'up'));
  console.log(line('market shut', r.mktShut, 'down'));
  console.log(line('pack-away', r.packEnd, 'down'));
  console.log(line('kiosk shut', r.kioskShut, 'down'));
  const span = r.mktOpen && r.mktShut ? r.mktShut.hour - r.mktOpen.hour : null;
  console.log(`  market span  ${f(span)} h        max stall step/frame ${f(r.maxStallStep)}\n`);
}

/* ---- assertions ---------------------------------------------------------------- */
const checks = [];
const ok = (name, pass, detail) => { checks.push({ name, pass, detail }); };


// 1. day one is provably the old table — every boundary at the anchor instant, exactly
const WAS = { sunUp: 5.5, sunDown: 20, kioskOpen: 7.5, kioskShut: 18.5, mktOpen: 8, mktShut: 17,
              sweepFrom: 5, sweepTo: 6.5, windFrom: 7, windTo: 9 };
console.log('at SEASON_START (simT 0), against the constants replaced:');
for (const [k, was] of Object.entries(WAS)){
  const got = anchorRow[k];
  ok(`anchor ${k} = ${was}`, Math.abs(got - was) < 1e-9, `${got.toFixed(3)}`);
  console.log(`  ${k.padEnd(11)} ${f(got)}   was ${f(was)}   ${Math.abs(got - was) < 1e-9 ? '=' : 'DRIFT'}`);
}
console.log('');

// 2. the clock times actually moved — otherwise the offsets are constant for the boring reason
const opens = rows.map(r => r.mktOpen.hour), kshut = rows.map(r => r.kioskShut.hour);
ok('the clock times move across the year',
  Math.max(...opens) - Math.min(...opens) > 1.5 && Math.max(...kshut) - Math.min(...kshut) > 2,
  `market open spans ${(Math.max(...opens) - Math.min(...opens)).toFixed(2)} h, ` +
  `kiosk close spans ${(Math.max(...kshut) - Math.min(...kshut)).toFixed(2)} h`);

// 3. the offsets hold. marketOpen carries MK_EARLIEST and marketClose carries the span
//    floor, so those two are allowed to depart — every other boundary must not.
const spread = (sel, rel) => {
  const v = rows.map(r => { const x = sel(r); return rel === 'up' ? x.hour - x.sunUp : x.sunDown - x.hour; });
  return { lo: Math.min(...v), hi: Math.max(...v) };
};
for (const [name, sel, rel] of [
  ['kiosk open',  r => r.kioskOpen, 'up'],
  ['kiosk shut',  r => r.kioskShut, 'down'],
  ['sweeper',     r => r.sweepStart, 'up'],
]){
  const s = spread(sel, rel);
  ok(`${name} holds one offset`, s.hi - s.lo < 0.09, `${s.lo.toFixed(2)}–${s.hi.toFixed(2)} from the sun`);
}

// 4. nobody starts work in the dark — the sweeper's half hour of twilight is the one
//    deliberate exception, and it must stay half an hour
for (const r of rows){
  ok(`${r.label.slice(0, 6)}: work begins after dawn`,
    r.raiseStart.hour - r.raiseStart.sunUp > 0 && r.kioskOpen.hour - r.kioskOpen.sunUp > 0,
    `raise sunUp+${(r.raiseStart.hour - r.raiseStart.sunUp).toFixed(2)}, kiosk sunUp+${(r.kioskOpen.hour - r.kioskOpen.sunUp).toFixed(2)}`);
  ok(`${r.label.slice(0, 6)}: sweeper is twilight, not dark`,
    Math.abs((r.sweepStart.sunUp - r.sweepStart.hour) - 0.5) < 0.09,
    `sunUp-${(r.sweepStart.sunUp - r.sweepStart.hour).toFixed(2)}`);
  ok(`${r.label.slice(0, 6)}: last pole away before sunset`,
    r.packEnd.hour < r.packEnd.sunDown,
    `pack-away sunDown-${(r.packEnd.sunDown - r.packEnd.hour).toFixed(2)}`);
  ok(`${r.label.slice(0, 6)}: market keeps its shape`,
    r.mktShut.hour - r.mktOpen.hour >= 6.9,
    `${(r.mktShut.hour - r.mktOpen.hour).toFixed(2)} h`);
  ok(`${r.label.slice(0, 6)}: no stall pops`,
    r.maxStallStep < 0.2, `max step ${r.maxStallStep}`);
}

console.log('---');
let bad = 0;
for (const c of checks){ if (!c.pass) bad++; console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name.padEnd(38)} ${c.detail}`); }
console.log(`\n${checks.length - bad}/${checks.length} passed`);
if (bad) process.exitCode = 1;
