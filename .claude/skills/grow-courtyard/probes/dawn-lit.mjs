// The dawn curve of lit panes, and the evening curve beside it, across the year.
// Sweeps ONE forward warp per day: hour 17 -> the evening offsets off sunDown -> the dawn
// offsets off the next sunUp, so HOMES fills the way it does in play. Prints, per season day,
// the mean lit-pane count over N seeds at each offset. Pass a file to compare a candidate
// against HEAD: `git show HEAD:courtyard.html > /tmp/head.html` first (a /tmp fixture is
// whatever last wrote it).  usage: dawn-lit.mjs [file.html]
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
// windowLit is pure hash(), so it is SEED-INDEPENDENT: six seeds returned six identical
// curves. The sample that means anything is the YEAR — one full SEASON_LEN of days.
const SEEDS = [1];
const DAYS = Array.from({ length: 26 }, (_, d) => [String(d).padStart(3), d]);
const EVE = [-1, -0.5, 0, 0.5, 1, 1.5, 2, 3, 4];
const DAWN = [-2.5, -2, -1.6, -1.2, -0.8, -0.5, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.2];

const b = await chromium.launch();
const ROWS = [];
const acc = new Map();                       // `${label}|${phase}|${off}` -> [sum, n, sumHour, sumNightF]
for (const seed of SEEDS){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(([DAYS, EVE, DAWN]) => {
    const rows = [];
    const lit = () => { let n = 0; for (const [wx, wy, zTop, hgt, sa, sb] of WINDOWS) if (windowLit(sa, sb)) n++; return n; };
    const warpTo = H => { const need = ((H - hour) % 24 + 24) % 24; window.__warp(need / 24 * DAY_LEN); };
    for (const [label, d] of DAYS){
      window.__reseed(); window.__setTime(d * DAY_LEN + DAY_LEN * (17 - 6) / 24);   // 17:00, before the lamps
      const down = sunDown;
      for (const off of EVE){
        warpTo((down + off) % 24); drawScene(simT, 1 / 30);
        rows.push({ label, phase: 'eve', off, lit: lit(), hour, nightF, s: +(hour - sunDown).toFixed(2) });
      }
      warpTo((sunUp - 3.2 + 24) % 24);                 // land 3 h out and read the morning's own sun
      const up = sunUp;
      for (const off of DAWN){
        warpTo((up + off + 24) % 24); drawScene(simT, 1 / 30);
        rows.push({ label, phase: 'dawn', off, lit: lit(), hour, nightF, s: +(hour - sunUp).toFixed(2) });
      }
    }
    return { rows, W: WINDOWS.length };
  }, [DAYS, EVE, DAWN]);
  for (const r of out.rows){
    const k = `${r.label}|${r.phase}|${r.off}`;
    const a = acc.get(k) || [0, 0, 0, 0]; a[0] += r.lit; a[1]++; a[2] += r.s; a[3] += r.nightF; acc.set(k, a);
  }
  if (seed === SEEDS[0]) console.log('WINDOWS', out.W, '· days', DAYS.length, '·', file.split('/').pop());
  ROWS.push(...out.rows.map(r => ({ ...r, seed, hour: +r.hour.toFixed(3), nightF: +r.nightF.toFixed(3) })));
  await p.close();
}
await b.close();
const show = (phase, offs, axis) => {
  console.log(`\n${phase.toUpperCase()} — lit panes per day of the year, by hour ${axis}`);
  console.log('        '.padEnd(9) + offs.map(o => String(o).padStart(6)).join(''));
  for (const [label] of DAYS){
    const cells = offs.map(o => { const a = acc.get(`${label}|${phase}|${o}`); return (a[0] / a[1]).toFixed(1).padStart(6); });
    console.log(label.padEnd(9) + cells.join(''));
  }
  const mean = offs.map(o => { let s = 0, n = 0; for (const [label] of DAYS){ const a = acc.get(`${label}|${phase}|${o}`); s += a[0]; n += a[1]; } return (s / n).toFixed(2).padStart(6); });
  console.log('MEAN'.padEnd(9) + mean.join(''));
  const nf = offs.map(o => { let s = 0, n = 0; for (const [label] of DAYS){ const a = acc.get(`${label}|${phase}|${o}`); s += a[3]; n += a[1]; } return (s / n).toFixed(2).padStart(6); });
  console.log('nightF'.padEnd(9) + nf.join(''));
};
show('dawn', DAWN, 'relative to sunUp');
show('eve', EVE, 'relative to sunDown');
if (process.env.DUMP) (await import('node:fs')).writeFileSync(process.env.DUMP, JSON.stringify(ROWS, null, 0));
