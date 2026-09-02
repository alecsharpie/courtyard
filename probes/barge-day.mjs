/* what the census cannot see: does the barge exist at all, on what days, at what hours,
 * and where is her hull each step. Pinned seed, paused page, __warp()ed by hand. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(join(process.cwd(), 'courtyard.html')).href;
const seed = +(process.argv[2] || 7), days = +(process.argv[3] || 14);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 700 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto(PAGE + `?pause&seed=${seed}`);
await pg.waitForFunction('window.__census && window.__entities');
const res = await pg.evaluate(async (days) => {
  window.__reseed();
  const out = [];
  const STEP = 0.25;
  for (let i = 0; i < days * 55 / STEP; i++){
    window.__warp(STEP);
    const e = window.__entities().find(o => o.kind === 'barge');
    const c = window.__census().clock;
    out.push(e ? { d: c.day, h: c.hour, leg: e.act, x: e.x, y: +e.y.toFixed(3), load: e.load, aboard: e.aboard }
               : { d: c.day, h: c.hour, leg: null });
  }
  return { rows: out, speed: BARGE_SPEED, hw: BARGE_HW, hh: BARGE_HH };
}, days);
const rows = res.rows, SPEED = res.speed;
if (!Number.isFinite(SPEED)) { console.log('PROBE BROKEN: BARGE_SPEED did not come back'); process.exit(1); }
await b.close();
if (errs.length) { console.log('PAGE ERRORS', errs.slice(0,3)); process.exit(1); }
// per-day summary
const byDay = new Map();
for (const r of rows){ if (!byDay.has(r.d)) byDay.set(r.d, []); byDay.get(r.d).push(r); }
let visits = 0;
for (const [d, rs] of byDay){
  const on = rs.filter(r => r.leg);
  if (!on.length) { continue; }
  visits++;
  const legs = {}; for (const r of on) legs[r.leg] = (legs[r.leg]||0)+1;
  const work = on.filter(r => r.leg === 'work');
  console.log(`day ${String(d).padStart(2)}  present ${String(on.length*0.25).padStart(5)}s  ` +
    `first ${on[0].h.toFixed(2)}h last ${on[on.length-1].h.toFixed(2)}h  ` +
    `legs in/work/out ${legs.in||0}/${legs.work||0}/${legs.out||0}  ` +
    `y ${Math.min(...on.map(r=>r.y)).toFixed(2)}..${Math.max(...on.map(r=>r.y)).toFixed(2)}  ` +
    `load ${work.length? work[0].load+'->'+work[work.length-1].load : '-'}`);
}
console.log(`\nseed ${seed}: ${visits} barge visits in ${byDay.size} days  (${(visits/byDay.size*100).toFixed(0)}%)`);
// continuity: no y jump bigger than STEP*speed*1.5, no NaN
let worst = 0, nan = 0, teleport = 0;
for (let i = 1; i < rows.length; i++){
  const a = rows[i-1], c = rows[i];
  if (!a.leg || !c.leg) continue;
  if (!Number.isFinite(c.y)) { nan++; continue; }
  const d = Math.abs(c.y - a.y);
  if (d > worst) worst = d;
  if (d > 0.2667 * SPEED * 1.02) teleport++;   // __warp advances WHOLE fixed-dt steps: 8 x 1/30 s, not 0.25
}
console.log(`continuity: worst y step ${worst.toFixed(4)} cells (one warp step at BARGE_SPEED ${SPEED} = ${(0.2667*SPEED).toFixed(4)}), NaN ${nan}, teleports ${teleport}`);
// the gate has to be able to FIRE: the same test at half the true step must flag the run
let sanity = 0;
for (let i = 1; i < rows.length; i++){ const a = rows[i-1], c = rows[i];
  if (a.leg && c.leg && Math.abs(c.y - a.y) > 0.2667 * SPEED * 0.5) sanity++; }
console.log(`  (control: the same test at HALF the step flags ${sanity} — so a real teleport would be seen)`);
const xs = rows.filter(r => r.leg).map(r => r.x);
console.log(`hull x: ${Math.min(...xs).toFixed(3)} +- ${res.hw} = ${(Math.min(...xs)-res.hw).toFixed(2)}..${(Math.max(...xs)+res.hw).toFixed(2)}  (quay wall 114.0, rowboat spawns >=116.5, swans clamp >=115.6)`);
const ys = rows.filter(r => r.leg).map(r => r.y);
console.log(`hull y: ${Math.min(...ys).toFixed(2)}..${Math.max(...ys).toFixed(2)} -> south tip ${(Math.max(...ys)+res.hh).toFixed(2)}  (footbridge DECK row 30, boatUnderDeck from 28.7)`);
