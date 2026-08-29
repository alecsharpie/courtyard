// Run from the repo root (HEAD at /tmp/head.html): node .claude/skills/grow-courtyard/probes/wet-year.mjs
// Wetness: find the first summer shower (seed 7), sample plaza + lane paving brightness
// vs HEAD 1 h after it ends, time to byte-identical ground, and a night lamp bar on wet paving.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function open(file){ const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', file, e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause'); await p.waitForFunction(() => window.__warp); return p; }
// 1) on the tree: find a shower in summer (days 5..9), log wetness curve
const p = await open('courtyard.html');
const r = await p.evaluate(() => {
  window.__reseed(); window.__warp(275);
  let endT = -1, startT = -1, log = [], maxStep = 0, prev = wetness;
  for (let i = 0; i < 55 * 5 / 0.05 && endT < 0; i++){
    window.__warp(0.05);
    if (raining && startT < 0) startT = simT;
    if (startT > 0 && !raining && rainFall === 0 && endT < 0) endT = simT;
    maxStep = Math.max(maxStep, Math.abs(wetness - prev)); prev = wetness;
  }
  if (endT < 0) return { none: true };
  const endWet = wetness, endHour = hour, endDay = day, ww = warmth;
  let dryT = -1; const H = 55 / 24;
  for (let i = 0; i < 55 * 2 / 0.05; i++){ window.__warp(0.05); log.push([+( (simT - endT) / H).toFixed(2), +wetness.toFixed(3)]);
    if (wetness === 0){ dryT = simT; break; } }
  return { startT, endT, showerH: +((endT - startT) / H).toFixed(2), endWet: +endWet.toFixed(3), endHour: +endHour.toFixed(2), endDay, warmth: +ww.toFixed(2),
           dryH: dryT > 0 ? +((dryT - endT) / H).toFixed(2) : null, maxStepPerH: +(maxStep / 0.05 * H).toFixed(3),
           curve: log.filter((_, k) => k % 8 === 0).map(x => x.join(':')).join(' ') };
});
console.log('shower', JSON.stringify(r));
await p.close();
if (r.none){ await b.close(); process.exit(1); }
// 2) paving brightness at endT + 1 h, HEAD vs tree; and ground hash at endT + 3.5 h vs a never-rained control
async function sample(file, T){
  const q = await open(file);
  const out = await q.evaluate((T) => { window.__reseed(); window.__warp(T - 1/30); window.__warp(1/30); drawScene(simT, 1/30);
    const mean = (x0, x1, y0, y1) => { let s = 0, n = 0; for (let y = y0; y < y1; y += 0.5) for (let x = x0; x < x1; x += 0.5){
      const t = grid[Math.floor(y) * GW + Math.floor(x)]; if (t !== PATH && t !== SIDE && t !== ROAD) continue;
      const [sx, sy] = project(x, y, 0); const d = ctx.getImageData(Math.round(sx * DPR), Math.round(sy * DPR), 1, 1).data; s += d[0] + d[1] + d[2]; n++; } return +(s / n / 3).toFixed(1); };
    const g = gtx.getImageData(0,0,gcv.width,gcv.height).data; let hg=0; for (let i=0;i<g.length;i+=4){ hg=(hg*31 + g[i] + g[i+1]*7 + g[i+2]*13)|0; }
    return { hour: +hour.toFixed(2), wet: +(typeof wetness === 'number' ? wetness : -1).toFixed(3), plaza: mean(PLAZA_X0, PLAZA_X1, 40, 58), lane: mean(10, 60, LN_WALK_N, LN_WALK_S), cross: mean(XS_W0, XS_E1, 10, 50), grass: mean(70, 100, 10, 30), groundHash: hg, lb: lightBucket }; }, T);
  await q.close(); return out;
}
const H = 55 / 24;
for (const dt of [1, 3.5]){
  const T = r.endT + dt * H;
  console.log('+' + dt + 'h HEAD', JSON.stringify(await sample('/tmp/head.html', T)));
  console.log('+' + dt + 'h TREE', JSON.stringify(await sample('courtyard.html', T)));
}
// 3) a night frame while wet: force wetness, count warm pixels under a lane lamp vs dry
const q = await open('courtyard.html');
const night = await q.evaluate(() => {
  window.__reseed(); window.__warp(330 + 55 * (23 - 6) / 24);   // ~23:00 summer day 6
  const bar = () => { const L = LANE_LAMPS[1]; const [sx, sy] = project(L[0], L[1] + 2.0, 0); const d = ctx.getImageData(Math.round(sx*DPR), Math.round(sy*DPR), 1, 1).data; return [d[0], d[1], d[2]]; };
  const plazaLamp = () => { const L = LANE_LAMPS[9]; const [sx, sy] = project(L[0], L[1] + 2.0, 0); const d = ctx.getImageData(Math.round(sx*DPR), Math.round(sy*DPR), 1, 1).data; return [d[0], d[1], d[2]]; };
  wetness = 0; groundDirty = true; drawScene(simT, 1/30); const dry = bar(), dryP = plazaLamp();
  wetness = 1; groundDirty = true; drawScene(simT, 1/30); const wet = bar(), wetP = plazaLamp();
  return { hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), laneDry: dry, laneWet: wet, plazaDry: dryP, plazaWet: wetP, wetLamps: WET_LAMPS.length, allLamps: LAMPS.length + LANE_LAMPS.length };
});
console.log('night', JSON.stringify(night));
await q.close(); await b.close();
