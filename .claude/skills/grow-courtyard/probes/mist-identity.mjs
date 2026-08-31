// Run from the repo root (HEAD at /tmp/head.html): node .claude/skills/grow-courtyard/probes/mist-identity.mjs [simT]  (#88)
// mist identity + location + cost: HEAD vs tree at a mist-morning instant (seed 1, day 14, sunUp+2).
// (a) tree with mistTarget forced 0 over the WHOLE run must hash identical to HEAD; (b) unforced, every
// differing 32px tile must lie in the veil's screen region; (c) drawScene ms with/without the veil.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const T = +(process.argv[2] || 774.3);
async function run(file, force){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', file, e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=1&t=0&pause'); await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([T, force]) => {
    window.__reseed();
    if (force && typeof mistTarget === 'function') mistTarget = () => 0;
    window.__warp(T - 1/30); window.__warp(1/30); drawScene(simT, 1/30);
    const d = ctx.getImageData(0, 0, W*DPR, H*DPR).data; let h = 0; const tiles = {}; const TW = 32*DPR, cols = Math.ceil(W*DPR/TW);
    for (let i = 0; i < d.length; i += 4){ const px = (i/4) % (W*DPR), py = Math.floor((i/4) / (W*DPR)); const k = Math.floor(py/TW)*cols + Math.floor(px/TW);
      tiles[k] = ((tiles[k]||0)*31 + d[i] + d[i+1]*7 + d[i+2]*13)|0; h = (h*31 + d[i] + d[i+1]*7 + d[i+2]*13)|0; }
    const t0 = performance.now(); for (let k = 0; k < 40; k++) drawScene(simT, 1/30); const ms = (performance.now() - t0) / 40;
    const mf = typeof mistF === 'function' ? mistF() : -1;
    const veilL = project(RIVER_X0 - 8 - 1, WH, 0)[0] * DPR, veilR = W * DPR;
    return { hour: +hour.toFixed(2), mist: +mf.toFixed(3), hash: h, tiles, cols, TW, ms: +ms.toFixed(2), veilL, hazeCol: HAZE, W: W*DPR, H: H*DPR, name: nameAt(120, 30) };
  }, [T, force]);
  await p.close(); return r;
}
const head = await run('/tmp/head.html', false), forced = await run('courtyard.html', true), tree = await run('courtyard.html', false);
console.log('HEAD  ', JSON.stringify({ hour: head.hour, hash: head.hash, ms: head.ms, name: head.name, haze: head.hazeCol }));
console.log('FORCED', JSON.stringify({ hour: forced.hour, mist: forced.mist, hash: forced.hash, ms: forced.ms, name: forced.name, haze: forced.hazeCol }), forced.hash === head.hash ? 'IDENTICAL to HEAD' : 'DIFFERS from HEAD');
console.log('TREE  ', JSON.stringify({ hour: tree.hour, mist: tree.mist, hash: tree.hash, ms: tree.ms, name: tree.name, haze: tree.hazeCol }));
let diff = 0, east = 0, west = [];
for (const k of Object.keys(tree.tiles)){ if (tree.tiles[k] !== head.tiles[k]){ diff++; const col = k % tree.cols, x = col * tree.TW; if (x + tree.TW >= tree.veilL) east++; else west.push([x/DPRish(), Math.floor(k / tree.cols) * tree.TW]); } }
function DPRish(){ return 1; }
console.log('tiles differing', diff, 'inside veil x-range', east, 'outside', west.length, west.slice(0, 12).map(w => w.join(',')).join(' '), 'veilL', tree.veilL.toFixed(0), 'of', tree.W);
await b.close();
