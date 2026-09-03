#!/usr/bin/env node
/* #160 — the plaza's fourteen places and the ways to them, checked as geometry:
 * every place on PATH, no two within PAIR_GAP + PAIR_MIN, and no leg of any approach
 * from either door passing through the fountain basin. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SRC = resolve(process.argv[2] || 'courtyard.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(SRC).href + '?seed=7&pause');
await page.waitForFunction('typeof __warp === "function"');
const r = await page.evaluate(`(() => {
  const out = {n:PLAZA_PLACES.length, offPath:[], close:[], cut:[], legs:0, kinds:{}, spread:{}};
  const G = (x,y) => grid[(y|0)*GW + (x|0)];
  for (const p of PLAZA_PLACES){
    out.kinds[p.k] = (out.kinds[p.k]||0)+1;
    if (G(p.x,p.y) !== PATH) out.offPath.push([p.k, +p.x.toFixed(2), +p.y.toFixed(2), G(p.x,p.y)]);
  }
  let least = 99;
  for (let i=0;i<PLAZA_PLACES.length;i++) for (let j=i+1;j<PLAZA_PLACES.length;j++){
    const a=PLAZA_PLACES[i], b=PLAZA_PLACES[j], d=Math.hypot(a.x-b.x,a.y-b.y);
    least = Math.min(least, d);
    if (d < PAIR_GAP + PAIR_MIN) out.close.push([a.k,b.k,+d.toFixed(2)]);
  }
  out.least = +least.toFixed(3);
  // the two doors, and the mouth columns the lane band uses
  const doors = [];
  for (const p of PLAZA_PLACES) doors.push([plazaMouth(p), 62.2, p, 'mouth']);
  for (const p of PLAZA_PLACES) doors.push([FAM_LEAD[0][0], FAM_LEAD[0][1], p, 'alley']);
  // and every place-to-place leg, which is what a second act walks
  for (const a of PLAZA_PLACES) for (const b of PLAZA_PLACES) if (a!==b) doors.push([a.x,a.y,b,'act2']);
  for (const [fx,fy,p,tag] of doors){
    const w = plazaWay(fx,fy,p);
    let cx=fx, cy=fy;
    for (const q of w){
      out.legs++;
      const [nx,ny] = segNear(FOUNTAIN.x, FOUNTAIN.y, cx, cy, q[0], q[1]);
      const d = Math.hypot(nx-FOUNTAIN.x, ny-FOUNTAIN.y);
      if (d < 2.0) out.cut.push([tag, p.k, +p.x.toFixed(1), +p.y.toFixed(1), +d.toFixed(2)]);
      cx=q[0]; cy=q[1];
    }
  }
  const xs = PLAZA_PLACES.map(p=>p.x), ys = PLAZA_PLACES.map(p=>p.y);
  out.spread = {x0:Math.min(...xs).toFixed(1), x1:Math.max(...xs).toFixed(1),
                y0:Math.min(...ys).toFixed(1), y1:Math.max(...ys).toFixed(1),
                ysd:+Math.sqrt(ys.map(v=>(v-ys.reduce((s,z)=>s+z,0)/ys.length)**2).reduce((s,z)=>s+z,0)/ys.length).toFixed(2)};
  out.mouth = [Math.min(...PLAZA_PLACES.map(plazaMouth)).toFixed(2), Math.max(...PLAZA_PLACES.map(plazaMouth)).toFixed(2)];
  out.famLeg = {inMax:+FAM_LEG.inMax.toFixed(2), visitMin:+FAM_LEG.visitMin.toFixed(2)};
  return out;
})()`);
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
await browser.close();
console.log(JSON.stringify(r, null, 1));
const bad = r.offPath.length + r.close.length + r.cut.length;
console.log(bad ? `FAIL  offPath ${r.offPath.length}  tooClose ${r.close.length}  throughBasin ${r.cut.length} of ${r.legs} legs`
                : `PASS  ${r.n} places, least separation ${r.least}, ${r.legs} legs all clear of the basin`);
process.exit(bad ? 1 : 0);
