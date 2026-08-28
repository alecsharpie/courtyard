import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = { HEAD: '/tmp/courtyard-head.html', HERE: new URL('../../../../courtyard.html', import.meta.url).pathname };
const br = await chromium.launch();
async function frame(file, seed, t, name){
  const page = await br.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:2 });
  await page.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(t => {
    window.__reseed(); window.__warp(t); drawScene(simT, 0);
    const [x0,y0] = project(RIVER_X0+0.5, 2, 0), [x1,y1] = project(RIVER_X1-0.5, 60, 0);
    const cv = document.querySelector('canvas'); const g = cv.getContext('2d');
    const X0=Math.round(Math.min(x0,x1)*DPR), Y0=Math.round(y0*DPR), X1=Math.round(Math.max(x0,x1)*DPR), Y1=Math.round(y1*DPR);
    const d = g.getImageData(X0, Y0, X1-X0, Y1-Y0).data; let rh=0, bright=0;
    for (let i=0;i<d.length;i+=4){ rh=(rh*31+d[i]+d[i+1]*7+d[i+2]*13)>>>0; const l=(d[i]+d[i+1]+d[i+2])/3; if (l>150) bright++; }
    const all = g.getImageData(0,0,cv.width,cv.height).data; let h=0; for (let i=0;i<all.length;i+=4) h=(h*31+all[i]+all[i+2])>>>0;
    const rc = cv.getBoundingClientRect();
    return { day, hour:hour.toFixed(2), windy:isWindy(), night:nightF.toFixed(2), cloud:cloudCover().toFixed(2), boat:!!boat,
             riverHash:rh, bright, frameHash:h, clip:{x:rc.x+Math.min(x0,x1), y:rc.y+y0, width:Math.abs(x1-x0), height:y1-y0} };
  }, t);
  if (name) await page.screenshot({ path:`${new URL('../../../../shots/', import.meta.url).pathname}rw-${name}.png`, clip:{x:Math.round(r.clip.x),y:Math.round(r.clip.y),width:Math.round(r.clip.width),height:Math.round(r.clip.height)} });
  await page.close(); delete r.clip; return r;
}
const noon = d => d*55 + 13.75, ten = d => d*55 + 36.67;
for (const [lbl, t] of [['calm-noon', noon(4)], ['windy-noon', noon(5)], ['calm-night', ten(4)], ['windy-night', ten(5)]]){
  const h = await frame(FILES.HEAD, 42, t, lbl+'-HEAD'), w = await frame(FILES.HERE, 42, t, lbl+'-HERE');
  console.log(lbl.padEnd(12), 'HEAD', JSON.stringify(h)); console.log(''.padEnd(12), 'HERE', JSON.stringify(w),
    '\n'.padEnd(13), 'frame identical:', h.frameHash===w.frameHash, ' river identical:', h.riverHash===w.riverHash, ' bright Δ', w.bright-h.bright);
}
// boat presence by weather: 10 seeds x 30 days, sampled every 0.5 s
console.log('\nboat presence (share of samples with a boat on the water), 10 seeds x 30 days');
const tot = {HEAD:{windy:[0,0],calm:[0,0]}, HERE:{windy:[0,0],calm:[0,0]}};
for (const [lbl,file] of Object.entries(FILES)) for (const seed of [1,2,3,4,5,6,7,8,9,10]){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  await page.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => { window.__reseed(); window.__setTime(0); const o={windy:[0,0],calm:[0,0]};
    for (let i=0;i<30*110;i++){ window.__warp(0.5); const k=isWindy()?'windy':'calm'; o[k][1]++; if (boat) o[k][0]++; } return o; });
  for (const k of ['windy','calm']){ tot[lbl][k][0]+=r[k][0]; tot[lbl][k][1]+=r[k][1]; }
  await page.close();
}
for (const lbl of Object.keys(tot)) for (const k of ['calm','windy']) console.log(lbl.padEnd(5), k.padEnd(6), 'presence', (tot[lbl][k][0]/tot[lbl][k][1]).toFixed(3));
await br.close();
