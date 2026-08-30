import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600,height:950}});
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
for (const [tag, want] of [['under', 31.2], ['emerging', 33.6], ['night', -1]]){
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?pause&seed=42');
  await p.waitForFunction(() => window.__warp);
  const info = await p.evaluate((want) => {
    window.__reseed();
    let n = 0;
    if (want < 0){ window.__setTime(55 * 3 + 47); window.__warp(2); }
    else while (n++ < 400000 && !(boat && boat.y > want - 0.2 && boat.y < want + 0.2 && daylight > 0.5)) window.__warp(0.05);
    const r = document.querySelector('canvas').getBoundingClientRect();
    const a = project(RIVER_X0 - 6, 24, 0), c = project(RIVER_X1 + 9, 40, 0);
    return {simT, hour, boat: boat && boat.y, clip:{x:r.x + a[0] - 10, y:r.y + a[1] - 90, w:c[0] - a[0] + 20, h:c[1] - a[1] + 110},
            onDeck: agents.filter(x => x.y > 29.7 && x.y < 32.3 && x.x > RIVER_X0 - 2 && x.x < RIVER_X1 + 2).length};
  }, want);
  await p.waitForTimeout(300);
  await p.screenshot({path:`shots/deck-${tag}.png`, clip:{x:info.clip.x, y:info.clip.y, width:info.clip.w, height:info.clip.h}});
  console.log(tag, JSON.stringify(info));
}
await b.close();
