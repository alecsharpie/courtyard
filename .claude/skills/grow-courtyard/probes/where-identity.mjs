import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function hash(file, w, h, steps){
  const p = await b.newPage({ viewport:{width:w,height:h} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(async (steps) => { window.__reseed(); window.__warp(338); drawScene(simT, 0);
    if (window.__where) for (const [n, secs] of steps){ window.__where(n, secs); drawScene(simT, 0); }
    window.__warp(2); drawScene(simT, 0);   // and a couple of seconds on, so the sim has moved under the camera
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let h = 0, nz = 0; for (let i = 0; i < d.length; i += 13){ h = (h * 31 + d[i]) >>> 0; if (d[i]) nz++; }
    return { h, nz, cellW, originX, topPad }; }, steps);
  await p.close(); return r;
}
for (const [w, h] of [[390, 844], [1400, 800]]){
  const H0 = await hash('/tmp/head.html', w, h, []), T0 = await hash('courtyard.html', w, h, []), T1 = await hash('courtyard.html', w, h, [[3, 1], [0, 1]]);
  console.log(w, 'HEAD', JSON.stringify(H0), '\n     tree wide', JSON.stringify(T0), T0.h === H0.h ? 'IDENTICAL' : 'DIFFERS', '\n     tree after plaza→wide', JSON.stringify(T1), T1.h === H0.h ? 'IDENTICAL' : 'DIFFERS');
}
await b.close();
