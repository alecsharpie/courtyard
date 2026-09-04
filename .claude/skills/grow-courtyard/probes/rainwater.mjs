#!/usr/bin/env node
/* #213 — the rainwater goods. Three questions, one page each.
 *   1. STRUCTURE: how many pipes the register cut, where, and off which line — party
 *      wall or end of run. A number for the "vertical rhythm" claim.
 *   2. THE FOOT: does the flag under a pipe hold water SOONER than the flag beside it?
 *      pudDepth's fill threshold is lerp(PUD_HI, PUD_LO, hollow), so the question is a
 *      wetness: at what wetF() does each cell first hold, feet vs their own paved
 *      neighbours. Inverting the page's own arithmetic, and asserting the bias fired.
 *   3. PIXELS at the SHIPPING size (1600x950 wide), wet day and dry day, candidate vs
 *      HEAD, quoted as a ratio to a SAME-CODE control run of the identical page.
 * Usage: node probe-rainwater.mjs
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const HEAD = '/tmp/probe-head-213.html';
writeFileSync(HEAD, execSync('git show HEAD:courtyard.html', { maxBuffer: 1 << 28 }));
const b = await chromium.launch();
const SEEDS = [7, 42, 1234];
const DAY = 55, T0 = 330 + DAY * 13 / 24;     // early afternoon, so the light is not the variable

/* ---------- 1 + 2: structure and the foot ---------- */
async function structure(file, seed){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    const has = typeof PIPES !== 'undefined';
    // every facade cell in the drawn band, off drawFaceRow's own test
    let faces = 0;
    for (let y = 0; y < 65; y++) for (let x = 0; x < GW; x++)
      if (solidM[y * GW + x] && !solidC(x, y + 1)) faces++;
    if (!has) return { has, faces, puddles: PUDDLES.length };
    const rows = {}; let party = 0, end = 0, pavedFeet = 0;
    for (const q of PIPES){
      rows[q.y] = (rows[q.y] || 0) + 1;
      const nb = q.x < GW && solidM[q.y * GW + q.x] && !solidC(q.x, q.y + 1);
      if (nb) party++; else end++;
      if (pavedAt(q.x - 1, q.y + 1)) pavedFeet++;
    }
    // the fill threshold, straight off pudDepth: a cell holds once wetness passes it
    const thr = h => PUD_HI + (PUD_LO - PUD_HI) * Math.min(1, h);
    const foot = [], beside = [];
    const pud = new Map(PUDDLES.map(q => [q.i, q]));
    for (const q of PIPES){
      const fx = q.x - 1, fy = q.y + 1, i = fy * GW + fx;
      if (!pavedAt(fx, fy)) continue;
      const pq = pud.get(i); if (!pq) continue;
      foot.push(thr(pq.hollow));
      // its own paved neighbours in the same row, 2..4 cells either side: the same
      // stone, the same fall, no pipe over it
      for (const dx of [-4, -3, -2, 2, 3, 4]){
        const nx = fx + dx; if (nx < 0 || nx >= GW || !pavedAt(nx, fy)) continue;
        if (pipeFoot[fy * GW + nx]) continue;
        beside.push(thr(pudHollow[fy * GW + nx]));       // 0 hollow -> threshold PUD_HI, never holds
      }
    }
    const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
    const holds = (a, w) => a.filter(v => v <= w).length / (a.length || 1);
    return { has, faces, eaves: EAVES.length, pipes: PIPES.length, party, end, pavedFeet,
             rows: Object.entries(rows).map(([k, v]) => k + ':' + v).join(' '),
             puddles: PUDDLES.length, footN: foot.length, besideN: beside.length,
             footThr: mean(foot), besideThr: mean(beside),
             at: [0.30, 0.45, 0.60, 0.80].map(w => [w, holds(foot, w), holds(beside, w)]) };
  });
  await p.close();
  return out;
}

console.log('=== 1/2  structure and the foot ===');
for (const seed of SEEDS){
  const h = await structure(HEAD, seed), c = await structure('courtyard.html', seed);
  console.log(`seed ${seed}: facade cells ${h.faces} (HEAD) / ${c.faces} (cand)  ` +
              `guttered ${c.eaves}, pipes ${c.pipes} = ${c.party} party + ${c.end} end-of-run, ${c.pavedFeet} feet on paving`);
  console.log(`  PUDDLES ${h.puddles} -> ${c.puddles}   fill threshold at a foot ${c.footThr?.toFixed(3)} ` +
              `(n=${c.footN}) vs beside it ${c.besideThr?.toFixed(3)} (n=${c.besideN})  [lower = holds sooner]`);
  console.log('  share holding at wetF: ' + c.at.map(([w, f, bs]) =>
              `${w.toFixed(2)} foot ${(f * 100).toFixed(0)}% beside ${(bs * 100).toFixed(0)}%`).join(' | '));
  if (h.faces !== c.faces) console.log('  !! FOOTPRINT MOVED — facade cell count changed');
}

/* ---------- 3: pixels at the shipping size ---------- */
async function frame(file, seed, t, wet, tag){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  const px = await p.evaluate(([t, wet]) => {
    window.__reseed(); window.__warp(t);
    // invert the page's own weather, term for term, and assert it landed
    if (wet){ raining = true; rainFall = 1; rainLeft = 40; wetness = 0.85;
              if (typeof runoff === 'number') runoff = wet === 2 ? 0 : 1; }
    else { raining = false; rainFall = 0; rainLeft = 0; wetness = 0; if (typeof runoff === 'number') runoff = 0; }
    groundDirty = true;
    drawScene(simT, 0);                       // pinned dt, and read in the SAME evaluate
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    return { buf: Array.from(d), w: cv.width, h: cv.height,
             landed: { wetness, raining, runoff: typeof runoff === 'number' ? runoff : null } };
  }, [t, wet]);
  await p.close();
  return px;
}
function diff(a, b){
  let n = 0, sum = 0, mx = 0;
  for (let i = 0; i < a.buf.length; i += 4){
    const d = (Math.abs(a.buf[i] - b.buf[i]) + Math.abs(a.buf[i+1] - b.buf[i+1]) + Math.abs(a.buf[i+2] - b.buf[i+2])) / 3;
    if (d >= 2){ n++; sum += d; mx = Math.max(mx, d); }
  }
  return { px: n, mean: n ? sum / n : 0, max: mx };
}
console.log('\n=== 3  pixels, 1600x950 wide, seed 7, t=13.00 ===');
for (const [wet, name] of [[1, 'WET  '], [0, 'DRY  ']]){
  const h = await frame(HEAD, 7, T0, wet);
  const c = await frame('courtyard.html', 7, T0, wet);
  const ctl = await frame('courtyard.html', 7, T0, wet);     // same code, same pin: the floor
  const d = diff(h, c), f = diff(c, ctl);
  console.log(`${name} landed ${JSON.stringify(c.landed)}`);
  console.log(`  cand vs HEAD  ${String(d.px).padStart(6)} px  Δ${d.mean.toFixed(1)} mean  Δ${d.max.toFixed(0)} max`);
  console.log(`  same-code ctl ${String(f.px).padStart(6)} px  -> ratio ${f.px ? (d.px / f.px).toFixed(1) : '∞'}`);
}
/* the WATER's own mass: the candidate with its one BEHAVIOUR change backed out. Same
 * build, same weather, same fabric — runoff pinned to 0. Everything left is drawRunoff. */
{
  const wetOn = await frame('courtyard.html', 7, T0, 1);
  const wetOff = await frame('courtyard.html', 7, T0, 2);    // 2 = wet stone, dry gutters
  const d = diff(wetOn, wetOff);
  console.log(`\nRUNOFF alone (fabric held, runoff 1 -> 0, landed ${JSON.stringify(wetOff.landed)}):`);
  console.log(`  ${String(d.px).padStart(6)} px  Δ${d.mean.toFixed(1)} mean  Δ${d.max.toFixed(0)} max   (same-code floor 0 px)`);
}
/* THE BAR. A new wet-weather system's mass means nothing on its own, so kill the SHIPPED
 * one the same way and read its mass at the same size in the same frame: PUDDLES emptied
 * on the same wet day is what #122's standing water is worth, and the runoff is quoted
 * against it. */
{
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate((t) => {
    const grab = () => { drawScene(simT, 0); return ctx.getImageData(0, 0, cv.width, cv.height).data; };
    window.__reseed(); window.__warp(t);
    raining = true; rainFall = 1; rainLeft = 40; wetness = 0.85; runoff = 1; groundDirty = true;
    const on = grab();
    const kept = PUDDLES.splice(0), n = kept.length;      // the incumbent, killed the same way
    const off = grab();
    PUDDLES.push(...kept);
    let px = 0, sum = 0;
    for (let i = 0; i < on.length; i += 4){
      const dd = (Math.abs(on[i]-off[i]) + Math.abs(on[i+1]-off[i+1]) + Math.abs(on[i+2]-off[i+2])) / 3;
      if (dd >= 2){ px++; sum += dd; }
    }
    return { n, px, mean: px ? sum / px : 0 };
  }, T0);
  await p.close();
  console.log(`PUDDLES alone, same frame (the shipped incumbent, ${r.n} pools killed):`);
  console.log(`  ${String(r.px).padStart(6)} px  Δ${r.mean.toFixed(1)} mean`);
}

/* ---------- 4: cost, timed at the FUNCTION in its own weather ----------
 * perf.mjs is vsync-locked and cannot see a pass that only runs in rain. Both halves are
 * timed: drawRunoff, which is per-frame and only in a shower, and drawGround, which now
 * carries 73 pipes and a gutter on every facade cell and rebuilds on the light. */
for (const [file, tag] of [[HEAD, 'HEAD'], ['courtyard.html', 'cand']]){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate((t) => {
    window.__reseed(); window.__warp(t);
    raining = true; rainFall = 1; rainLeft = 40; wetness = 0.85;
    if (typeof runoff === 'number') runoff = 1;
    const time = (f, n) => { f(); f(); const t0 = performance.now(); for (let i = 0; i < n; i++) f(); return (performance.now() - t0) / n; };
    const gnd = time(() => drawGround(), 12);
    const run = typeof drawRunoff === 'function' ? time(() => { drawRunoff(ctx, 0, 61); drawRunoff(ctx, 61, 65); }, 200) : 0;
    return { gnd, run };
  }, T0);
  await p.close();
  console.log(`${tag}: drawGround ${r.gnd.toFixed(1)} ms · drawRunoff (both calls, in rain) ${r.run.toFixed(3)} ms`);
}

/* ---------- 5: 390x844, the tracked mobile framing ---------- */
for (const [wet, name] of [[1, 'wet'], [0, 'dry']]){
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const err = [];
  p.on('pageerror', e => err.push(String(e)));
  await p.evaluate(([t, wet]) => {
    window.__reseed(); window.__warp(t);
    if (wet){ raining = true; rainFall = 1; rainLeft = 40; wetness = 0.85; runoff = 1; }
    groundDirty = true; drawScene(simT, 0);
  }, [T0, wet]);
  await p.screenshot({ path: `shots/rw-mobile-${name}.png` });
  await p.close();
  console.log(`mobile 390x844 ${name}: ${err.length ? 'ERRORS ' + err.join(';') : 'no page errors'}`);
}
await b.close();
