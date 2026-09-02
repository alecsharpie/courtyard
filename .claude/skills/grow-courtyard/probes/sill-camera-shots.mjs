/* One contact sheet per framing: the five camera positions stacked, bottom band only, so
 * the sill can be compared across quarters in a single look. usage: node probe-sill-shots.mjs <file> <tag> */
import path from 'path'; import fs from 'fs'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');

const ART = path.resolve(process.argv[2] || path.join(REPO, 'courtyard.html')), TAG = process.argv[3] || 'cand';
const br = await chromium.launch();
for (const [w,h] of [[1200,720],[1600,950],[390,844]]){
  const p = await br.newPage(); await p.setViewportSize({ width:w, height:h });
  await p.goto('file://' + ART + '?seed=7&t=0&pause'); await p.waitForTimeout(400);
  for (let n = 0; n < 5; n++){
    const box = await p.evaluate((n) => { __reseed(); __setTime(30*55+24); __warp(0); __where(n,3);
      drawScene(1,1/30); drawScene(1,1/30);
      const r = cv.getBoundingClientRect(), sy = sillTop();
      return { x:r.x, y:r.y + sy - 46, width:r.width, height:Math.min(r.height - sy + 46, H - sy + 46), name:QUARTERS[n].name }; }, n);
    await p.screenshot({ path: `shots/sill-${TAG}-${w}x${h}-${n}-${box.name.replace(' ','')}.png`,
                         clip: { x:box.x, y:box.y, width:box.width, height:box.height } });
  }
  await p.close();
}
await br.close(); console.log('shots/sill-' + TAG + '-*.png');
