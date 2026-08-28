import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = { HEAD: '/tmp/courtyard-head.html', HERE: new URL('../../../../courtyard.html', import.meta.url).pathname };
const br = await chromium.launch();
async function frame(file, seed, t, stub){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  await page.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([t, stub]) => {
    window.__reseed(); window.__warp(t); if (stub && typeof drawRiverLights === 'function') drawRiverLights = () => {}; drawScene(simT, 0);
    // river box in CSS px: world x RIVER_X0..RIVER_X1, y 2..60
    const [x0,y0] = project(RIVER_X0+0.5, 2, 0), [x1,y1] = project(RIVER_X1-0.5, 60, 0);
    const cv = document.querySelector('canvas'); const g = cv.getContext('2d');
    const X0=Math.round(Math.min(x0,x1)*DPR), Y0=Math.round(y0*DPR), X1=Math.round(Math.max(x0,x1)*DPR), Y1=Math.round(y1*DPR);
    const d = g.getImageData(X0, Y0, X1-X0, Y1-Y0).data; let sum=0, bright=0;
    for (let i=0;i<d.length;i+=4){ const l=(d[i]+d[i+1]+d[i+2])/3; sum+=l; if (l>90) bright++; }
    const all = g.getImageData(0,0,cv.width,cv.height).data; let h=0; for (let i=0;i<all.length;i+=97) h=(h*31+all[i])>>>0;
    return { mean:(sum/(d.length/4)).toFixed(2), bright, px:d.length/4, hour:hour.toFixed(2), night:nightF.toFixed(2), cloud:cloudCover().toFixed(2), hash:h };
  }, [t, stub]);
  await page.close(); return r;
}
console.log('22:00 river box (seed 7, t 256.7), HERE vs HERE-with-drawRiverLights-stubbed (same world):');
console.log('  lit  ', await frame(FILES.HERE, 7, 256.7, false));
console.log('  stub ', await frame(FILES.HERE, 7, 256.7, true));
console.log('  HEAD ', await frame(FILES.HEAD, 7, 256.7, false));
console.log('noon t=13.75 whole-frame hash (day 0, before any R() the new branch could take):');
for (const [l,f] of Object.entries(FILES)) console.log(' ', l, await frame(f, 7, 13.75, false));
// presence at the rail after dark, over the tap's dark hours
let tot=0, occ=0, visits=0, bad=0, per=[];
for (const seed of [1,2,3,4,5,6,7,8,9,10]){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  await page.goto(pathToFileURL(FILES.HERE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => {
    window.__reseed(); window.__warp(220);           // day 4, 6.00
    let tot=0, occ=0, visits=0, bad=0, last=null;
    for (let i=0;i<55/0.25;i++){ window.__warp(0.25);
      const dark = !eastOpen() && tapOpen();
      const a = agents.find(a => a.nightRail);
      if (a && !eastOpen() && !tapOpen() && a.state !== 'walk') bad++;   // standing in the dark past the shut
      if (dark){ tot++; if (a && a.state==='stand') occ++; }
      if (a && a !== last){ visits++; } last = a;
    }
    return {tot,occ,visits,bad};
  });
  per.push(`${seed}:${r.occ}/${r.tot}(${r.visits}v)`); tot+=r.tot; occ+=r.occ; visits+=r.visits; bad+=r.bad;
  await page.close();
}
console.log('night rail over 10 seed-days: standing', occ, '/', tot, 'dark-tap samples =', (100*occ/tot).toFixed(1)+'%', 'visits', visits, 'standing past shut', bad);
console.log(' ', per.join(' '));
await br.close();
