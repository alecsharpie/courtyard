/* probe: (a) does the sill NAME a rig, and (b) what does drawRig actually cost?
 * perf.mjs is vsync-locked, so an overlay drawn 1-6 times a frame is invisible to it —
 * LAWS says time the FUNCTION. Wrapped at the global, summed over 300 pinned draws at a
 * busy hour, at every framing.
 *   node probe-rig-cost.mjs [file]   SEED=… T=…
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEED = +(process.env.SEED || 42), T = +(process.env.T || 570);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(FILE).href + `?pause&seed=${SEED}&t=0`, { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
const r = await page.evaluate(({ T }) => {
  window.__reseed(); window.__warp(T);
  const out = { rigs: TRAFFIC.length, names: [], cost: [] };
  // (a) NAMING: hit the pointer at each rig's own anchor, through the sill's own reader
  for (const t of TRAFFIC){
    const p = project(t.x + t.hx * t.len * 0.35, t.y + t.hy * t.len * 0.35, 0.9);
    out.names.push({ kind: t.kind, dir: t.dir, at: livingAt(p) });
  }
  // (b) COST: the same draw, with and without the rigs, at every framing
  const inner = window.drawRig;
  let ms = 0, calls = 0;
  window.drawRig = function(it){ const a = performance.now(); inner(it); ms += performance.now() - a; calls++; };
  if (window.drawRig === inner) throw new Error('monkeypatch did not take');
  for (let n = 0; n < 5; n++){
    window.__where(n); window.__where(undefined, 9);            // land the camera
    ms = 0; calls = 0;
    const t0 = performance.now();
    for (let k = 0; k < 120; k++) drawScene(simT, 0);
    const whole = performance.now() - t0;
    out.cost.push({ n, rigMs: +(ms / 120).toFixed(3), rigCalls: calls / 120, frameMs: +(whole / 120).toFixed(2),
                    share: +(100 * ms / whole).toFixed(2) });
  }
  return out;
}, { T });
await page.close(); await browser.close();
console.log(`seed ${SEED} t=${T} — ${r.rigs} rigs on the road`);
for (const n of r.names) console.log(`  NAME  ${n.kind} ${n.dir > 0 ? 'east' : 'west'} -> ${JSON.stringify(n.at)}`);
console.log('  framing | drawRig ms/frame  calls  |  whole frame ms | share');
for (const c of r.cost) console.log(`  ${['wide','courtyard','lane','east','river'][c.n].padEnd(9)} | ${String(c.rigMs).padStart(15)} ${String(c.rigCalls).padStart(6)}  | ${String(c.frameMs).padStart(15)} | ${c.share}%`);
if (errs.length) console.log('PAGE ERROR', errs[0]);
