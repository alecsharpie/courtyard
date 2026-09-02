/* The camera EASE: the cache is blitted SCALED while it runs, but the sill is now copied
 * 1:1, so it should sit perfectly still while the town zooms behind it. Sample the band at
 * eight points across the 0.9 s ease and print max luma + the mean, plus a per-step change
 * in the band, on both builds. A moving/absent sill shows up as a loud step. */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
import { execSync } from 'node:child_process';
// the HEAD fixture regenerates itself: a stale /tmp copy is a control that is not a control
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const HEAD = '/tmp/head-courtyard.html';
execSync(`git -C ${REPO} show HEAD:courtyard.html > ${HEAD}`);
const br = await chromium.launch();
for (const f of [HEAD, path.join(REPO, 'courtyard.html')]){
  const p = await br.newPage(); await p.setViewportSize({ width:1600, height:950 });
  await p.goto('file://' + path.resolve(f) + '?seed=7&t=0&pause'); await p.waitForTimeout(350);
  const r = await p.evaluate(() => {
    __reseed(); __setTime(30*55+24); __warp(0); __where(0, 3); drawScene(1,1/30); drawScene(1,1/30);
    __where(3);                                   // start the ease to the Plaza
    const out = []; let prev = null;
    for (let i = 0; i <= 8; i++){
      if (i) __where(undefined, 0.9/8);
      drawScene(1, 1/30);
      const sy = sillTop(), y0 = Math.ceil(sy)+6;
      const d = ctx.getImageData(0, y0*DPR, Math.floor(W*DPR), Math.floor((H-y0)*DPR)).data;
      let mx=0,sum=0,n=0,ch=0;
      for (let j=0;j<d.length;j+=4){ const L=0.299*d[j]+0.587*d[j+1]+0.114*d[j+2];
        if(L>mx)mx=L; sum+=L; n++; if(prev && Math.abs(L-prev[j>>2])>8) ch++; }
      out.push({ u:+(i/8).toFixed(2), s:+viewS.toFixed(2), max:+mx.toFixed(1), mean:+(sum/n).toFixed(2), moved:+(100*ch/n).toFixed(2) });
      prev = new Float32Array(n); for (let j=0,k=0;j<d.length;j+=4,k++) prev[k]=0.299*d[j]+0.587*d[j+1]+0.114*d[j+2];
    }
    return out;
  });
  console.log('\n' + f);
  for (const x of r) console.log(`  u=${x.u} s=${String(x.s).padEnd(5)} band max ${String(x.max).padStart(5)} mean ${String(x.mean).padStart(6)}  band px changed since last step ${String(x.moved).padStart(6)}%`);
  await p.close();
}
await br.close();
