/* b107 premise: is the far bank empty before noon, and does the punt ever run?
 * Far bank = east of the river (x > RIVER_X1 127): towpath, church green, orchard,
 * jetty, eyot, far deck posts. Counted by HOUR, summer days, fine or not recorded. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process'; import fs from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const NDAYS=+arg('--days',4), DAY0=+arg('--day0',12);
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const files = [];
if (arg('--head','1')==='1'){ const h=resolve(REPO,'.probe-head.html');
  fs.writeFileSync(h, execSync('git show HEAD:courtyard.html',{cwd:REPO,maxBuffer:1<<28})); files.push(['HEAD',h]); }
if (arg('--cand','1')==='1') files.push(['CAND', resolve(REPO,'courtyard.html')]);

const br = await chromium.launch();
for (const [label, FILE] of files){
  const byHour = {}, sampHour = {};
  let lastFar=0, claims=0, landings=0, days=0, fineDays=0, morningDayHits=0, fineMorningHits=0;
  const jettyArr=[], farArr=[];
  for (const seed of SEEDS){
    const page = await br.newPage({ viewport:{width:1200,height:720} });
    page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
    await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(([DAY0,NDAYS]) => {
      window.__reseed(); window.__warp(DAY0*55 - simT);
      const S={byHour:{},sampHour:{},claims:0,landings:0,perDay:{},jettyArr:[],farArr:[],lastFar:0};
      let lastLeg=punt.leg; const seenJetty=new Set(), seenFar=new Set();
      while (day < DAY0+NDAYS){
        window.__warp(0.25);
        const h = Math.floor(hour);
        const far = agents.filter(a => a.x > RIVER_X1 && !a.aboard);
        S.byHour[h]=(S.byHour[h]||0)+far.length; S.sampHour[h]=(S.sampHour[h]||0)+1;
        S.perDay[day]=S.perDay[day]||{morn:0,fine:!raining,grey:0,n:0};
        const d=S.perDay[day]; d.n++; d.grey=Math.max(d.grey,greyF?greyF():0);
        if (raining) d.fine=false;
        if (hour>=6 && hour<12 && far.length) d.morn++;
        if (punt.leg===1 && lastLeg===0) S.claims++;
        if (punt.leg===3 && lastLeg===2) S.landings++;
        lastLeg=punt.leg;
        for (const a of agents) if (a.far){ const hh = hour + (a.__d0!==undefined && day>a.__d0 ? 24 : 0);
          if (a.__d0===undefined) a.__d0=day;
          S.lastFar = Math.max(S.lastFar||0, hh); }
        for (const a of far){
          const id=a.__pid||(a.__pid=Math.random());
          if (!seenFar.has(id)){ seenFar.add(id); S.farArr.push(+hour.toFixed(2)); }
          if (a.jetty && !seenJetty.has(id)){ seenJetty.add(id); S.jettyArr.push(+hour.toFixed(2)); }
        }
      }
      return S;
    }, [DAY0,NDAYS]);
    for (const k in r.byHour){ byHour[k]=(byHour[k]||0)+r.byHour[k]; sampHour[k]=(sampHour[k]||0)+r.sampHour[k]; }
    claims+=r.claims; landings+=r.landings; lastFar=Math.max(lastFar, r.lastFar||0);
    for (const k in r.perDay){ const d=r.perDay[k]; if(d.n<50) continue; days++;
      if (d.morn) morningDayHits++; if (d.fine){ fineDays++; if (d.morn) fineMorningHits++; } }
    jettyArr.push(...r.jettyArr); farArr.push(...r.farArr);
    await page.close();
  }
  const med=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:NaN;
  console.log(`\n===== ${label} =====`);
  console.log('mean people east of the river, by hour:');
  let line=''; for (let h=0;h<24;h++){ const m=sampHour[h]?byHour[h]/sampHour[h]:0; line+=`${String(h).padStart(2)}:${m.toFixed(2)} `; if(h%6===5){console.log('  '+line);line='';} }
  const mornSamp=[...Array(6)].reduce((s,_,i)=>s+(sampHour[6+i]||0),0);
  const mornSum=[...Array(6)].reduce((s,_,i)=>s+(byHour[6+i]||0),0);
  console.log(`06-12 mean ${(mornSum/(mornSamp||1)).toFixed(3)}   days with ANY morning presence ${morningDayHits}/${days}  (fine days ${fineMorningHits}/${fineDays})`);
  console.log(`punt: ${claims} claims, ${landings} landings over ${days} days = ${(landings/days).toFixed(2)}/day`);
  console.log(`first-arrival hour east of river: n=${farArr.length} median ${med(farArr)}  <12h: ${farArr.filter(x=>x<12).length}`);
  console.log(`latest hour a far-source agent is still on frame: ${lastFar.toFixed(2)}`);
  console.log(`jetty standers: n=${jettyArr.length} median ${med(jettyArr)} min ${Math.min(...jettyArr).toFixed(1)} <12h: ${jettyArr.filter(x=>x<12).length}`);
}
await br.close();
