/* probe-diff.mjs — an AMPLIFIED difference image between HEAD and the tree, over one
 * world box, plus the same-code floor. Judge a look from a difference image (#136). */
import { homedir } from 'node:os'; import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const t=+arg('--t','175'), box=arg('--box','112,28,128,50').split(',').map(Number);
const tag=arg('--tag','diff'), amp=+arg('--amp','8');
writeFileSync('/tmp/head-courtyard.html', execSync('git show HEAD:courtyard.html',{maxBuffer:1<<28}));
const b = await chromium.launch();
async function grab(url, kill){
  const ctx = await b.newContext({viewport:{width:1600,height:950}, deviceScaleFactor:+(arg('--dsf','1'))});
  const p = await ctx.newPage(); p.on('pageerror',e=>console.error('PAGE ERROR',String(e)));
  await p.goto(url+'?seed=42&t=0&pause',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof window.__warp==='function');
  const r = await p.evaluate(({t,box,kill})=>{
    window.__reseed(); window.__warp(t); if (kill) eval(kill); drawScene(simT,1/30);
    const a=project(box[0],box[1],0), c=project(box[2],box[3],0);
    const sx=Math.round(Math.min(a[0],c[0])), sy=Math.round(Math.min(a[1],c[1]));
    const sw=Math.round(Math.abs(c[0]-a[0])), sh=Math.round(Math.abs(c[1]-a[1]));
    const g=document.getElementById('cv').getContext('2d');
    return {sx,sy,sw,sh,px:Array.from(g.getImageData(sx*DPR,sy*DPR,sw*DPR,sh*DPR).data),
            w:sw*DPR,h:sh*DPR,hour:__census().clock.hour,day:__census().clock.day};
  },{t,box,kill});
  await ctx.close(); return r;
}
const kill = arg('--kill', null);
const CAND = pathToFileURL(resolve('courtyard.html')).href;
const A = await grab(CAND);
const C = await grab(CAND);
const B = kill ? await grab(CAND, kill) : await grab(pathToFileURL('/tmp/head-courtyard.html').href);
await b.close();
function emit(X,Y,name){
  const n=X.px.length; const out=Buffer.alloc(n); let hit=0,sum=0;
  for(let i=0;i<n;i+=4){
    const d=Math.max(Math.abs(X.px[i]-Y.px[i]),Math.abs(X.px[i+1]-Y.px[i+1]),Math.abs(X.px[i+2]-Y.px[i+2]));
    if(d>3){hit++;sum+=d;}
    const v=Math.min(255,d*amp); out[i]=v;out[i+1]=v;out[i+2]=v;out[i+3]=255;
  }
  // write as a PNG via a headless canvas would need a browser; use raw PPM -> sips
  const ppm=Buffer.concat([Buffer.from(`P6\n${X.w} ${X.h}\n255\n`),
    Buffer.from(Uint8Array.from({length:X.w*X.h*3},(_,k)=>out[((k/3)|0)*4+(k%3)]))]);
  writeFileSync(`/tmp/${name}.ppm`,ppm);
  execSync(`sips -s format png /tmp/${name}.ppm --out shots/${name}.png >/dev/null 2>&1`);
  console.log(`${name}: ${hit} px over floor, mean d ${(hit?sum/hit:0).toFixed(1)}  (${X.w}x${X.h})`);
  return hit;
}
console.log(`box ${box}  simT ${t}  day ${A.day} h${A.hour.toFixed(1)}  amp x${amp}` + (kill ? `  vs [${kill}]` : '  vs HEAD'));
const floor = emit(A,C,`${tag}-floor`);
const real  = emit(A,B,`${tag}-delta`);
console.log(`ratio to floor: ${floor?(real/floor).toFixed(1)+'x':'floor 0 — every pixel below is the change'}`);
