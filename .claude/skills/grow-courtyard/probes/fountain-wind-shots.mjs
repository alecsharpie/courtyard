import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
for (const [label,file] of [['head','/tmp/courtyard-head.html'],['here',resolve('courtyard.html')]]){
  for (const [name, dayN] of [['windy',5],['calm',6]]){
    const p = await b.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:2 });
    await p.goto(pathToFileURL(file).href + '?pause&seed=42&t=0'); await p.waitForFunction(() => window.__warp);
    const info = await p.evaluate(dayN => { window.__reseed(); window.__warp(dayN*55 + 13.75); drawScene(simT, 0.016); 
      const r = cv.getBoundingClientRect(); const a = project(FOUNTAIN.x-5, FOUNTAIN.y-5, 3), c = project(FOUNTAIN.x+6, FOUNTAIN.y+5, 0);
      // mean x of bright spray pixels in the crop, relative to the column
      const [px] = project(FOUNTAIN.x, FOUNTAIN.y+0.2, 1.5);
      const dpr = devicePixelRatio, x0 = Math.round(a[0]*dpr), y0 = Math.round(a[1]*dpr), w = Math.round((c[0]-a[0])*dpr), h = Math.round((c[1]-a[1])*dpr);
      const d = ctx.getImageData(x0, y0, w, h).data; let sx=0, n=0;
      for (let i=0;i<d.length;i+=4){ if (d[i]>200 && d[i+1]>225 && d[i+2]>225){ sx += (i/4)%w; n++; } }
      return { day, windy: isWindy(), hour: +hour.toFixed(2), clip:{x:r.x+a[0], y:r.y+a[1], width:c[0]-a[0], height:c[1]-a[1]}, sprayPx:n, meanDx: n ? +((sx/n)/dpr + a[0] - px).toFixed(1) : null }; }, dayN);
    await p.screenshot({ path:`shots/fountain-wind-${label}-${name}.png`, clip: info.clip });
    console.log(label, name, JSON.stringify({day:info.day, windy:info.windy, hour:info.hour, sprayPx:info.sprayPx, meanDx:info.meanDx}));
    await p.close();
  }
}
await b.close();
