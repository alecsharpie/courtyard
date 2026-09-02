/* Pinned contact strips: one instant, one seed, one framing, ONLY wetness varying — so
 * the difference between two panels is the drying arc and nothing else. Fresh page per
 * panel (c180). Crops the lane band and the cross street at the shipping size. */
import { homedir } from 'node:os';
import { writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const br = await chromium.launch();
const [hour, day, seed] = [Number(process.env.HOUR || 14), 6, 7];
const clip = process.env.CLIP === 'cross' ? {x:640,y:150,width:560,height:640} : {x:150,y:545,width:1330,height:150};
for (const w of [0, 1.0, 0.75, 0.5, 0.3]){
  const p = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:2 });
  await p.goto(`${pathToFileURL(join(REPO,'courtyard.html')).href}?pause&seed=${seed}`);
  await p.waitForFunction('window.__warp && window.__census');
  await p.evaluate(([d,h,wt]) => {
    // WARP to the hour, never __setTime to it: nightF and daylight are STEPPED by the sim,
    // so a clock jump leaves the light where it was (measured: nightF 0.00 at 23.5h).
    __reseed(); __warp(d*55);
    for (let k = 0; k < 4000 && !(hour >= h && hour < h + 0.25); k++) __warp(0.05);
    raining=false; rainFall=0; raindrops.length=0; wetness=wt;
    drawScene(simT, 1/30);
  }, [day,hour,w]);
  await p.screenshot({ path: join(REPO,'shots',`pud-${process.env.CLIP||'lane'}-${hour}-${w}.png`), clip });
  await p.close();
}
await br.close();
console.log('ok');
