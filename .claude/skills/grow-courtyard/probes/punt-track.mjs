#!/usr/bin/env node
/* punt-track — b154: the swans give way to a hull's whole TRACK, not to its landing.
 *
 *   node punt-track.mjs [--seeds 10] [--days 26] [--shot] [file]
 *
 * #96 cleared the LANDING POINT — nothing white sits where a beached hull lies. But a
 * hull off its mooring is a MOVER, and two movers on a track share a CORRIDOR: swept
 * end to end, a swan reached 1.03 cells of a hull under way, inside the 1.2 the landing
 * rule already promised. This sweeps every co-present instant of every crossing and
 * reports the least separation, per hull and per leg, with the worst instants named.
 *
 * It also checks the GEOMETRIC claim the fix rests on: both tracks run east of the
 * swans' own x-clamp, which is why "west is open water" is always a legal give-way. A
 * build that moved a berth or a landing west would break that, and this says so.
 *
 * --shot photographs the closest approach it finds, so the number has a picture.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? +process.argv[i + 1] : d; };
const fileArg = process.argv.find((s, i) => i > 1 && !s.startsWith('--') && s.endsWith('.html'));
const FILE = resolve(fileArg || resolve(HERE, '../../../../courtyard.html'));
const NS = arg('--seeds', 10), NDAYS = arg('--days', 26), DAY0 = arg('--day0', 5);
const SHOT = process.argv.includes('--shot');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77].slice(0, NS);
const GIVE = 1.2;   // what the landing rule has always promised
/* puntGiveWay sets the separation to EXACTLY PUNT_GIVE, and a shove to exactly d lands
 * a few ulps either side of it. The claim is "at least 1.2", so the gate is too: an
 * epsilon here, and the least separation printed at full precision so a REAL breach —
 * which is a shove that never happened, and so is short by tenths — cannot hide in it. */
const EPS = 1e-9;

const br = await chromium.launch();
let geom = null, samples = 0, best = null;
const MIN = {}, UNDER = {}, WORST = [];
for (const seed of SEEDS){
  const p = await br.newPage({ viewport:{ width:1600, height:950 }, deviceScaleFactor: SHOT ? 2 : 1 });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const out = await p.evaluate(new Function('A', 'const {DAY0,NDAYS,GIVE,EPS}=A;' + `
  window.__reseed(); window.__warp(DAY0 * 55 - simT);
  // the geometry the give-way rests on: every track east of the swans' own water
  const sx1 = typeof SWAN_X1 !== 'undefined' ? SWAN_X1 : RIVER_X1 - 1.6;
  const geom = PUNTS.map((P, i) => ({hull:i, minX:+Math.min(P.b.moor.x, P.b.land.x).toFixed(2), swanX1:+sx1.toFixed(2)}));
  const min = {}, under = {}, worst = []; let samples = 0, best = null;
  const key = (h, l) => 'hull' + h + '/leg' + l;
  for (let i = 0; day < DAY0 + NDAYS; i++){
    window.__warp(0.05);
    PUNTS.forEach((P, hi) => {
      if (!P.leg) return;
      swans.forEach((s, si) => {
        const d = Math.hypot(P.x - s.x, P.y - s.y);
        const k = key(hi, P.leg);
        samples++;
        if (min[k] === undefined || d < min[k]) min[k] = d;
        if (d < GIVE - EPS){ under[k] = (under[k] || 0) + 1;
          if (worst.length < 6) worst.push({day, hour:+hour.toFixed(2), hull:hi, leg:P.leg, swan:si, d:+d.toFixed(3),
                                            P:[+P.x.toFixed(2), +P.y.toFixed(2)], s:[+s.x.toFixed(2), +s.y.toFixed(2)]}); }
        if (!best || d < best.d) best = {t:simT, d:+d.toFixed(6), day, hour:+hour.toFixed(2), hull:hi, leg:P.leg};
      });
    });
  }
  for (const k in min) min[k] = +min[k].toFixed(6);
  return {geom, min, under, worst, samples, best};`), { DAY0, NDAYS, GIVE, EPS });
  geom = out.geom; samples += out.samples;
  for (const k in out.min) MIN[k] = Math.min(MIN[k] ?? 9, out.min[k]);
  for (const k in out.under) UNDER[k] = (UNDER[k] || 0) + out.under[k];
  WORST.push(...out.worst.map(o => ({ seed, ...o })));
  if (out.best && (!best || out.best.d < best.d)) best = { seed, ...out.best };
  console.log(`seed ${seed}: ${out.samples} co-present samples, least ${out.best ? out.best.d : 'n/a'}`);
  await p.close();
}

console.log(`\n=== ${FILE.split('/').pop()} · ${SEEDS.length} seeds x ${NDAYS} days · ${samples} swan x hull-under-way samples ===`);
let geomOK = true;
for (const g of geom){
  const ok = g.minX > g.swanX1;
  if (!ok) geomOK = false;
  console.log(`  hull${g.hull} track least x ${g.minX} vs SWAN_X1 ${g.swanX1}  ${ok ? 'EAST of the swans’ water — west is open' : 'INSIDE the swans’ water — the west fallback is NOT free'}`);
}
console.log(`\n  track/leg          least separation   samples under ${GIVE}`);
for (const k of Object.keys(MIN).sort())
  console.log(`  ${k.padEnd(18)} ${MIN[k].toFixed(6).padStart(12)}       ${String(UNDER[k] || 0).padStart(6)}`);
const least = Math.min(...Object.values(MIN)), breaches = Object.values(UNDER).reduce((a, b) => a + b, 0);
console.log(`\nleast swan-to-hull separation, swept end to end: ${least.toFixed(6)}  (the landing rule promises ${GIVE})`);
console.log(`samples inside it: ${breaches}${WORST.length ? '\n  e.g. ' + JSON.stringify(WORST.slice(0, 3)) : ''}`);
console.log(`closest approach overall: ${JSON.stringify(best)}`);

if (SHOT && best){
  const p = await br.newPage({ viewport:{ width:1600, height:950 }, deviceScaleFactor:2 });
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${best.seed}`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  await p.waitForTimeout(1200);
  await p.evaluate(new Function('T', `window.__reseed(); window.__warp(T - simT); drawScene(simT, 1/30);`), best.t);
  await p.screenshot({ path: resolve(HERE, '../../../../shots/punt-track-closest.png'),
                       clip:{ x:820, y:120, width:520, height:560 } });
  console.log('shot -> shots/punt-track-closest.png');
  await p.close();
}
await br.close();
if (!geomOK){ console.log('\nFAIL: a track runs inside the swans’ own water — puntGiveWay’s west fallback is not guaranteed open.'); process.exit(1); }
if (breaches){ console.log(`\nFAIL: ${breaches} samples inside ${GIVE}.`); process.exit(1); }
console.log('\nOK — no swan gets inside the landing rule’s own clearance of any hull under way.');
