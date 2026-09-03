/* What the reeds actually put on the screen (#155), against a SAME-CODE control.
 *   node .claude/skills/grow-courtyard/probes/reed-look.mjs   from the repo root
 *   (expects HEAD at /tmp/head.html: `git show HEAD:courtyard.html > /tmp/head.html`)
 * Reseed, pin the instant, draw inside one evaluate, read the canvas in the same one.
 * Crops to the river's own columns: filmstrip's whole-frame rate is blind under ~2%. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();

async function shot(file, T, wind){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([T, wv]) => {
    window.__reseed(); window.__warp(T);
    // `wind` is a top-level `let` in a classic script: a global LEXICAL binding, so it is
    // not on `window` but a bare assignment still reaches it. windF() is read back below,
    // which is the assertion that the instrument fired at all.
    if (wv !== null) wind = wv;
    drawScene(simT, 1/30);
    const cv = document.querySelector('canvas');
    // the river's 13 columns, top reach only: the crop the feature lives in
    const pts = [[113,3],[128,3],[113,62],[128,62]].map(([x,y]) => project(x,y,0));
    const xs = pts.map(q=>q[0]), ys = pts.map(q=>q[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.ceil(Math.max(...xs));
    const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.ceil(Math.max(...ys));
    const g = cv.getContext('2d');
    const d = g.getImageData(x0*DPR, y0*DPR, (x1-x0)*DPR, (y1-y0)*DPR);
    return { w: d.width, h: d.height, px: Array.from(d.data), warmth, windF: windF() };
  }, [T, wind]);
  await p.close(); return r;
}
function diff(a, c){                       // share of the crop that differs, and by how much
  let n = 0, sum = 0;
  for (let i = 0; i < a.px.length; i += 4){
    const d = Math.abs(a.px[i]-c.px[i]) + Math.abs(a.px[i+1]-c.px[i+1]) + Math.abs(a.px[i+2]-c.px[i+2]);
    if (d > 12){ n++; sum += d; }
  }
  const tot = a.px.length / 4;
  return { pct: +(100*n/tot).toFixed(3), mean: +(sum/Math.max(1,n)).toFixed(1), px: n, of: tot };
}
const CASES = [['summer', 330], ['winter', 1155]];
for (const [name, T] of CASES){
  const h1 = await shot('/tmp/head.html', T, null), h2 = await shot('/tmp/head.html', T, null);
  const c1 = await shot('courtyard.html', T, null);
  console.log(name, 'warmth', c1.warmth.toFixed(3),
    '| same-code control', JSON.stringify(diff(h1, h2)),
    '| reeds', JSON.stringify(diff(c1, h1)));
}
// the lean: the same instant, calm against a full blow, on the candidate only
const calm = await shot('courtyard.html', 330, 0), blow = await shot('courtyard.html', 330, 1);
const hcalm = await shot('/tmp/head.html', 330, 0), hblow = await shot('/tmp/head.html', 330, 1);
console.log('wind calm->blow  HEAD', JSON.stringify(diff(hcalm, hblow)),
            '| cand', JSON.stringify(diff(calm, blow)),
            '| windF', hcalm.windF, hblow.windF);
await b.close();
