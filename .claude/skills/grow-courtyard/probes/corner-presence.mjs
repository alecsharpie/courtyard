/* How dead is the SE corner, and does anything cross the candidate frame yard?
 * Presence, sampled by identity every 0.25 s of warped sim time — the motion gate's
 * own cadence — over 6 seeds x 2 garden-days. Reports, per corner box:
 *   samples  = entity-samples inside the box
 *   ids      = distinct entities that were ever inside it
 * and, for the candidate rectangle only, which ROLES cross it.
 * Usage: node probe-corner-traffic.mjs [--rect x0,y0,x1,y1]
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const rectArg = (argv.find(a => a.startsWith('--rect=')) || '').slice(7);
const CAND = rectArg ? rectArg.split(',').map(Number) : [47.9, 46.9, 57.1, 57.1];

const BOXES = {
  'garden       ': [3, 3, 61, 61],
  'NW corner    ': [3, 3, 20, 20],
  'NE corner    ': [44, 3, 61, 20],
  'SW corner    ': [3, 44, 20, 61],
  'SE corner    ': [44, 44, 61, 61],
  'CANDIDATE    ': CAND,
};
const SEEDS = (argv.find(a=>a.startsWith("--seeds=")) || "--seeds=1,7,42,99,123,777").slice(8).split(",").map(Number);
const STEP = 0.25, SPAN = +((argv.find(a=>a.startsWith("--span=")) || "--span=110").slice(7));   // two days of sim, sampled every 0.25 s

const b = await chromium.launch();
const tally = {}, ids = {}, roles = {};
for (const k of Object.keys(BOXES)){ tally[k] = 0; ids[k] = new Set(); roles[k] = {}; }
let total = 0;
for (const seed of SEEDS){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + `?seed=${seed}&pause&t=0`);
  await p.waitForFunction('window.__census');
  const rows = await p.evaluate(({ STEP, SPAN }) => {
    window.__reseed(); window.__setTime(0);
    const out = [];
    for (let t = 0; t < SPAN; t += STEP){
      window.__warp(STEP, STEP);
      for (const e of window.__entities()) out.push([e.kind, e.role || '', e.x, e.y]);
    }
    return out;
  }, { STEP, SPAN });
  for (const [kind, role, x, y] of rows){
    total++;
    for (const [k, [x0, y0, x1, y1]] of Object.entries(BOXES)){
      if (x >= x0 && x < x1 && y >= y0 && y < y1){
        tally[k]++; ids[k].add(seed + kind + role);
        const r = kind + (role ? ':' + role : '');
        roles[k][r] = (roles[k][r] || 0) + 1;
      }
    }
  }
  await p.close();
}
await b.close();
console.log(`${SEEDS.length} seeds x ${SPAN}s (${SPAN/55} days), ${total} entity-samples\n`);
console.log('box              samples   share      per-seed');
for (const [k, v] of Object.entries(tally))
  console.log(`${k}  ${String(v).padStart(7)}  ${(100*v/total).toFixed(3)}%  ${(v/SEEDS.length).toFixed(1)}`);
for (const k of ['SE corner    ','CANDIDATE    ']){
  console.log('\n' + k.trim() + ' roles:');
  const e = Object.entries(roles[k]).sort((a,b)=>b[1]-a[1]);
  if (!e.length) console.log('  (nothing, in any seed)');
  for (const [r,n] of e) console.log(' ', r.padEnd(22), n);
}
console.log('\nCANDIDATE rect', CAND.join(','), '— what is in it:');
const rr = Object.entries(roles['CANDIDATE    ']).sort((a,b) => b[1]-a[1]);
if (!rr.length) console.log('  (nothing, in any seed)');
for (const [r, n] of rr) console.log(' ', r.padEnd(22), n);
