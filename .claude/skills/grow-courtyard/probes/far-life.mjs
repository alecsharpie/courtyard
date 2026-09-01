/* How long does a far-source agent actually live? Lifetime in sim HOURS, by branch —
 * measured as a simT delta, never as a clock delta (the day rolls at hour 6.00). */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const br = await chromium.launch(); const lives=[];
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e=>console.log('PAGEERROR',seed,e.message));
  await page.goto(pathToFileURL(resolve(REPO,'courtyard.html')).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(()=>typeof window.__warp==='function');
  const r = await page.evaluate(()=>{
    window.__reseed(); window.__warp(12*55 - simT);
    const born=new Map(), out=[];
    const _sf=spawnFarAgent;
    spawnFarAgent=function(){ const b=agents.length; const v=_sf();
      for(let i=b;i<agents.length;i++) born.set(agents[i], {t:simT, k:agents[i].farAt, punt:false});
      return v; };
    while (simT < 16*55){
      window.__warp(0.25);
      for (const [a,m] of born){ if (a.eyot||a.aboard) m.punt=true;
        if (a.done || !agents.includes(a)){ out.push({k:m.k, h:(simT-m.t)*24/55, punt:m.punt}); born.delete(a); }
        else m.last=(simT-m.t)*24/55; }
    }
    for (const [a,m] of born) out.push({k:m.k, h:m.last||0, punt:m.punt, alive:true});
    return out;
  });
  lives.push(...r); await page.close();
}
await br.close();
const med=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:NaN;
for (const k of ['mill','orchard','church','towpath','jetty']){
  const a=lives.filter(r=>r.k===k).map(r=>r.h);
  if (a.length) console.log(`${k.padEnd(8)} n=${String(a.length).padStart(3)} median ${med(a).toFixed(1)}h  max ${Math.max(...a).toFixed(1)}h`);
}
const p=lives.filter(r=>r.punt).map(r=>r.h);
console.log(`took the punt: n=${p.length} median ${med(p).toFixed(1)}h max ${Math.max(...p).toFixed(1)}h`);
const over=lives.filter(r=>r.h>20);
console.log(`lifetimes over 20h: ${over.length}/${lives.length}` + (over.length?`  -> ${over.slice(0,6).map(r=>`${r.k}:${r.h.toFixed(1)}h${r.alive?'(alive at cutoff)':''}`).join(' ')}`:''));
