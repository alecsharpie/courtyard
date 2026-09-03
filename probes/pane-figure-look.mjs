/* pane-figure-look.mjs — what does somebody at a window actually LOOK like, and how much
 * does the figure pass move?
 *
 * These panes are ~5 x 11 css px at Wide: too small to grade off a full-frame screenshot,
 * and a draw-only vector the census cannot see. So: render one instant at deviceScaleFactor
 * 8, find the panes paneFigure() says are occupied, and crop each one — that magnification
 * is the only way to judge the SHAPE. Then the number, with the control LAWS asks for:
 * render the same instant twice (same code) for the floor, then once with drawPaneFigures()
 * stubbed out, and quote the figures' mass against that floor.
 *
 * Every render is its own page LOAD. __warp advances from the current simT rather than from
 * zero, so three warps in one page are three different instants, and __reseed rewinds
 * neither the clock nor the latches (LAWS) — the first version of this probe read a 4.2M px
 * "control".
 *
 *   node probes/pane-figure-look.mjs [simT] [seed]      -> shots/figzoom-*.png
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const T = +(process.argv[2] || 1246), SEED = +(process.argv[3] || 42);
const DSF = 8;
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: DSF });
const p = await c.newPage();
p.on('pageerror', e => console.error('PAGE ERROR ' + e));
await p.goto(pathToFileURL(resolve('courtyard.html')).href + `?pause&t=0&seed=${SEED}`);
await p.waitForFunction(() => typeof window.__warp === 'function');
const info = await p.evaluate(t => {
  __reseed(); __warp(t); drawScene(simT, 1 / 30);
  const occ = LIT_PANES.filter(x => x.room && paneFigure(x.sa, x.sb));
  const cv = document.getElementById('cv').getBoundingClientRect();
  return { lit: LIT_PANES.length, occ: occ.map(x => ({ sa: x.sa, sb: x.sb, q: x.q, f: paneFigure(x.sa, x.sb) })), cv: { x: cv.x, y: cv.y } };
}, T);
console.log(`t=${T} seed=${SEED}: ${info.lit} lit panes, ${info.occ.length} occupied`);
let i = 0;
for (const o of info.occ) {
  const xs = o.q.map(q => q[0]), ys = o.q.map(q => q[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const pad = Math.max(w, h) * 4;
  const clip = { x: info.cv.x + Math.min(...xs) - pad, y: info.cv.y + Math.min(...ys) - pad, width: w + 2 * pad, height: h + 2 * pad };
  console.log(`  pane (${o.sa},${o.sb}) ${w.toFixed(1)}x${h.toFixed(1)} css px  u=${o.f.u.toFixed(2)} sc=${o.f.sc.toFixed(2)}`);
  await p.screenshot({ path: `shots/figzoom-${i}.png`, clip });
  i++;
  if (i >= 4) break;
}
// same-code control: stub the pass, re-render, diff the whole canvas
// three RELOADS, not three warps: __warp advances from the current simT, so warping
// twice in one page is a different instant, and __reseed rewinds neither latches nor sim
const shot = async (stub) => {
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + `?pause&t=0&seed=${SEED}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  return p.evaluate(({ t, stub }) => {
    if (stub) drawPaneFigures = () => {};
    __reseed(); __warp(t); drawScene(simT, 1 / 30);
    const cv = document.getElementById('cv');
    return Array.from(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data);
  }, { t: T, stub });
};
const A = await shot(false), C = await shot(false), B = await shot(true);
const cnt = (X, Y) => { let n = 0, s = 0; for (let k = 0; k < X.length; k += 4){ const dd = Math.abs(X[k]-Y[k]) + Math.abs(X[k+1]-Y[k+1]) + Math.abs(X[k+2]-Y[k+2]); if (dd > 6){ n++; s += dd; } } return [n, n ? s / n : 0]; };
const d = { control: cnt(A, C), figures: cnt(A, B) };
console.log(`  control (same code, twice): ${d.control[0]} px`);
console.log(`  figures on vs off:          ${d.figures[0]} px, mean d ${d.figures[1].toFixed(1)}`);
await b.close();
