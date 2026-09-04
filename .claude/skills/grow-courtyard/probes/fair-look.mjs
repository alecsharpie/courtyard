#!/usr/bin/env node
/* #194 — is the square's dressing SEEN? A difference image and a number, at the
 * shipping size, against a SAME-CODE control: the same pinned instant drawn twice with
 * nothing changed is the floor every mass below is quoted as a ratio to. The only thing
 * toggled is fairDress(), the one level the bunting and the rim garland both read — the
 * crowd, the light, the weather and the PRNG are identical in both frames. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const T = +arg('--t', 181), SEED = arg('--seed', '42'), Q = +arg('--quarter', 3);
const b = await chromium.launch();
for (const [w, h, label] of [[1400, 900, 'desktop'], [390, 844, 'mobile']]){
  const page = await b.newPage({ viewport: { width: w, height: h } });
  await page.goto(pathToFileURL(resolve('courtyard.html')).href + `?seed=${SEED}&pause&t=0`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed(); __warp(${T}); whereGo(${Q}); viewSnap ? viewSnap() : 0;
    const cv = document.querySelector('canvas'), c2 = cv.getContext('2d');
    const grab = () => { drawScene(simT, 0); return c2.getImageData(0, 0, cv.width, cv.height).data; };
    const A = grab().slice();          // dressed
    const C = grab().slice();          // dressed again — the SAME-CODE control
    const FD = fairDress; fairDress = () => 0;
    const B = grab().slice();          // undressed
    fairDress = FD;
    const mass = (P, Q2) => { let n = 0, sum = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let i = 0; i < P.length; i += 4){
        const d = Math.abs(P[i]-Q2[i]) + Math.abs(P[i+1]-Q2[i+1]) + Math.abs(P[i+2]-Q2[i+2]);
        if (d > 12){ n++; sum += d; const p = (i/4)|0, px = p % cv.width, py = (p/cv.width)|0;
          if (px<x0)x0=px; if (px>x1)x1=px; if (py<y0)y0=py; if (py>y1)y1=py; } }
      return { px:n, mean:+(sum/Math.max(1,n)).toFixed(1), box:x1<0?null:[x0,y0,x1-x0,y1-y0] }; };
    return { fair:+fairF().toFixed(2), day, hour:+hour.toFixed(2), cw:cv.width, ch:cv.height,
             dressed: mass(A, B), control: mass(A, C) };
  })()`);
  console.log(label.padEnd(8), `canvas ${r.cw}x${r.ch}  day ${r.day} hour ${r.hour} fairF ${r.fair}`);
  console.log('  dressing vs undressed :', JSON.stringify(r.dressed));
  console.log('  same-code control     :', JSON.stringify(r.control));
  console.log('  ratio to the floor    :', r.control.px ? (r.dressed.px / r.control.px).toFixed(1) + 'x' : 'floor is 0 px');
  await page.close();
}
await b.close();
