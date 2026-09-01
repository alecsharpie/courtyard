import { pathToFileURL } from 'node:url'; import { homedir } from 'node:os'; import { join } from 'node:path';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const b = await chromium.launch();
const F = [{ n:'desktop', w:1600, h:950 }, { n:'phone', w:390, h:844 }];
async function band(url, f, t, forceSnow){
  const ctx = await b.newContext({ viewport:{width:f.w,height:f.h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${url}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const o = await p.evaluate(([secs, fs]) => {
    window.__reseed(); window.__warp(secs);
    if (fs !== null) snowCover = fs;
    groundDirty = true; drawScene(simT, 1 / 30);   // __warp never draws; pin the frame here
    const cv = document.querySelector('canvas'), g = cv.getContext('2d');
    const dpr = cv.width / cv.getBoundingClientRect().width;
    const y0 = Math.round(project(0, LN_WALK_S, 0)[1] * dpr), y1 = Math.round(sillTop() * dpr);
    const d = g.getImageData(0, y0, cv.width, y1 - y0).data;
    let n = 0, black = 0, sum = 0, s2 = 0;
    for (let i = 0; i < d.length; i += 4){ const L = .299*d[i]+.587*d[i+1]+.114*d[i+2]; n++; if (L<20) black++; sum+=L; s2+=L*L; }
    return { snow: +snowCover.toFixed(2), px:n, black:+(100*black/n).toFixed(1),
             mean:+(sum/n).toFixed(1), sd:+Math.sqrt(s2/n-(sum/n)**2).toFixed(1) };
  }, [t, forceSnow ?? null]);
  await ctx.close(); return o;
}
const CAND = pathToFileURL('courtyard.html').href, HEAD = pathToFileURL('/tmp/head-courtyard.html').href;
for (const f of F){
  const h = await band(HEAD, f, 175), c = await band(CAND, f, 175);
  console.log(`${f.n}: near-black HEAD ${h.black}% -> ${c.black}% | mean ${h.mean} -> ${c.mean} | sd ${h.sd} -> ${c.sd}`);
}
console.log('snow, same instant t=1218, snowCover forced (candidate):');
for (const s of [0, 0.3, 0.55, 1]) console.log(`   snowCover ${s}: band mean luma ${(await band(CAND, F[0], 1218, s)).mean}`);
console.log('   HEAD same instant, snow 0.55:', (await band(HEAD, F[0], 1218, 0.55)).mean);
await b.close();
