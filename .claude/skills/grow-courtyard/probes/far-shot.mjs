/* HEAD vs candidate: the far bank at a fixed summer morning instant, same seed.
 * Pinned inside ONE evaluate — reseed, warp, drawScene — so the frame is the instant. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process'; import fs from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const SEED=+arg('--seed',11), DAY=+arg('--day',13), HR=+arg('--hour',9.2);
const head=resolve(REPO,'.probe-head.html');
fs.writeFileSync(head, execSync('git show HEAD:courtyard.html',{cwd:REPO,maxBuffer:1<<28}));
const br = await chromium.launch();
for (const [label,FILE] of [['head',head],['cand',resolve(REPO,'courtyard.html')]]){
  const page = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:3 });
  page.on('pageerror', e=>console.log('PAGEERROR',label,e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${SEED}`, { waitUntil:'load' });
  await page.waitForFunction(()=>typeof window.__warp==='function');
  await page.waitForTimeout(2600);
  const info = await page.evaluate(([DAY,HR])=>{
    window.__reseed(); window.__warp(DAY*55 - simT);
    while (!(day===DAY && hour>=HR) && simT < (DAY+1)*55) window.__warp(0.05);
    drawScene(simT, 1/30);
    const far = agents.filter(a=>a.x>127&&!a.aboard);
    return {hour:+hour.toFixed(2), day, far:far.length, raining,
      who: far.map(a=>`${a.farAt||a.kind}@${a.x.toFixed(0)},${a.y.toFixed(0)}`).join(' '), puntLeg:punt.leg};
  },[DAY,HR]);
  await page.screenshot({ path: resolve(REPO,`shots/farbank-zoom-${label}.png`),
    clip:{x:1240,y:210,width:230,height:330} });
  console.log(`${label}: day ${info.day} hour ${info.hour} rain=${info.raining} puntLeg=${info.puntLeg} east-of-river=${info.far}\n   ${info.who}`);
  await page.close();
}
await br.close();
