/* b203 — measure the hole between the night's clock and the moon's disc.
 *
 * moonDisc() returns null unless `daylight <= 0.02 && nightF > 0.25`. daylight is a SINE
 * over the day and nightF's evening half is 1 - 1.6*daylight, so the two OVERLAP: the sky
 * can be night-dark while the sun still has a scrap of light left, and in that window the
 * disc is not drawn at all. This samples a whole year at a fixed step and counts the
 * samples where the sky is dark (nightF > 0.5), the moon is ABOVE THE HORIZON (moonAlt > 0)
 * and no disc drew — and prints where in the day they fall, per season.
 *
 * Everything measured here is the CALENDAR (nightF, daylight, moonArc are functions of the
 * clock and the season alone), so seeds should agree exactly; the run pools them anyway to
 * show that they do.
 *
 *   node .../probes/moon-hole.mjs [file] [seeds...]
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
    __reseed();
    const out = [];
    const step = DAY_LEN / 96;                        // ~15 sim-minutes
    const N = Math.ceil(26 * DAY_LEN / step);         // a whole year (SEASON_LEN 26 days)
    for (let i = 0; i < N; i++){
      __warp(step);
      const ma = moonArc(), alt = (ma > 0 && ma < 1) ? Math.sin(Math.PI * ma) : 0;
      out.push({ h: hour, sp: season(), nf: nightF, dl: daylight, alt,
                 disc: !!moonDisc(), lit: moonLit(),
                 sun: !!sunDisc(), up: sunUp, dn: sunDown });
    }
    return out;
  });
  if (errs.length) console.log('  PAGE ERRORS seed ' + seed + ':', errs.slice(0, 3));
  all.push(rows.map(r => ({ ...r, seed })));
  await p.close();
}
await b.close();

const pooled = all.flat();
const per = all.map(rows => rows.filter(r => r.nf > 0.5 && r.alt > 0 && !r.disc).length);
console.log('\n--- ' + pooled.length + ' samples, ' + USE.length + ' seeds x a year (~15 sim-min step)');
console.log('holes per seed (nightF>0.5, moon up, no disc): ' + per.join(' '));

const hole = pooled.filter(r => r.nf > 0.5 && r.alt > 0 && !r.disc);
const dark = pooled.filter(r => r.nf > 0.5 && r.alt > 0);
console.log('dark-and-moon-up samples ' + dark.length + ', of which NO DISC ' + hole.length +
            '  (' + (100 * hole.length / dark.length).toFixed(1) + '%)');
if (hole.length){
  const nf = hole.map(r => r.nf), dl = hole.map(r => r.dl);
  const mm = a => [Math.min(...a).toFixed(3), (a.reduce((s, v) => s + v, 0) / a.length).toFixed(3), Math.max(...a).toFixed(3)].join(' / ');
  console.log('  in the hole: nightF min/mean/max ' + mm(nf) + '   daylight ' + mm(dl));
  console.log('  moon altitude ' + mm(hole.map(r => r.alt)) + '   sun disc drawn in ' +
              hole.filter(r => r.sun).length + ' of ' + hole.length);
  // morning or evening, and how long it lasts, per season
  const seasons = [['midwinter', 0.9, 0.1], ['spring', 0.15, 0.35], ['midsummer', 0.4, 0.6], ['autumn', 0.65, 0.85]];
  const inS = (sp, a, b2) => a > b2 ? (sp >= a || sp <= b2) : (sp >= a && sp <= b2);
  const HRS = (26 * 24) / (pooled.length / USE.length);   // hours of sim per sample
  for (const [nm, a, b2] of seasons){
    const H = hole.filter(r => inS(r.sp, a, b2));
    const am = H.filter(r => r.h < 12.75), pm = H.filter(r => r.h >= 12.75);
    const rel = H.length ? '  hours off the sun: ' +
      [...new Set(H.map(r => (r.h < 12.75 ? (r.h - r.up) : (r.h - r.dn)).toFixed(2)))].sort((x, y) => x - y).slice(0, 8).join(' ') : '';
    console.log('  ' + nm.padEnd(10) + H.length + ' holed samples  (dawn ' + am.length + ', dusk ' + pm.length + ')' +
                '  = ' + (H.length * HRS / USE.length).toFixed(2) + ' h/seed over the season' + rel);
  }
}
// and the mirror question: does anything else already believe in a moon the disc denies?
const glit = pooled.filter(r => r.nf > 0.25 && r.alt > 0.02 && r.lit > 0.04 && !r.disc);
console.log('river glitter column drawn with NO disc (drawRiverLights gate v moonDisc): ' + glit.length + ' samples');
const litHole = pooled.filter(r => r.nf > 0.25 && r.alt > 0 && !r.disc);
console.log('any-dark (nightF>0.25) moon-up samples with no disc: ' + litHole.length +
            ' of ' + pooled.filter(r => r.nf > 0.25 && r.alt > 0).length);
