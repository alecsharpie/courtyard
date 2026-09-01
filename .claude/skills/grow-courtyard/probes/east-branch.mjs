/* Per east-agent branch: gate, spawn hour, ARRIVAL hour at the stop, and how far the
 * stop is from the jetty head. Which far-side stops are reached in the MORNING? */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process'; import fs from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const NDAYS=+arg('--days',4), DAY0=+arg('--day0',12);
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const h=resolve(REPO,'.probe-head.html');
fs.writeFileSync(h, execSync('git show HEAD:courtyard.html',{cwd:REPO,maxBuffer:1<<28}));
const br = await chromium.launch(); const rows=[];
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  await page.goto(pathToFileURL(h).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0,NDAYS]) => {
    window.__reseed(); window.__warp(DAY0*55 - simT);
    const out=[]; let tag=0;
    const _se = spawnEastAgent;
    spawnEastAgent = function(nr,room){
      const before = agents.length; const v = _se(nr,room);
      for (let i=before;i<agents.length;i++){ const a=agents[i];
        a.__t = ++tag; a.__spawnH = +hour.toFixed(2);
        a.__branch = a.jetty?'jetty':a.nightRail?'rail':a.parapet?'parapet':
          (a.stop && a.stop.x===TOW_WALK)?'towpath':(a.stop && a.stop.x>RIVER_X1)?'green':
          (a.stop && a.stop.x>=QUAY_X0)?'quay':'plaza';
        a.__gx=a.x; a.__gy=a.y;
      }
      return v;
    };
    const seen=new Set();
    while (day < DAY0+NDAYS){
      window.__warp(0.25);
      for (const a of agents){
        if (a.__t && a.stopped && !seen.has(a.__t)){ seen.add(a.__t);
          out.push({b:a.__branch, s:a.__spawnH, arr:+hour.toFixed(2),
            sx:+a.stop.x.toFixed(1), sy:+a.stop.y.toFixed(1),
            dj:+Math.hypot(a.stop.x-JETTY.x, a.stop.y-JETTY.y).toFixed(1),
            comp: !!(a.with||a.pairLead||a.small)});
        }
      }
    }
    return out;
  }, [DAY0,NDAYS]);
  rows.push(...r); await page.close();
}
await br.close();
const by={}; for(const r of rows){ (by[r.b]=by[r.b]||[]).push(r); }
const med=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:NaN;
console.log('branch      n   spawnMed  arriveMed  arr<12h  walkMed(h)  distToJetty(med)  solo%');
for (const k of Object.keys(by).sort()){ const a=by[k];
  const walk=a.map(r=>r.arr-r.s).filter(x=>x>=0);
  console.log(`${k.padEnd(10)} ${String(a.length).padStart(3)}  ${med(a.map(r=>r.s)).toFixed(1).padStart(7)}  ${med(a.map(r=>r.arr)).toFixed(1).padStart(8)}  ${String(a.filter(r=>r.arr<12).length).padStart(6)}  ${med(walk).toFixed(1).padStart(9)}  ${med(a.map(r=>r.dj)).toFixed(1).padStart(15)}  ${(100*a.filter(r=>!r.comp).length/a.length).toFixed(0).padStart(4)}`);
}
const near = rows.filter(r=>r.dj<6);
console.log(`\nstops within 6 cells of the jetty head: ${near.length}; arriving <12h: ${near.filter(r=>r.arr<12).length}; solo ${near.filter(r=>!r.comp).length}`);
const nearM = near.filter(r=>r.arr<14 && !r.comp);
console.log(`  solo AND arriving before 14h: ${nearM.length} over 40 days = ${(nearM.length/40).toFixed(2)}/day`);
console.log('  their branches: ' + Object.entries(nearM.reduce((m,r)=>(m[r.b]=(m[r.b]||0)+1,m),{})).map(([k,v])=>`${k}=${v}`).join(' '));
