/* A blanket sweep instead of a guess: every quarter at 36 instants across a year, band max
 * luma. Anything drawn after sillOver that can still reach the sill — a bonfire's glow, the
 * balloon, the follow mark, rain streaks — shows up here as a quarter beating the wide view. */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
import { execSync } from 'node:child_process';
// the HEAD fixture regenerates itself: a stale /tmp copy is a control that is not a control
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const HEAD = '/tmp/head-courtyard.html';
execSync(`git -C ${REPO} show HEAD:courtyard.html > ${HEAD}`);
const br = await chromium.launch();
for (const [f,lab] of [[HEAD,'HEAD'],[path.join(REPO, 'courtyard.html'),'CAND']]){
  const p = await br.newPage(); await p.setViewportSize({ width:1600, height:950 });
  await p.goto('file://' + path.resolve(f) + '?seed=7&t=0&pause'); await p.waitForTimeout(350);
  const r = await p.evaluate(() => {
    const best = {}, when = {};
    for (let d = 2; d < 56; d += 6) for (const hr of [7, 12, 17, 20, 23, 2])
    for (let n = 0; n < 5; n++){
      __reseed(); __setTime(d*55 + hr/24*55); __warp(0); __where(n,3); drawScene(1,1/30); drawScene(1,1/30);
      const sy=sillTop(), y0=Math.ceil(sy)+6;
      const dd = ctx.getImageData(0,y0*DPR,Math.floor(W*DPR),Math.floor((H-y0)*DPR)).data;
      let mx=0; for(let i=0;i<dd.length;i+=4){const L=0.299*dd[i]+0.587*dd[i+1]+0.114*dd[i+2]; if(L>mx)mx=L;}
      const k = QUARTERS[n].name;
      if (!(k in best) || mx > best[k]){ best[k] = mx; when[k] = `day ${d} h${hr}`; }
    }
    return Object.keys(best).map(k => `${k.padEnd(10)} worst band max ${best[k].toFixed(1).padStart(6)}  at ${when[k]}`);
  });
  console.log(`\n${lab} — 54 instants x 5 cameras`); r.forEach(x => console.log('   ' + x));
  await p.close();
}
await br.close();
