/* Where the new water passes spend their time, per quarter, on a windy day.
 * Four variants of the SAME build, so the only difference is which pass runs. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const T0=+arg('--t','345');
const QUARTERS=['Wide','Courtyard','Street','Plaza','Far bank'];
const VARIANTS={
  full:'',
  'no-reeds':'REED_CASTERS.length=0',
  'no-shade':'drawWaterShade=()=>{}',
  'neither':'REED_CASTERS.length=0; drawWaterShade=()=>{}',
  'flat-ink':'reedInk=(a,b,c)=>c',
  'noop-draw':'drawReeds=()=>{}',
};
async function run(file,q,kill){
  const p = await b.newPage({viewport:{width:1600,height:950}});
  await p.goto(pathToFileURL(resolve(file)).href+'?seed=42&t=0&pause');
  await p.waitForFunction(()=>window.__warp);
  const r = await p.evaluate(([T0,q,kill])=>{
    window.__reseed(); window.__warp(T0); window.__where(q); window.__where(q,3);
    if (kill) eval(kill);
    let draw=0; const n=250;
    for(let i=0;i<n;i++){const a=performance.now(); drawScene(simT+i/30,1/30); draw+=performance.now()-a;}
    return {ms:+(draw/n).toFixed(3), wind:+windF().toFixed(2), f:+sunShadeF().toFixed(3)};
  },[T0,q,kill]);
  await p.close(); return r;
}
console.log(`seed 42 t ${T0}, 250 frames per cell\n`);
console.log('quarter      ' + Object.keys(VARIANTS).map(k=>k.padStart(10)).join('') + '   HEAD');
for (let qi=0; qi<QUARTERS.length; qi++){ const q=qi;
  const out=[];
  for (const k of Object.keys(VARIANTS)) out.push((await run('courtyard.html',q,VARIANTS[k])).ms);
  const h=(await run('/tmp/head.html',q,'')).ms;
  console.log(QUARTERS[qi].padEnd(12) + out.map(v=>String(v).padStart(10)).join('') + '   ' + h);
}
await b.close();
