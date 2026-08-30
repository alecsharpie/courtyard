import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
for (const [w,h,dsf] of [[390,844,2],[1400,800,1]]){
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:dsf });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  console.log(w, JSON.stringify(await p.evaluate(() => { window.__reseed(); window.__warp(338);
    const cost = (label, prep) => { let sum = 0; for (let i = 0; i < 60; i++){ prep && prep(i); simStep(1/30, 1/30); const t = performance.now(); drawScene(simT, 1/30); sum += performance.now() - t; } return +(sum / 60).toFixed(2); };
    const out = {}; out.wideMs = cost('wide');
    out.easeMs = cost('ease', i => { if (i % 27 === 0) window.__where(3); window.__where(undefined, 1/30); });   // fresh ease every 27 frames, never arriving
    window.__where(3, 1); out.plazaMs = cost('plaza');
    window.__where(4, 1); out.farBankMs = cost('farbank');
    window.__where(0, 1); out.wideAgainMs = cost('wide2');
    return out; })));
  await p.close();
}
await b.close();
