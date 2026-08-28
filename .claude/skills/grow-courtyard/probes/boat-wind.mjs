import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = { HEAD: '/tmp/courtyard-head.html', HERE: new URL('../../../../courtyard.html', import.meta.url).pathname };
const br = await chromium.launch();
for (const [lbl,file] of Object.entries(FILES)){
  const tot = {windy:{launch:0,days:0,free:0,spd:0,n:0}, calm:{launch:0,days:0,free:0,spd:0,n:0}};
  for (const seed of Array.from({length:30},(_,i)=>i+11)){
    const page = await br.newPage({ viewport:{width:1200,height:720} });
    await page.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(() => { window.__reseed(); window.__setTime(0);
      const o={windy:{launch:0,days:0,free:0,spd:0,n:0}, calm:{launch:0,days:0,free:0,spd:0,n:0}}; let seq=boatSeq, ld=-1;
      for (let i=0;i<40*110;i++){ window.__warp(0.5); const k=isWindy()?'windy':'calm';
        if (day!==ld){ ld=day; if (day>=1) o[k].days++; }
        if (day<1) continue;
        if (!boat) o[k].free++;                       // samples where a launch was possible
        if (boatSeq!==seq){ seq=boatSeq; o[k].launch++; }
        if (boat){ o[k].spd+=boatSpeed(); o[k].n++; } }
      return o; });
    for (const k of ['windy','calm']) for (const f of Object.keys(r[k])) tot[k][f]+=r[k][f];
    await page.close();
  }
  for (const k of ['calm','windy']) console.log(lbl.padEnd(5), k.padEnd(6), 'launches/day', (tot[k].launch/tot[k].days).toFixed(3), ' launches per free-sample x1000', (1000*tot[k].launch/tot[k].free).toFixed(2), ' mean speed', (tot[k].spd/tot[k].n).toFixed(3), ' days', tot[k].days);
}
await br.close();
