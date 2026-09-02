#!/usr/bin/env node
/* hearth-year.mjs — #124. Does the morning fire follow the SUN and the COLD?
 * Three readings, HEAD and tree measured by the same code, HEAD regenerated from git:
 *   1. the year, hour by hour: where the morning term PEAKS, against that day's sunrise.
 *   2. at each day's own first light: how many of the 34 stacks are lit, and how hard.
 *   3. the roofline in pixels: smoke mass at a January dawn and a July dawn, against a
 *      same-code control (reseed+warp+drawScene leaves ~1% of the frame unpinned).      */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
writeFileSync('/tmp/head-courtyard.html', execSync('git show HEAD:courtyard.html', { cwd: resolve(HERE, '../../../..'), maxBuffer: 1 << 26 }));
const BUILDS = {
  HEAD: pathToFileURL('/tmp/head-courtyard.html').href,
  tree: pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href,
};
const SEED = 42;

/* hearthF() only exists on the tree. On HEAD the same quantity is computed IN THE PAGE
 * from the page's own live globals — two lines, no copy of any constant the page owns. */
const HEARTH = `(typeof hearthF === 'function') ? hearthF()
  : clamp(1 - Math.abs(hour - 7) / 3.5, 0, 1) + rainFall * 0.7 + clamp((hour - 18.5) / 2, 0, 1) * 0.8`;

const YEAR = `(dry) => {
  const out = [];
  for (let d = 0; d < 26; d++){
    let peakH = -1, peakV = -1, atEdge = 0, litEdge = 0, sun = 0, edge = 0, wrm = 0;
    for (let i = 0; i <= 120; i++){
      const h = 2 + i * 0.1;                       // 02:00 .. 14:00, the morning half only
      __setTime(d * DAY_LEN + ((h - 6 + 24) % 24) / 24 * DAY_LEN);
      if (dry) { rainFall = 0; snowCover = 0; }
      const v = ${HEARTH};
      if (v > peakV) { peakV = v; peakH = h; }
      sun = sunUp; edge = dawnEdge(); wrm = warmth;
    }
    __setTime(d * DAY_LEN + ((edge - 6 + 24) % 24) / 24 * DAY_LEN);
    if (dry) { rainFall = 0; snowCover = 0; }
    atEdge = ${HEARTH};
    const lit = v => { const c = Math.min(Math.max(v, 0), 1) * 0.75; let n = 0;
      for (const [cx, cy] of CHIMNEYS) if (hash(cx, cy + d * 7) <= c) n++; return n; };
    litEdge = lit(atEdge);
    out.push({ d, sun: +sun.toFixed(2), edge: +edge.toFixed(2), warmth: +wrm.toFixed(2),
               peakH: +peakH.toFixed(1), peakV: +peakV.toFixed(3), atEdge: +atEdge.toFixed(3),
               litEdge, litPeak: lit(peakV) });
  }
  return { n: CHIMNEYS.length, rows: out };
}`;

const b = await chromium.launch();
const rd = async (url, fn, arg) => {
  const pg = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await pg.goto(url + '?seed=' + SEED + '&pause', { waitUntil: 'load' });
  await pg.waitForFunction('typeof __setTime === "function" && CHIMNEYS.length > 0');
  const r = await pg.evaluate(new Function('return ' + fn)(), arg);
  await pg.close();
  return r;
};

console.log('=== 1+2. the year, dry, at each day\'s own first light ===');
const res = {};
for (const [k, u] of Object.entries(BUILDS)) res[k] = await rd(u, YEAR, true);
console.log('stacks: HEAD ' + res.HEAD.n + ' / tree ' + res.tree.n);
console.log(' day sunUp  edge warmth |      HEAD peak  amt  lit |      tree peak  amt  lit');
let hOff = 0, tOff = 0;
for (let i = 0; i < 26; i++){
  const H = res.HEAD.rows[i], T = res.tree.rows[i];
  hOff += Math.abs(H.peakH - H.edge); tOff += Math.abs(T.peakH - T.edge);
  console.log(String(H.d).padStart(4) + String(H.sun.toFixed(2)).padStart(6) + String(H.edge.toFixed(2)).padStart(6)
    + String(H.warmth.toFixed(2)).padStart(7) + ' |' + String(H.peakH.toFixed(1)).padStart(10)
    + String(H.peakV.toFixed(2)).padStart(6) + String(H.litEdge).padStart(5) + ' |'
    + String(T.peakH.toFixed(1)).padStart(10) + String(T.peakV.toFixed(2)).padStart(6) + String(T.litEdge).padStart(5));
}
console.log('mean |peak - first light|:  HEAD ' + (hOff / 26).toFixed(2) + ' h   tree ' + (tOff / 26).toFixed(2) + ' h');
const jan = r => r.rows.reduce((a, x) => x.warmth < a.warmth ? x : a);
const jul = r => r.rows.reduce((a, x) => x.warmth > a.warmth ? x : a);
for (const k of ['HEAD', 'tree'])
  console.log(k + ':  AT ITS OWN PEAK  midwinter ' + jan(res[k]).litPeak + '/' + res[k].n + ' stacks (amt '
    + jan(res[k]).peakV.toFixed(2) + ', ' + jan(res[k]).peakH.toFixed(1) + 'h)   midsummer ' + jul(res[k]).litPeak + '/'
    + res[k].n + ' (amt ' + jul(res[k]).peakV.toFixed(2) + ', ' + jul(res[k]).peakH.toFixed(1) + 'h)');

/* 3. the other two terms still work: a wet July afternoon and a snowy dawn. */
const CASES = `() => {
  const out = [];
  const go = (d, h) => __setTime(d * DAY_LEN + ((h - 6 + 24) % 24) / 24 * DAY_LEN);
  /* h === null means "that day's OWN first light": land on the day, then solve the edge
   * there and land again. Reading dawnEdge() before the jump is the stale read this
   * whole iteration is about. */
  const at = (d, h, set) => { go(d, h === null ? 12 : h); if (h === null) go(d, dawnEdge());
    rainFall = 0; snowCover = 0; set(); return +(${HEARTH}).toFixed(3); };
  out.push(['midsummer 15:00, hard rain', at(6, 15, () => { rainFall = 1; })]);
  out.push(['midsummer 21:00, dry',       at(6, 21, () => {})]);
  out.push(['midwinter first light, dry',  at(19, null, () => {})]);
  out.push(['midwinter first light, snow', at(19, null, () => { snowCover = 1; })]);
  out.push(['midsummer first light, dry',  at(6, null, () => {})]);
  out.push(['midsummer 07:00 (HEAD peak)', at(6, 7, () => {})]);
  return out;
}`;
console.log('\n=== 3. the terms that must NOT have moved, and the one that was added ===');
const c = {};
for (const [k, u] of Object.entries(BUILDS)) c[k] = await rd(u, CASES);
for (let i = 0; i < c.HEAD.length; i++)
  console.log('  ' + c.HEAD[i][0].padEnd(28) + ' HEAD ' + c.HEAD[i][1].toFixed(3).padStart(6) + '   tree ' + c.tree[i][1].toFixed(3).padStart(6));

/* 4. the roofline, in pixels. Smoke is isolated by rendering the SAME frame twice on the
 * SAME build with CHIMNEYS emptied — nothing else in drawScene reads it — so the mass is
 * the fire and only the fire, and the same-code floor is measured beside it by rendering
 * the identical frame twice unchanged. */
const PIX = `(inst) => {
  const box = () => {
    let x0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [cx, cy] of CHIMNEYS){ const p = project(cx + 0.5, cy + 0.72, roofZ(cx, cy) + 2.4);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    return [Math.max(0, x0 - 40) | 0, Math.max(0, y1 - 170) | 0,
            Math.min(cv.width, x1 + 60) - Math.max(0, x0 - 40) | 0, 200];
  };
  const shot = (kill) => { const held = kill ? CHIMNEYS.splice(0) : null;
    __reseed(); __setTime(inst.d * DAY_LEN + (((inst.h === null ? inst.solved : inst.h) - 6 + 24) % 24) / 24 * DAY_LEN);
    drawScene(simT, 1 / 30); const d = ctx.getImageData(B[0], B[1], B[2], B[3]).data;
    if (held) { CHIMNEYS.length = 0; CHIMNEYS.push(...held); }   // drawNearRoof re-pushes its own stacks
    return d; };
  __setTime(inst.d * DAY_LEN + 0.25 * DAY_LEN); inst.solved = inst.h === null ? dawnEdge() : inst.h;
  const B = box();                                   // ONE crop, taken while CHIMNEYS is still whole
  const a = shot(false), b2 = shot(false), c2 = shot(true);
  let floor = 0, mass = 0, sum = 0;
  for (let i = 0; i < a.length; i += 4){
    if (Math.abs(a[i] - b2[i]) + Math.abs(a[i+1] - b2[i+1]) + Math.abs(a[i+2] - b2[i+2]) > 12) floor++;
    const dv = Math.abs(a[i] - c2[i]) + Math.abs(a[i+1] - c2[i+1]) + Math.abs(a[i+2] - c2[i+2]);
    if (dv > 12) { mass++; sum += dv; }
  }
  const n = a.length / 4;
  return { px: n, hour: +inst.solved.toFixed(2), smokePx: mass, smokePct: +(100 * mass / n).toFixed(2),
           meanD: mass ? +(sum / mass).toFixed(1) : 0, floorPct: +(100 * floor / n).toFixed(2) };
}`;
console.log('\n=== 4. the roofline in pixels — smoke mass in a 200px band over the stacks ===');
console.log('  ' + 'instant'.padEnd(30) + 'build   hour   smoke px    % of band  mean d  same-code floor');
for (const inst of [{ d: 19, h: null, n: 'midwinter, first light' }, { d: 6, h: 7, n: 'midsummer, 07:00' },
                    { d: 6, h: null, n: 'midsummer, first light' }])
  for (const [k, u] of Object.entries(BUILDS)){
    const r = await rd(u, PIX, inst);
    console.log('  ' + inst.n.padEnd(30) + k.padEnd(7) + String(r.hour).padStart(6) + String(r.smokePx).padStart(11)
      + String(r.smokePct + '%').padStart(13) + String(r.meanD).padStart(8) + String(r.floorPct + '%').padStart(17));
  }

/* 5. the same reading across the year, at each day's OWN first light. One page per build:
 * part 4 measured the same-code floor at 0% for three shots taken this way in one page. */
const ARC = `() => {
  const out = [];
  for (let d = 0; d < 26; d += 2){
    __setTime(d * DAY_LEN + 0.25 * DAY_LEN);
    const h = dawnEdge(), T = d * DAY_LEN + ((h - 6 + 24) % 24) / 24 * DAY_LEN;
    let x0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [cx, cy] of CHIMNEYS){ const p = project(cx + 0.5, cy + 0.72, roofZ(cx, cy) + 2.4);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const B = [Math.max(0, x0 - 40) | 0, Math.max(0, y1 - 170) | 0,
               Math.min(cv.width, x1 + 60) - Math.max(0, x0 - 40) | 0, 200];
    const shot = (kill) => { const held = kill ? CHIMNEYS.splice(0) : null;
      __reseed(); __setTime(T); drawScene(simT, 1 / 30);
      const dd = ctx.getImageData(B[0], B[1], B[2], B[3]).data;
      if (held) { CHIMNEYS.length = 0; CHIMNEYS.push(...held); } return dd; };
    const a = shot(false), c2 = shot(true);
    let mass = 0;
    for (let i = 0; i < a.length; i += 4)
      if (Math.abs(a[i] - c2[i]) + Math.abs(a[i+1] - c2[i+1]) + Math.abs(a[i+2] - c2[i+2]) > 12) mass++;
    out.push({ d, warmth: +warmth.toFixed(2), h: +h.toFixed(2), mass });
  }
  return out;
}`;
console.log('\n=== 5. smoke mass at each day\'s own first light, across the year ===');
const arc = {};
for (const [k, u] of Object.entries(BUILDS)) arc[k] = await rd(u, ARC);
console.log(' day warmth  first light |  HEAD px  tree px');
for (let i = 0; i < arc.HEAD.length; i++){
  const H = arc.HEAD[i], T = arc.tree[i];
  const bar = n => '#'.repeat(Math.round(n / 60));
  console.log(String(H.d).padStart(4) + String(H.warmth.toFixed(2)).padStart(7) + String(T.h.toFixed(2)).padStart(13)
    + ' |' + String(H.mass).padStart(9) + String(T.mass).padStart(9) + '  ' + bar(T.mass));
}

/* 6. the one discontinuity this term could have made worse. `day` increments at hour 6.00
 * — inside the winter morning fire — and the lit set is hash(cx, cy + day*7), so the whole
 * roofline reshuffles there. Pre-existing, but my curve is louder at 6.00 in winter, so
 * measure the size of the step on both builds rather than reasoning about it. */
const STEP = `() => {
  const out = [];
  const set = (d, h) => { __setTime(d * DAY_LEN + ((h - 6 + 24) % 24) / 24 * DAY_LEN);
    rainFall = 0; snowCover = 0;
    const c = Math.min(Math.max(${HEARTH}, 0), 1) * 0.75, on = [];
    for (const [cx, cy] of CHIMNEYS) on.push(hash(cx, cy + day * 7) <= c ? 1 : 0);
    return { on, amt: ${HEARTH}, day }; };
  for (const d of [20, 6]){
    const a = set(d, 5.99), b2 = set(d + (d === 20 ? 1 : 1), 6.01);
    let flip = 0; for (let i = 0; i < a.on.length; i++) if (a.on[i] !== b2.on[i]) flip++;
    out.push({ d, before: a.on.reduce((x, y) => x + y), after: b2.on.reduce((x, y) => x + y),
               flip, amtA: +a.amt.toFixed(3), amtB: +b2.amt.toFixed(3) });
  }
  return out;
}`;
console.log('\n=== 6. the midnight-of-the-day-counter reshuffle at hour 6.00 ===');
for (const [k, u] of Object.entries(BUILDS)){
  const r = await rd(u, STEP);
  for (const q of r) console.log('  ' + k.padEnd(6) + (q.d === 20 ? 'midwinter' : 'midsummer').padEnd(11)
    + 'lit ' + String(q.before).padStart(2) + ' -> ' + String(q.after).padStart(2)
    + '   stacks that flipped ' + String(q.flip).padStart(2) + '   amt ' + q.amtA.toFixed(2) + ' -> ' + q.amtB.toFixed(2));
}
await b.close();
