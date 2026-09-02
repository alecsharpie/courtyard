/* Where does the candidate differ from HEAD on a DRY day? It must not, anywhere: with
 * wetness 0 every line #122 adds to the draw path early-returns. FRESH PAGE per reading
 * (c180: repeated __warp on one page accumulates ground state), whole canvas, and the
 * bounding box + tile of the changed pixels printed so the answer is a place, not a guess. */
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
writeFileSync(join(REPO,'head-tmp.html'), execSync('git show HEAD:courtyard.html', {cwd:REPO, maxBuffer:1<<28}));
const br = await chromium.launch();
const grab = async (file, seed, day, hour, wet) => {
  const p = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
  await p.goto(`${pathToFileURL(join(REPO,file)).href}?pause&seed=${seed}`);
  await p.waitForFunction('window.__warp && window.__census');
  const d = await p.evaluate(([day,hour,wet]) => {
    __reseed(); __warp(day*55); __setTime(hour);
    raining=false; rainFall=0; raindrops.length=0; wetness=wet;
    drawScene(simT, 1/30);
    return Array.from(ctx.getImageData(0,0,cv.width,cv.height).data);
  }, [day,hour,wet]);
  await p.close();
  return d;
};
const W = 1600;
for (const [day,hour,wet,label] of [[6,14,0,'dry afternoon'],[6,20.5,0,'dry dusk'],[6,20.5,0,'dry dusk (repeat)']]){
  const A = await grab('courtyard.html',7,day,hour,wet);
  const B = await grab('head-tmp.html',7,day,hour,wet);
  let n=0, x0=1e9,x1=-1,y0=1e9,y1=-1, peak=0;
  for (let i=0;i<A.length;i+=4){
    const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);
    if (d>6){ n++; const px=(i/4)%W, py=(i/4/W)|0;
      if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py; if(d>peak)peak=d; }
  }
  console.log(`${label.padEnd(22)} changed ${n} px (${(400*n/A.length).toFixed(3)}%) peak ${peak}` +
              (n?`  box x ${x0}..${x1}  y ${y0}..${y1}`:'  — identical'));
}
// and the same pair on HEAD alone, so the floor is shown to be zero
const C = await grab('head-tmp.html',7,6,20.5,0), D = await grab('head-tmp.html',7,6,20.5,0);
let m=0; for (let i=0;i<C.length;i+=4){ if (Math.abs(C[i]-D[i])+Math.abs(C[i+1]-D[i+1])+Math.abs(C[i+2]-D[i+2])>6) m++; }
console.log(`FLOOR  HEAD | HEAD, fresh pages, dry dusk: ${m} px`);
unlinkSync(join(REPO,'head-tmp.html'));
await br.close();
