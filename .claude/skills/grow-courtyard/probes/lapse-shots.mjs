/* What the two clock-button destinations actually LOOK like: warp to sunUp+0.5 and to
 * sunDown+1 on the same seeded day, Wide, and shoot. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const SEEDS = arg('--seeds','42,7').split(',').map(Number);
const DAYS = arg('--days','3,16').split(',').map(Number);   // warm and cold ends of the year
const TAG = arg('--tag','head');
const br = await chromium.launch();
for (const seed of SEEDS) for (const D of DAYS) for (const which of ['morning','evening']){
  const page = await br.newPage({ viewport:{width:1200,height:720}, deviceScaleFactor:1 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(resolve(REPO,'courtyard.html')).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const info = await page.evaluate(([D, which]) => {
    window.__reseed(); window.__warp(2*55 - simT);
    const ph = h => ((h - 6 + 24) % 24) / 24;
    let pPrev = (simT%55)/55, dPrev = day, hit = null;
    while (day < D + 1 && !hit){
      window.__warp(0.25);
      const p = (simT%55)/55, pt = which === 'morning' ? ph(sunUp+0.5) : ph(sunDown+1);
      const crossed = day === dPrev ? (pPrev < pt && p >= pt) : (pPrev < pt || p >= pt);
      if (crossed && day >= D) hit = 1;
      pPrev = p; dPrev = day;
    }
    drawScene(simT, 1/30);
    const on = agents.filter(a => a.x > -1 && a.x < GW + 1);
    return { day, hour:+hour.toFixed(2), warm:+warmth.toFixed(2), n: on.length,
             inview: on.filter(a => inView(a.x, a.y)).length,
             lane: on.filter(a => a.y > 60 && a.y < 82).length,
             court: on.filter(a => a.x < 64 && a.y < 60).length };
  }, [D, which]);
  console.log(`${TAG} seed ${seed} day ${info.day} ${which} h${info.hour} warm ${info.warm}: on-frame ${info.n} inView ${info.inview} lane ${info.lane} courtyard ${info.court}`);
  await page.screenshot({ path: resolve(REPO, `shots/lapse-${TAG}-${seed}-d${D}-${which}.png`) });
  await page.close();
}
await br.close();
