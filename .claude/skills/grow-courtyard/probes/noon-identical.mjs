/* Canvas + ground-layer hash at a pinned bucket edge (seed 7 summer noon), HEAD vs tree, twice
 * each. A page PNG is NOT byte-stable (HUD/encoder); the canvas is - hash that.  (HEAD at /tmp/head.html) */
/* Canvas + ground-layer hash at a pinned bucket edge (seed 7 summer noon), HEAD vs tree twice each — a PNG screenshot is NOT byte-stable (HUD/encoder), the canvas is. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function shot(file){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => { window.__reseed(); window.__warp(330); window.__warp(13.75 - 1/30); window.__warp(1/30);
    drawScene(simT, 1/30);
    const d = ctx.getImageData(0,0,W*DPR,H*DPR).data; let h=0; for (let i=0;i<d.length;i+=4){ h=(h*31 + d[i] + d[i+1]*7 + d[i+2]*13)|0; }
    const g = gtx.getImageData(0,0,gcv.width,gcv.height).data; let hg=0; for (let i=0;i<g.length;i+=4){ hg=(hg*31 + g[i] + g[i+1]*7 + g[i+2]*13)|0; }
    return { lb: lightBucket, hour: +hour.toFixed(3), canvasHash: h, groundHash: hg }; });
  await p.close(); return r;
}
for (const f of ['/tmp/head.html','/tmp/head.html','courtyard.html','courtyard.html']) console.log(f, JSON.stringify(await shot(f)));
await b.close();
