/* Hunt a morning crossing and photograph it, then trace the rider's whole day. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const br = await chromium.launch();
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:2 });
  page.on('pageerror', e=>console.log('PAGEERROR',seed,e.message));
  await page.goto(pathToFileURL(resolve(REPO,'courtyard.html')).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(()=>typeof window.__warp==='function');
  await page.waitForTimeout(2600);
  const r = await page.evaluate(()=>{
    window.__reseed(); window.__warp(12*55 - simT);
    let trace=null;
    while (simT < 20*55){
      window.__warp(0.05);
      if (punt.leg===2 && punt.y > 38 && punt.rider && punt.rider.far){   // mid-crossing, clear of the jetty
        const a=punt.rider;
        drawScene(simT,1/30);
        trace={hour:+hour.toFixed(2), day, from:a&&a.farAt, wary:a&&+a.wary.toFixed(2)};
        break;
      }
    }
    return trace;
  });
  if (r){
    await page.screenshot({ path: resolve(REPO,`shots/punt-crossing.png`), clip:{x:1130,y:330,width:340,height:340} });
    console.log(`seed ${seed}: crossing at day ${r.day} hour ${r.hour}, rider from the ${r.from} branch`);
    await page.close(); break;
  }
  await page.close();
}
await br.close();
