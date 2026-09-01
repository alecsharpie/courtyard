import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process'; import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HEADP='/tmp/sill-head.html';
writeFileSync(HEADP, execFileSync('git',['show','HEAD:courtyard.html'],{cwd:REPO,maxBuffer:1<<28}));
const b = await chromium.launch();
for (const [tag,page] of [['head',HEADP],['cand',resolve(REPO,'courtyard.html')]])
for (const [w,h] of [[1200,720],[390,844]]) {
  const c = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2});
  const p = await c.newPage(); await p.goto(`${pathToFileURL(page).href}?seed=42&t=0&pause`,{waitUntil:'load'});
  await p.waitForFunction(()=>typeof window.__warp==='function');
  const r = await p.evaluate(()=>{ window.__reseed(); window.__warp(175); drawScene(simT,1/30);
    const rc=cv.getBoundingClientRect(), k=rc.width/(cv.width/devicePixelRatio);
    return {x:rc.left, y:rc.top + sillTop()*k - 40*k, w:rc.width, h:(H-sillTop()+42)*k}; });
  await p.screenshot({path:`${REPO}shots/${tag}-sillband-${w}.png`,
    clip:{x:r.x,y:r.y,width:r.w,height:r.h}});
  await c.close();
}
await b.close(); console.log('ok');
