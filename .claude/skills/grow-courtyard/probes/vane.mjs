/* The weathervanes (#83): force windF/windSign and read each arrow's projected tip x;
 * calm within a few degrees of rest; full wind mirror headings; crops at both signs;
 * wide-frame hash IDENTICAL to HEAD with windF -> 0, vaneWob -> 0 and the church vane off.
 *   node probe-vane.mjs */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HEAD = '/tmp/courtyard-head.html', HERE = resolve('courtyard.html');
const b = await chromium.launch();
async function open(file){ const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=7&t=0'); await p.waitForFunction(() => window.__warp); return p; }
const frame = `(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))()`;
const hashFrame = `(() => { const cv = document.querySelector('canvas'), d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + d[i] + d[i+1] * 7 + d[i+2] * 13) >>> 0; return s; })()`;

// (a) headings: pin noon of day 2, force the wind, read each vane's tip
const p = await open(HERE);
const heads = await p.evaluate(async () => {
  window.__reseed(); window.__warp(2 * 55 + 6); // a daylit instant
  const out = [];
  const tip = v => { const th = vaneAngle(v), c = project(v.x, v.y, v.z), ex = project(v.x + 1, v.y, v.z), ey = project(v.x, v.y + 1, v.z);
    const sx = ex[0] - c[0]; const ux = (Math.cos(th) * sx - Math.sin(th) * (ey[0] - c[0])) / sx, uy = (-Math.sin(th) * (ey[1] - c[1])) / sx;
    return { deg: +(th * 180 / Math.PI).toFixed(1), tipDx: +(v.len * ux).toFixed(2), tipDy: +(v.len * uy).toFixed(2) }; };
  for (const [w, s] of [[0, 1], [0, -1], [0.5, 1], [0.5, -1], [1, 1], [1, -1]]){
    windF = () => w; windSign = s;
    out.push({ w, s, ct: tip(VANES[0]), church: tip(VANES[1]), wobMax: +(VANE_WOB * (1 - w) * 180 / Math.PI).toFixed(1) });
  }
  return out;
});
for (const h of heads) console.log(`windF ${h.w} sign ${h.s > 0 ? '+1 (west wind)' : '-1 (east wind)'}: clock ${h.ct.deg}° tip (${h.ct.tipDx}, ${h.ct.tipDy})  church ${h.church.deg}° tip (${h.church.tipDx}, ${h.church.tipDy})  wobble ±${h.wobMax}°`);
const calm = heads.filter(h => h.w === 0), full = heads.filter(h => h.w === 1);
console.log('calm within a few degrees of rest:', calm.every(h => Math.abs(h.ct.deg) <= 8.1 && Math.abs(h.church.deg) <= 8.1) ? 'PASS' : 'FAIL');
console.log('full wind mirror (tip x):', full[0].ct.tipDx < -4 && full[1].ct.tipDx > 4 && Math.abs(full[0].ct.tipDx + full[1].ct.tipDx) < 0.05 ? 'PASS' : 'FAIL');
await p.close();

// (b) crops at the two signs, windy noon, and a calm control
for (const [name, w, s] of [['calm', 0, 1], ['west', 1, 1], ['east', 1, -1]]){
  const q = await open(HERE);
  const box = await q.evaluate(async ([w, s]) => { window.__reseed(); window.__warp(2 * 55 + 6); windF = () => w; windSign = s; vaneWob = () => 0;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const r = document.querySelector('canvas').getBoundingClientRect();
    return VANES.map(v => { const c = project(v.x, v.y, v.z); return { x: r.left + c[0] - 40, y: r.top + c[1] - 30, width: 80, height: 60 }; }); }, [w, s]);
  await q.screenshot({ path: `shots/b81-vane-clock-${name}.png`, clip: box[0] });
  await q.screenshot({ path: `shots/b81-vane-church-${name}.png`, clip: box[1] });
  await q.close();
}
console.log('crops: shots/b81-vane-{clock,church}-{calm,west,east}.png');

// (c) identity: same instant on HEAD and HERE, wind forced calm, wobble at rest, church vane off
const hs = [];
for (const file of [HEAD, HEAD, HERE]){
  const q = await open(file);
  hs.push(await q.evaluate(async isHere => { window.__reseed(); windF = () => 0; if (isHere){ vaneWob = () => 0; VANES.length = 1; }
    window.__warp(2 * 55 + 6 - 1/30); window.__warp(1/30); drawScene(simT, 1/30);   // pinned draw, no rAF (probes/noon-identical.mjs)
    const d = ctx.getImageData(0,0,W*DPR,H*DPR).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + d[i] + d[i+1] * 7 + d[i+2] * 13) >>> 0; return s; }, file === HERE));
  await q.close();
}
console.log('wide hash HEAD', hs[0], hs[1], 'HERE', hs[2], hs[0] !== hs[1] ? 'HEAD UNSTABLE' : hs[0] === hs[2] ? 'IDENTICAL' : 'DIFFERENT');
// (d) the same with the wobble LIVE must differ (the predicate fired)
{
  const q = await open(HERE);
  const h = await q.evaluate(async () => { window.__reseed(); windF = () => 0; VANES.length = 1; window.__warp(2 * 55 + 6 - 1/30); window.__warp(1/30); drawScene(simT, 1/30);
    const d = ctx.getImageData(0,0,W*DPR,H*DPR).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + d[i] + d[i+1] * 7 + d[i+2] * 13) >>> 0; return { s, wob: +(vaneWob(VANES[0]) * 180 / Math.PI).toFixed(2) }; });
  console.log('wobble live:', h.wob + '°', h.s === hs[0] ? 'SAME as HEAD (predicate did not fire!)' : 'differs from HEAD (fired)');
  await q.close();
}
await b.close();
