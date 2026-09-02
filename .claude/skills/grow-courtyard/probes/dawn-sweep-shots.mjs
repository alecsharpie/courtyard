// ONE contact sheet of the dawn, so HEAD and a candidate can be laid side by side.
// Two rows — a midwinter day and a midsummer day — and five columns across sunUp-1 .. +1.5.
// Each cell is the wide frame at that instant, drawn into a grid canvas INSIDE the page so
// the whole sweep is a single image (a five-column comparison read as ten screenshots in
// turn is exactly the judgement LAWS.md says not to make).
//   usage: dawn-sweep-shots.mjs <out.png> [file.html]
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const out = resolve(process.argv[2] || 'shots/dawn-sweep.png');
const file = resolve(process.argv[3] || 'courtyard.html');
const OFFS = [-1, -0.5, 0, 0.5, 1.5];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + '?pause&seed=1');
await p.waitForFunction(() => window.__warp);
// the SHORTEST and LONGEST day the year actually holds — SEASON_START means day 0 is not
// midwinter, and two near-equinox days are no test of a curve that breathes with the season
const DAYS = await p.evaluate(() => {
  const d = [...Array(26).keys()].map(k => ({ k, up: sunAt(k * DAY_LEN + DAY_LEN * 0.25).up }));
  const lo = d.reduce((a, b) => b.up > a.up ? b : a), hi = d.reduce((a, b) => b.up < a.up ? b : a);
  return [[lo.k, 'shortest day'], [hi.k, 'longest day']];
});
const info = await p.evaluate(([DAYS, OFFS, tag]) => {
  const CW = 640, CH = 380;
  const grid = document.createElement('canvas');
  grid.width = CW * OFFS.length; grid.height = CH * DAYS.length + 26;
  grid.id = 'sheet'; grid.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  document.body.appendChild(grid);
  const g = grid.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(0, 0, grid.width, grid.height);
  const cv = document.querySelector('canvas');
  const warpTo = H => { const need = ((H - hour) % 24 + 24) % 24; window.__warp(need / 24 * DAY_LEN); };
  const rows = [];
  DAYS.forEach(([d, label], ri) => {
    window.__reseed(); window.__setTime(d * DAY_LEN + DAY_LEN * (17 - 6) / 24);
    warpTo((sunUp - 3.2 + 24) % 24);
    const up = sunUp;
    OFFS.forEach((o, ci) => {
      warpTo((up + o + 24) % 24);
      drawScene(simT, 1 / 30);
      g.drawImage(cv, 0, 0, cv.width, cv.height, ci * CW, 26 + ri * CH, CW, CH);
      let lit = 0; for (const [wx, wy, zT, hg, sa, sb] of WINDOWS) if (windowLit(sa, sb)) lit++;
      g.font = '13px monospace'; g.fillStyle = '#ffe';
      g.fillText(`${label} sunUp${o >= 0 ? '+' : ''}${o}  h${hour.toFixed(2)}  nightF ${nightF.toFixed(2)}  lit ${lit}`,
                 ci * CW + 8, 26 + ri * CH + 16);
      rows.push({ label, o, hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), lit });
    });
  });
  g.font = 'bold 16px monospace'; g.fillStyle = '#fff'; g.fillText(tag, 8, 18);
  return rows;
}, [DAYS, OFFS, file.split('/').pop()]);
await p.locator('#sheet').screenshot({ path: out });
await b.close();
console.log(out);
for (const r of info) console.log(`  ${r.label.padEnd(10)} sunUp${r.o >= 0 ? '+' : ''}${String(r.o).padEnd(5)} hour ${String(r.hour).padStart(5)}  nightF ${r.nightF.toFixed(2)}  lit ${r.lit}`);
