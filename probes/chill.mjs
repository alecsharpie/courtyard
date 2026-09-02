#!/usr/bin/env node
/* b133 — two build-INDEPENDENT measurements, one probe.
 *
 * A. THE CHIMNEY POP. Wraps ctx.arc and filters on the chimney smoke's own fill
 *    signature `rgba(226,224,218,` — a fact about what is DRAWN, not about any
 *    predicate a build defines. Steps the clock in 0.02 h across the morning fire
 *    at a pinned phase (t held constant, so a puff cannot move) and reports, per
 *    step, how many stacks changed lit state and the L1 change in per-stack alpha.
 *    A pop is a step where many stacks flip at once.
 *
 * B. THE GLASS. Finds the hour on a midwinter and a midsummer day where nightF is
 *    equal (the same sun angle), draws the frame, and reads the canvas back in the
 *    SAME evaluate — mean R, G, B and R-B over the interior of every LIT_PANES quad.
 *
 *   node probe-chill.mjs [--file f.html] [--label L]
 */
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const LABEL = arg('--label', SRC.endsWith('courtyard.html') ? 'CANDIDATE' : SRC);
const SEED = +arg('--seed', 7);
if (!existsSync(SRC)) { console.error('no such file', SRC); process.exit(2); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
await page.goto(pathToFileURL(SRC).href + '?pause&seed=' + SEED);
await page.waitForFunction('window.__census !== undefined');
await page.evaluate(() => { __reseed(); });

/* ---- find midwinter and midsummer days (warmth min / max) ---- */
const cal = await page.evaluate(() => {
  const out = [];
  for (let d = 0; d < 26; d++){ __setTime(d * DAY_LEN + DAY_LEN * 0.5); out.push({ d, warmth, sunUp, dayHours }); }
  return out;
});
const winter = cal.reduce((a, b) => b.warmth < a.warmth ? b : a);
const summer = cal.reduce((a, b) => b.warmth > a.warmth ? b : a);

/* ---- A. the morning fire, stepped ---- */
const pop = await page.evaluate((D) => {
  // canvas SERIALISES fillStyle back with spaces — match the smoke's own colour, not
  // the string that was assigned
  const SIG = /^rgba\(226,\s*224,\s*218,\s*([\d.]+)\)$/;
  let rec = null;
  const oa = CanvasRenderingContext2D.prototype.arc;
  CanvasRenderingContext2D.prototype.arc = function(x, y, r, s, e){
    if (rec){ const m = SIG.exec(String(this.fillStyle)); if (m) rec.push([Math.round(x), +m[1]]); }
    return oa.call(this, x, y, r, s, e);
  };
  const frames = [];
  for (let h = 2.0; h <= 12.0; h += 0.02){
    // hours 2..6 belong to the PREVIOUS calendar day (`hour` wraps to 6, then day++)
    const t = h >= 6 ? (D * DAY_LEN + (h - 6) / 24 * DAY_LEN)
                     : ((D - 1) * DAY_LEN + (h + 18) / 24 * DAY_LEN);
    __setTime(t);
    rec = [];
    drawSmoke(100.0);                       // t PINNED: the puff phase cannot move
    // ONE chimney emits exactly 6 puffs, consecutively, and with t pinned each lands at
    // the same x in every frame — so a chunk of 6 IS a stack, and its x-tuple is its id.
    // (Keying on a single arc's x counts one stack six times: 210 "stacks" from 68.)
    const per = new Map();
    for (let i = 0; i + 6 <= rec.length; i += 6){
      const ch = rec.slice(i, i + 6);
      per.set(ch.map(a => a[0]).join(','), Math.max(...ch.map(a => a[1])));
    }
    frames.push({ h, day, hour, cold: hearthF(), stacks: [...per.entries()] });
    rec = null;
  }
  CanvasRenderingContext2D.prototype.arc = oa;
  return frames;
}, winter.d);

let worst = { flips: -1 }, worstL1 = { l1: -1 };
for (let i = 1; i < pop.length; i++){
  const a = new Map(pop[i - 1].stacks), b = new Map(pop[i].stacks);
  const keys = new Set([...a.keys(), ...b.keys()]);
  let flips = 0, l1 = 0;
  for (const k of keys){
    const va = a.get(k) || 0, vb = b.get(k) || 0;
    if ((va > 0) !== (vb > 0)) flips++;
    l1 += Math.abs(vb - va);
  }
  const row = { h: pop[i].h, hour: pop[i].hour, day: pop[i].day, flips, l1, n: b.size, was: a.size };
  if (flips > worst.flips) worst = row;
  if (l1 > worstL1.l1) worstL1 = row;
}
const peak = pop.reduce((a, b) => b.stacks.length > a.stacks.length ? b : a);

/* ---- B. the glass, MATCHED PANE BY PANE ---- */
/* Which windows are lit is hashed per night, so the pane SET differs between any two
 * instants and a mean over "whatever was lit" mixes the room's colour with the wall
 * behind each pane (HEAD reads winter 44.1 / summer 50.0 R-B that way — pure identity
 * noise). So: accumulate per PANE, keyed by its screen centroid, over several deep
 * nights a season, then compare only the panes that appear in BOTH seasons. Deep night
 * (21.5..23.75) because applyLight's dusk wash is hard-coded on hour 19 and is 0.53 at a
 * midwinter nightF 0.85 against 0.00 at a midsummer one — a seasonal confound of its own. */
const glass = await page.evaluate(async ({ winterD, summerD }) => {
  const seasons = {};
  for (const [name, d0] of [['winter', winterD], ['summer', summerD]]){
    const acc = new Map(); let panes = 0, nF = 0, nS = 0, warm = 0, snow = 0, chill = 0, k = 0;
    for (let dd = 0; dd < 4; dd++) for (let h = 21.5; h <= 23.8; h += 0.25){
      const day = d0 + dd - 1;
      __setTime(day * DAY_LEN + (h - 6) / 24 * DAY_LEN);
      drawScene(simT, 1 / 30);
      const id = ctx.getImageData(0, 0, W, H);           // SAME evaluate as the draw
      const px = id.data, IW = id.width, IH = id.height; // W is a FLOAT — index off id.width
      for (const q of LIT_PANES){
        const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
        const x0 = Math.ceil(Math.min(...xs)) + 1, x1 = Math.floor(Math.max(...xs)) - 1;
        const y0 = Math.ceil(Math.min(...ys)) + 1, y1 = Math.floor(Math.max(...ys)) - 1;
        const key = Math.round((x0 + x1) / 2) + ':' + Math.round((y0 + y1) / 2);
        let e = acc.get(key); if (!e) acc.set(key, e = { r: 0, g: 0, b: 0, n: 0 });
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
          if (x < 0 || y < 0 || x >= IW || y >= IH) continue;
          const i = (y * IW + x) * 4; e.r += px[i]; e.g += px[i + 1]; e.b += px[i + 2]; e.n++;
        }
        panes++;
      }
      nF += nightF; nS++; warm += warmth; snow += snowCover; k++;
      chill += (typeof chillF === 'function') ? chillF() : 0;
    }
    seasons[name] = { acc: [...acc], panes, nightF: nF / nS, warmth: warm / k,
                      snowCover: snow / k, chill: chill / k, samples: k };
  }
  return seasons;
}, { winterD: winter.d, summerD: summer.d });

const wA = new Map(glass.winter.acc), sA = new Map(glass.summer.acc);
const both = [...wA.keys()].filter(k => sA.has(k));
const roll = (m, keys) => { let r = 0, g = 0, b = 0, n = 0;
  for (const k of keys){ const e = m.get(k); r += e.r; g += e.g; b += e.b; n += e.n; }
  return { r: r / n, g: g / n, b: b / n, rb: (r - b) / n, n }; };
const wM = roll(wA, both), sM = roll(sA, both);

console.log('=== ' + LABEL + '  (seed ' + SEED + ') ===');
console.log('calendar: midwinter day ' + winter.d + ' warmth ' + winter.warmth.toFixed(3) +
            '  ·  midsummer day ' + summer.d + ' warmth ' + summer.warmth.toFixed(3));
console.log('\nA. the morning fire, midwinter day ' + winter.d + ', 2.00 -> 12.00 at 0.02 h, phase pinned');
console.log('   peak stacks alight   ' + peak.stacks.length + ' at hour ' + peak.h.toFixed(2) +
            ' (cold ' + peak.cold.toFixed(3) + ')');
console.log('   WORST single step    ' + worst.flips + ' stacks flip at hour ' + worst.h.toFixed(2) +
            '  (' + worst.was + ' -> ' + worst.n + ' alight)');
console.log('   worst alpha step     L1 ' + worstL1.l1.toFixed(3) + ' at hour ' + worstL1.h.toFixed(2));
const near6 = pop.map((f, i) => ({ f, i })).filter(o => o.f.h > 5.8 && o.f.h < 6.25);
for (const { f, i } of near6){
  if (i === 0) continue;
  const a = new Map(pop[i - 1].stacks), b = new Map(f.stacks);
  let flips = 0; for (const k of new Set([...a.keys(), ...b.keys()])) if (((a.get(k)||0)>0) !== ((b.get(k)||0)>0)) flips++;
  console.log('     h ' + f.h.toFixed(2) + '  day ' + f.day + '  alight ' + String(b.size).padStart(3) + '  flips ' + flips);
}
console.log('\nB. the lit glass on deep nights, the SAME panes both seasons');
for (const [nm, o, m] of [['winter', glass.winter, wM], ['summer', glass.summer, sM]])
  console.log('   ' + nm + '  warmth ' + o.warmth.toFixed(3) + '  snow ' + o.snowCover.toFixed(2) +
              '  nightF ' + o.nightF.toFixed(3) + '  chill ' + (o.chill ? o.chill.toFixed(3) : ' n/a ') +
              '  distinct panes ' + String(o.acc.length).padStart(3) +
              '  RGB ' + m.r.toFixed(2) + ',' + m.g.toFixed(2) + ',' + m.b.toFixed(2) +
              '  R-B ' + m.rb.toFixed(2));
console.log('   matched panes ' + both.length + ' of ' + wA.size + '/' + sA.size +
            ', ' + wM.n + '/' + sM.n + ' px');
console.log('   WINTER - SUMMER:  R-B ' + (wM.rb - sM.rb).toFixed(2) +
            '   R ' + (wM.r - sM.r).toFixed(2) + '   G ' + (wM.g - sM.g).toFixed(2) +
            '   B ' + (wM.b - sM.b).toFixed(2));
await browser.close();
