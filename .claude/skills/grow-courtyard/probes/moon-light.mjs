/* b196 — what is moonlight WORTH, at the call, before any constant is swept?
 *
 * moonLight() is moonLit() x the moon's ALTITUDE x (1 - cloudCover()). Every one of the
 * three already exists at HEAD, so this reads the product off an UNMODIFIED build: no
 * source lifting, no opinion. It warps a whole lunation (MOON_DAYS = 29.53 town days) at
 * a fixed step so `cloud` evolves for real, keeps every sample the moon could be seen at
 * (nightF > 0.25, the disc's own gate), and histograms the product.
 *
 * The number this exists to produce is the MEAN — the pivot a night multiply has to be
 * hung on if the mean night luma over a lunation is to land where HEAD's is and only the
 * RANGE grow. Pooled over seeds, because cloudCover is the town's weather and moonPhase
 * is the calendar: the phase is the same month in every world, the cover is not.
 *
 *   node .../probes/moon-light.mjs [file] [seeds...]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = process.argv[2] || 'courtyard.html';
const SEEDS = process.argv.slice(3).map(Number);
const USE = SEEDS.length ? SEEDS : [42, 7, 13, 99, 2024, 5];

const b = await chromium.launch();
const all = [];
for (const seed of USE){
  const p = await b.newPage({ viewport: { width: 1000, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(FILE)).href + '?seed=' + seed + '&pause&t=0');
  await p.waitForFunction('typeof __warp === "function"');
  const rows = await p.evaluate(() => {
    __reseed();                       // the default entry is a DIFFERENT world: reseed, THEN step, in one evaluate
    const out = [];
    const step = DAY_LEN / 96;                       // ~15 sim-minutes
    const N = Math.ceil(29.53 * DAY_LEN / step);
    for (let i = 0; i < N; i++){
      __warp(step);
      if (nightF <= 0.25) continue;
      const ma = moonArc(), alt = (ma > 0 && ma < 1) ? Math.sin(Math.PI * ma) : 0;
      out.push({ d: simT / DAY_LEN, h: hour, nf: nightF, lit: moonLit(), alt, cc: cloudCover(),
                 m: moonLit() * alt * (1 - cloudCover()) });
    }
    return out;
  });
  if (errs.length) console.log('  PAGE ERRORS seed ' + seed + ':', errs.slice(0, 3));
  console.log('seed ' + seed + ': ' + rows.length + ' night samples over a lunation');
  all.push(...rows);
  await p.close();
}
await b.close();

const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const M = all.map(r => r.m);
console.log('\n--- moonLight() at the call, ' + all.length + ' night samples, ' + USE.length + ' seeds x a lunation');
for (const [k, v] of [['moonLit', all.map(r => r.lit)], ['altitude', all.map(r => r.alt)],
                      ['1-cloud', all.map(r => 1 - r.cc)], ['PRODUCT', M]])
  console.log('  ' + k.padEnd(9) + ' mean ' + mean(v).toFixed(4) + '  p10 ' + q(v, 0.1).toFixed(3) +
              '  p50 ' + q(v, 0.5).toFixed(3) + '  p90 ' + q(v, 0.9).toFixed(3) + '  max ' + Math.max(...v).toFixed(3));
const H = new Array(10).fill(0);
for (const m of M) H[Math.min(9, Math.floor(m * 10))]++;
console.log('  histogram 0..1 by tenths: ' + H.map(n => (100 * n / M.length).toFixed(1) + '%').join(' '));
console.log('  share under 0.05: ' + (100 * M.filter(m => m < 0.05).length / M.length).toFixed(1) +
            '%   over 0.5: ' + (100 * M.filter(m => m > 0.5).length / M.length).toFixed(1) + '%');
console.log('\nMEAN = ' + mean(M).toFixed(4) + '   <- the pivot');
