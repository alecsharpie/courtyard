/* ground-cost.mjs — what a repaint COSTS, and what holding one costs the picture.
 *
 * Two numbers, and they trade against each other:
 *
 *   ms/repaint   drawGround timed in the page, at four framings, at rest and mid-hold
 *                (the padded wide paint a camera move takes). Judged against the OTHER
 *                build in the same session, never a stored figure.
 *   STALENESS    the honest price of repainting less often: at every sample instant,
 *                the ground cache AS THE BUILD'S OWN RULE LEFT IT against a cache
 *                painted at that instant. Mean |dRGB| over a downsample of the whole
 *                cache. HEAD's quarter-hour clock has a staleness of its own — the bar
 *                is not zero, it is HEAD's, and the rule that beats HEAD's repaint count
 *                without exceeding HEAD's WORST held frame has cost the eye nothing.
 *
 * The truth painting is done by SAVING the held bitmap and every *Painted mark, calling
 * drawGround, reading it, and putting both back — so measuring does not disturb the rule
 * being measured.
 *
 *   node probes/ground-cost.mjs [days] [seed] [sweeps]
 *   GC_REF=<ref> to pin the control to a ref rather than HEAD
 *   sweeps: e.g. "LIGHT_MOVE=0.3,WEAR_REPAINT=3" — extra candidate runs, one per group
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const DAYS = +(process.argv[2] || 1), SEED = +(process.argv[3] || 7);
const SWEEPS = (process.argv[4] || '').split(';').filter(Boolean);
const DAY = 55, SAMPLE = 0.25;
const SIZES = [[1600, 950], [1200, 700], [900, 560], [390, 844]];
const REF = process.env.GC_REF || 'HEAD';

const WARP = `window.__warp = function(secs, step){`;
const HOOK = `/* the frame loop's sim + ground half, without the live draw: drawScene's ONE
 * consuming line, run for real, so the build's own repaint rule decides. */
window.__NP = 0;
window.__step = function(secs, step){
  step = step || 1 / 30;
  const n = Math.max(0, Math.round(secs / step));
  for (let i = 0; i < n; i++){ simStep(step, step);
    if (groundDirty && !viewEasing()){ drawGround(); groundDirty = false; wearDirty = false; wearAcc = 0; window.__NP++; } }
};
window.__marks = function(m){
  if (m){ snowPainted = m[0]; wetPainted = m[1]; washPainted = m[2]; barrowPainted = m[3];
          if (typeof lightPainted !== 'undefined'){ lightPainted = m[4]; slowPainted = m[5]; }
          lightBucket = m[6]; return; }
  return [snowPainted, wetPainted, washPainted, barrowPainted,
          typeof lightPainted !== 'undefined' ? lightPainted : null,
          typeof slowPainted !== 'undefined' ? slowPainted : null, lightBucket];
};
window.__gpaint = function(){ const t = performance.now(); drawGround(); return performance.now() - t; };
window.__gtx = function(){ return [gcv, gtx, gview, DPR]; };
`;
function instrument(src, name, sets){
  if (!src.includes(WARP)) throw new Error(name + ': __warp miss');
  let out = src.replace(WARP, HOOK + WARP);
  for (const [k, v] of sets){
    const re = new RegExp('(let|const) ' + k + ' = [0-9.]+', 'g');
    const n = (out.match(re) || []).length;
    if (n !== 1) throw new Error(name + ': sweep "' + k + '" matched ' + n);
    out = out.replace(re, 'let ' + k + ' = ' + v);
  }
  return out;
}
const refSrc = execFileSync('git', ['show', REF + ':courtyard.html'], { maxBuffer: 1 << 28 }).toString();
const candSrc = readFileSync('courtyard.html', 'utf8');
const runs = [[REF, refSrc, []], ['CAND', candSrc, []]];
for (const sw of SWEEPS){
  const sets = sw.split(',').map(s => s.split('='));
  runs.push(['CAND ' + sw, candSrc, sets]);
}
const files = runs.map(([n, src, sets], i) => {
  const f = `/tmp/probe-gcost-${i}.html`; writeFileSync(f, instrument(src, n, sets)); return f;
});

const b = await chromium.launch();

// ---- ms per repaint, at four framings: at rest, and with the padded wide hold on ----
async function cost(file){
  const out = {};
  for (const [W, H] of SIZES){
    const pg = await b.newPage({ viewport: { width: W, height: H } });
    const errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(pathToFileURL(file).href + `?pause&seed=${SEED}&t=0`);
    await pg.waitForFunction('window.__census');
    const r = await pg.evaluate(() => {
      window.__reseed();
      const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
      const runAt = (t, pad) => { window.__setTime(t); gpadWant = pad;
        const a = []; for (let i = 0; i < 7; i++) a.push(window.__gpaint()); return med(a); };
      const rest = med([runAt(175, 0), runAt(230, 0), runAt(120, 0)]);
      const hold = med([runAt(175, groundPad()), runAt(230, groundPad()), runAt(120, groundPad())]);
      gpadWant = 0; drawGround();
      return { rest, hold, pad: groundPad() };
    });
    if (errs.length) throw new Error('page error: ' + errs[0]);
    out[W + 'x' + H] = r;
    await pg.close();
  }
  return out;
}

// ---- staleness: the held cache against a cache painted at this instant ----
async function stale(file){
  const pg = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(pathToFileURL(file).href + `?pause&seed=${SEED}&t=0`);
  await pg.waitForFunction('window.__census');
  const r = await pg.evaluate(({ DAYS, DAY, SAMPLE }) => {
    window.__reseed();
    const [gcv, gtx, gview, DPR] = window.__gtx();
    const SW = 320, SH = 190;
    const sm = document.createElement('canvas'); sm.width = SW; sm.height = SH;
    const stx = sm.getContext('2d', { willReadFrequently: true });
    const save = document.createElement('canvas'); const svx = save.getContext('2d');
    const read = () => { stx.drawImage(gcv, 0, 0, SW, SH); return stx.getImageData(0, 0, SW, SH).data; };
    const diff = (a, c) => { let s = 0; for (let i = 0; i < a.length; i += 4)
      s += Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]);
      return s / (a.length / 4 * 3); };
    const out = [];
    const n = Math.round(DAYS * DAY / SAMPLE);
    for (let i = 0; i < n; i++){
      window.__step(SAMPLE);
      const held = read();
      // measure without disturbing what is being measured: the bitmap and every mark back
      save.width = gcv.width; save.height = gcv.height;
      svx.setTransform(1, 0, 0, 1, 0, 0); svx.drawImage(gcv, 0, 0);
      const marks = window.__marks();
      drawGround();
      const truth = read();
      gtx.setTransform(1, 0, 0, 1, 0, 0); gtx.clearRect(0, 0, gcv.width, gcv.height);
      gtx.drawImage(save, 0, 0);
      gtx.setTransform(DPR, 0, 0, DPR, gview.pad * DPR, 0);
      window.__marks(marks);
      out.push([+hour.toFixed(2), diff(held, truth)]);
    }
    return { series: out, paints: window.__NP };
  }, { DAYS, DAY, SAMPLE });
  if (errs.length) throw new Error('page error: ' + errs[0]);
  await pg.close();
  return r;
}

const res = [];
for (let i = 0; i < runs.length; i++) res.push({ name: runs[i][0], cost: await cost(files[i]), stale: await stale(files[i]) });
await b.close();

console.log(`\nms per drawGround — seed ${SEED}, median of 7 x 3 instants (interleaved control: the runs below)\n`);
console.log('  ' + 'build'.padEnd(22) + SIZES.map(([w, h]) => (w + 'x' + h).padStart(13)).join(''));
for (const r of res){
  console.log('  ' + r.name.padEnd(22) + SIZES.map(([w, h]) => {
    const c = r.cost[w + 'x' + h]; return (c.rest.toFixed(1) + '/' + c.hold.toFixed(1)).padStart(13); }).join('') + '   rest/hold');
}
console.log(`\nrepaints and staleness — ${DAYS} sim day(s), sampled every ${SAMPLE}s, mean |dRGB| over the whole cache\n`);
console.log('  ' + 'build'.padEnd(22) + ['paints/day', 'ms/day', 'stale max', 'p99', 'mean', 'held>HEADmax'].map(s => s.padStart(12)).join(''));
let bar = null;
for (const r of res){
  const v = r.stale.series.map(s => s[1]).sort((a, c) => a - c);
  const max = v[v.length - 1], p99 = v[Math.floor(v.length * 0.99)], mean = v.reduce((a, c) => a + c, 0) / v.length;
  if (bar === null) bar = max;
  const over = v.filter(x => x > bar).length;
  const perDay = r.stale.paints / DAYS, ms = perDay * r.cost['1600x950'].rest;
  console.log('  ' + r.name.padEnd(22) + [perDay.toFixed(1), ms.toFixed(0), max.toFixed(2), p99.toFixed(2), mean.toFixed(2),
    (100 * over / v.length).toFixed(1) + '%'].map(s => String(s).padStart(12)).join(''));
}
// where in the day the staleness sits — the clock over-samples a midnight and under-samples a dawn
const bins = 8;
console.log('\n  mean staleness by 3-hour band (hour 0..24)');
for (const r of res){
  const b8 = Array.from({ length: bins }, () => [0, 0]);
  for (const [h, d] of r.stale.series){ const k = Math.min(bins - 1, Math.floor(h / (24 / bins))); b8[k][0] += d; b8[k][1]++; }
  console.log('  ' + r.name.padEnd(22) + b8.map(([s, n]) => (n ? (s / n).toFixed(2) : '-').padStart(8)).join(''));
}
