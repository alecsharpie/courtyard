/* The sill under the other modes: reduced motion (the camera snaps, no ease), rain, snow,
 * and a followed walker. Same band measure; every row must match the wide view's own. */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
import { execSync } from 'node:child_process';
// the HEAD fixture regenerates itself: a stale /tmp copy is a control that is not a control
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const HEAD = '/tmp/head-courtyard.html';
execSync(`git -C ${REPO} show HEAD:courtyard.html > ${HEAD}`);
const br = await chromium.launch();
for (const [f,lab] of [[HEAD,'HEAD'],[path.join(REPO, 'courtyard.html'),'CAND']])
for (const rm of [false, true]){
  const ctxo = await br.newContext({ viewport:{width:1600,height:950}, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const p = await ctxo.newPage();
  await p.goto('file://' + path.resolve(f) + '?seed=7&t=0&pause'); await p.waitForTimeout(350);
  const r = await p.evaluate(() => {
    const out = [];
    for (const [wx, T] of [['fine', 30*55+24], ['rain', 6*55+24], ['snow', 46*55+24]])
    for (let n = 0; n < 5; n++){
      __reseed(); __setTime(T); __warp(0); __where(n,3); drawScene(1,1/30); drawScene(1,1/30);
      const sy=sillTop(), y0=Math.ceil(sy)+6;
      const d = ctx.getImageData(0,y0*DPR,Math.floor(W*DPR),Math.floor((H-y0)*DPR)).data;
      let mx=0,sum=0,cnt=0; for(let i=0;i<d.length;i+=4){const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; if(L>mx)mx=L; sum+=L; cnt++;}
      out.push(`${wx}/${QUARTERS[n].name}: max ${mx.toFixed(1)} mean ${(sum/cnt).toFixed(2)}${raining?' (raining)':''}${snowCover>0?' (snow)':''}`);
    }
    return { RM, out };
  });
  console.log(`\n${lab} reducedMotion=${rm} (page RM=${r.RM})`); r.out.forEach(x => console.log('   ' + x));
  await ctxo.close();
}
await br.close();
