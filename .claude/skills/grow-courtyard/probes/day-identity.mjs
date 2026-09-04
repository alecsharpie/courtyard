/* b196 — is the DAY frame untouched? moonLight() is 0 whenever daylight > 0.02, so every
 * daylit frame in the town should be HEAD's, pixel for pixel. A zero is only evidence if
 * the test can be non-zero, so the same comparison is run at a NIGHT instant too, where it
 * reads 71.9%. Not specific to the moon: the control for any night-only change.
 *
 *   node .../probes/day-identity.mjs [cand] [base]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CAND = process.argv[2] || 'courtyard.html';
const BASE = process.argv[3] || '/tmp/head196.html';   // git show HEAD:courtyard.html, maxBuffer raised (c289)
const b = await chromium.launch();
async function frames(file){
  const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&pause&t=0');
  await p.waitForFunction('typeof __warp === "function"');
  const out = await p.evaluate(() => {
    __reseed();                       // the default entry is a DIFFERENT world: reseed, THEN step, in one evaluate
    const step = DAY_LEN / 96, res = {};
    const grab = k => { drawScene(simT, 0);
      const c = document.getElementById('cv'), g = c.getContext('2d');
      res[k] = { px: Array.from(g.getImageData(0, 0, c.width, c.height).data), dl: +daylight.toFixed(3), h: +hour.toFixed(2) }; };
    while (simT < 175) __warp(step); grab('day');
    while (!(daylight <= 0.02 && nightF > 0.6)) __warp(step); grab('night');
    return res;
  });
  await p.close();
  if (errs.length) console.log('ERRORS ' + file, errs.slice(0, 3));
  return out;
}
const C = await frames(CAND), H = await frames(BASE);
await b.close();
for (const k of ['day', 'night']){
  const a = C[k].px, c = H[k].px;
  let n = 0, sum = 0;
  for (let i = 0; i < a.length; i += 4){
    const d = Math.abs(a[i]-c[i]) + Math.abs(a[i+1]-c[i+1]) + Math.abs(a[i+2]-c[i+2]);
    if (d > 6){ n++; sum += d; }
  }
  console.log(k.padEnd(6) + ' daylight ' + C[k].dl + ' hour ' + C[k].h +
              '  pixels differing by >6: ' + n + ' of ' + (a.length/4) +
              ' (' + (100*n/(a.length/4)).toFixed(2) + '%)  mean |d| over them ' + (n ? (sum/n).toFixed(1) : 0));
}
