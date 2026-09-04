/* b196 — does the night have a RANGE now, and did it cost the mean?
 *
 * Two readings, and they answer different questions.
 *
 * (1) THE BUILD MOVES, THE INSTANT IS HELD. Both builds are warped through the same
 *     lunation on the same seeds, so their worlds are the same world — same weather, same
 *     cloud, same season — and the only difference at a sampled instant is the source.
 *     What must hold: the MEAN night luma lands within a few percent of HEAD's (a moon is
 *     not a brightness knob) while the RANGE grows at BOTH ends — a new moon under a lid
 *     must come out DARKER than HEAD has ever drawn the town.
 *
 * (2) THE DAY IS HELD, THE PHASE MOVES. Two nights a fortnight apart differ in SEASON as
 *     well as in moon, so they are a look and not a control. MOON_START is a `let` for
 *     exactly this: at ONE pinned instant, with one weather and one sun, sweep the phase
 *     and read the frame. That is a control differing from what it controls in one way.
 *
 * Luma is read in the same evaluate as the draw, off a dt-pinned drawScene(simT, 0) — a
 * pass given a dt advances the phases it draws, and a ?paused page still runs rAF.
 *
 *   node .../probes/moon-night.mjs [cand] [base] [seeds...]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CAND = process.argv[2] || 'courtyard.html';
const BASE = process.argv[3] || '/tmp/head196.html';
const SEEDS = process.argv.slice(4).map(Number);
const USE = SEEDS.length ? SEEDS : [42, 7, 1234];
const VP = { width: 820, height: 520 };

const READ = `(() => {
  const c = document.getElementById('cv'), g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let s = 0, s2 = 0, n = 0, mn = 1e9, mx = -1;
  for (let i = 0; i < d.length; i += 16){        // every 4th pixel: 300k samples, plenty
    const v = 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
    s += v; s2 += v*v; n++; if (v < mn) mn = v; if (v > mx) mx = v;
  }
  return { mean: s/n, sd: Math.sqrt(s2/n - (s/n)*(s/n)), lo: mn, hi: mx };
})()`;

const b = await chromium.launch();
async function open1(file, seed){
  const p = await b.newPage({ viewport: VP });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=' + seed + '&pause&t=0');
  await p.waitForFunction('typeof __warp === "function" && typeof drawScene === "function"');
  return { p, errs };
}

/* ---- (1) the lunation, both builds, the same instants ---- */
async function lunation(file, seed){
  const { p, errs } = await open1(file, seed);
  const rows = await p.evaluate(READ_SRC => {
    const read = new Function('return ' + READ_SRC);
    __reseed();                     // reseed, THEN step, in one evaluate — an un-reseeded entry is a different world
    const out = [];
    const step = DAY_LEN / 96, N = Math.ceil(29.53 * DAY_LEN / step);
    let k = 0;
    for (let i = 0; i < N; i++){
      __warp(step);
      if (nightF <= 0.25) continue;
      if ((k++ % 4)) continue;                    // draw every 4th night sample
      drawScene(simT, 0);                         // dt PINNED: no phase is advanced by the read
      const r = read();
      const ma = moonArc();
      out.push({ d: +(simT/DAY_LEN).toFixed(3), h: +hour.toFixed(2), nf: +nightF.toFixed(3),
                 lit: +moonLit().toFixed(3), alt: +((ma>0&&ma<1)?Math.sin(Math.PI*ma):0).toFixed(3),
                 cc: +cloudCover().toFixed(3),
                 mean: +r.mean.toFixed(3), sd: +r.sd.toFixed(3), hi: r.hi });
    }
    return out;
  }, READ);
  if (errs.length) console.log('  PAGE ERRORS ' + file + ' seed ' + seed + ':', errs.slice(0, 3));
  await p.close();
  return rows;
}

const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const CA = [], BA = [];
for (const seed of USE){
  const c = await lunation(CAND, seed), h = await lunation(BASE, seed);
  if (c.length !== h.length) throw new Error('sample counts differ: ' + c.length + ' vs ' + h.length);
  for (let i = 0; i < c.length; i++){
    if (Math.abs(c[i].d - h[i].d) > 1e-6) throw new Error('instants drifted at ' + i);
    CA.push({ ...c[i], seed }); BA.push({ ...h[i], seed });
  }
  console.log('seed ' + seed + ': ' + c.length + ' night frames, both builds, same instants');
}

const cm = CA.map(r => r.mean), bm = BA.map(r => r.mean);
const D = cm.map((v, i) => v - bm[i]);
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length-1, Math.floor(f*s.length))]; };
console.log('\n=== (1) HEAD -> cand, same instants, ' + CA.length + ' night frames, ' + USE.length + ' seeds x a lunation');
console.log('  mean night luma   HEAD ' + mean(bm).toFixed(3) + '   cand ' + mean(cm).toFixed(3) +
            '   (' + (100*(mean(cm)-mean(bm))/mean(bm)).toFixed(2) + '%)');
console.log('  p01/p50/p99       HEAD ' + [0.01,0.5,0.99].map(f => q(bm,f).toFixed(2)).join(' / ') +
            '   cand ' + [0.01,0.5,0.99].map(f => q(cm,f).toFixed(2)).join(' / '));
console.log('  RANGE (max-min)   HEAD ' + (Math.max(...bm)-Math.min(...bm)).toFixed(3) +
            '   cand ' + (Math.max(...cm)-Math.min(...cm)).toFixed(3));
console.log('  sd across nights  HEAD ' + Math.sqrt(mean(bm.map(v=>v*v))-mean(bm)**2).toFixed(3) +
            '   cand ' + Math.sqrt(mean(cm.map(v=>v*v))-mean(cm)**2).toFixed(3));
console.log('  frames DARKER than HEAD: ' + D.filter(v => v < -0.05).length +
            '   BRIGHTER: ' + D.filter(v => v > 0.05).length + '   flat: ' + D.filter(v => Math.abs(v) <= 0.05).length);
const ix = D.map((v,i)=>i);
const dk = ix.reduce((a,i)=> D[i] < D[a] ? i : a, 0), br = ix.reduce((a,i)=> D[i] > D[a] ? i : a, 0);
const say = i => 'lit ' + CA[i].lit.toFixed(2) + ' alt ' + CA[i].alt.toFixed(2) + ' cloud ' + CA[i].cc.toFixed(2) +
                 ' -> HEAD ' + BA[i].mean.toFixed(2) + '  cand ' + CA[i].mean.toFixed(2) +
                 '  (sd ' + BA[i].sd.toFixed(2) + ' -> ' + CA[i].sd.toFixed(2) + ')';
console.log('  darkest swing:  ' + say(dk));
console.log('  brightest swing:' + say(br));
// the two ends the brief names, on their own terms
const dark = CA.map((r,i) => ({r, i})).filter(({r}) => r.lit < 0.15 && r.cc > 0.5);
const lite = CA.map((r,i) => ({r, i})).filter(({r}) => r.lit > 0.85 && r.cc < 0.3 && r.alt > 0.6);
const band = (name, set) => console.log('  ' + name.padEnd(26) + 'n=' + String(set.length).padEnd(5) +
  'HEAD ' + mean(set.map(({i}) => BA[i].mean)).toFixed(3) + ' -> cand ' + mean(set.map(({i}) => CA[i].mean)).toFixed(3) +
  '   sd ' + mean(set.map(({i}) => BA[i].sd)).toFixed(2) + ' -> ' + mean(set.map(({i}) => CA[i].sd)).toFixed(2));
band('new moon under cloud', dark); band('full moon, clear, high', lite);

/* ---- (2) hold the day, move MOON_START ---- */
console.log('\n=== (2) one instant, one weather, one sun: the PHASE swept (seed 42)');
{
  const { p, errs } = await open1(CAND, 42);
  const rows = await p.evaluate(READ_SRC => {
    const read = new Function('return ' + READ_SRC);
    __reseed();
    const step = DAY_LEN / 96;
    while (simT < 8 * DAY_LEN) __warp(step);        // day 8, a real world with real weather
    /* ...and an instant the moon is actually UP at. `nightF > 0.9` is NOT that instant:
     * at midsummer the night's clock reaches 0.9 while `daylight` is still 0.062, and the
     * DISC's own gate is daylight — so a probe that stopped at the night's clock swept the
     * phase through sixteen frames with no moon in any of them and read a flat line. The
     * predicate here is the one the light is defined on, and it is ASSERTED below. */
    let guard = 0;
    while (!(daylight <= 0.02 && nightF > 0.6 && moonAlt() > 0.55) && guard++ < 4000) __warp(step);
    const at = simT, cc = cloudCover(), out = [];
    if (guard >= 4000) return { fail: 'never found a moon-up instant' };
    const was = MOON_START;
    for (let k = 0; k < 16; k++){
      MOON_START = (k / 16 + 1e-6) % 1;             // moonPhase(at) walked right round
      drawScene(at, 0);
      const r = read();
      out.push({ ph: +moonPhase().toFixed(3), lit: +moonLit().toFixed(3),
                 mean: +r.mean.toFixed(3), sd: +r.sd.toFixed(3), hi: r.hi });
    }
    MOON_START = was;
    return { cc: +cc.toFixed(3), h: +hour.toFixed(2), d: +(at/DAY_LEN).toFixed(2), alt: +moonAlt().toFixed(3), out };
  }, READ);
  if (errs.length) console.log('  PAGE ERRORS:', errs.slice(0, 3));
  if (rows.fail) throw new Error(rows.fail);
  console.log('  day ' + rows.d + ' hour ' + rows.h + ', cloud ' + rows.cc + ', altitude ' + rows.alt +
              ' — everything but the phase held');
  for (const r of rows.out)
    console.log('    phase ' + r.ph.toFixed(3).padStart(5) + '  lit ' + r.lit.toFixed(3) +
                '   luma ' + r.mean.toFixed(3).padStart(7) + '  sd ' + r.sd.toFixed(2).padStart(6) + '  peak ' + r.hi);
  const ms = rows.out.map(r => r.mean);
  console.log('  new -> full: ' + Math.min(...ms).toFixed(3) + ' -> ' + Math.max(...ms).toFixed(3) +
              '  (x' + (Math.max(...ms)/Math.max(1e-6, Math.min(...ms))).toFixed(2) + ')');
  await p.close();
}
await b.close();
