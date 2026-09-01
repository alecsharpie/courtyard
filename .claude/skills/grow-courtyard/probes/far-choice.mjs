/* Why does the jetty branch not get chosen? Instrument spawnFarAgent + farJettyFits. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const NDAYS=+arg('--days',4), DAY0=+arg('--day0',12);
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const FILE = resolve(REPO,'courtyard.html');
const br = await chromium.launch();
const branches={}, fails={}; const spawnH=[], arrH=[], fitH=[]; let n=0, days=0, fine=0, fineWithCross=0;
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0,NDAYS]) => {
    window.__reseed(); window.__warp(DAY0*55 - simT);
    const S={branches:{},fails:{},spawnH:[],arrH:[],fitH:[],n:0,perDay:{}};
    const _sf = spawnFarAgent;
    spawnFarAgent = function(){ const before=agents.length; const v=_sf();
      for (let i=before;i<agents.length;i++){ const a=agents[i]; a.__sh=+hour.toFixed(2);
        S.branches[a.farAt]=(S.branches[a.farAt]||0)+1; S.n++; }
      return v; };
    const _fj = farJettyFits;
    farJettyFits = function(speed, phase){
      let why=null;
      {
        const walk=farWalkH(FAR_JETTY,speed), arrive=hour+walk, trip=puntTripH({speed});
        const need=arrive+2*trip+puntStayH({phase})+walk;
        if (!(arrive+trip+PUNT_MIN_STAY_H < eastCloseHour())) why='close';
        else if (!(need < EVE_GONE)) why=`homeBy(need ${need.toFixed(1)})`;
      }
      if (why) S.fails[why.replace(/[\d.]+/,x=>Math.round(+x))] = (S.fails[why.replace(/[\d.]+/,x=>Math.round(+x))]||0)+1;
      else S.fitH.push(+hour.toFixed(2));
      return _fj(speed, phase);
    };
    const seen=new Set(); let lastLeg=punt.leg;
    while (day < DAY0+NDAYS){
      window.__warp(0.25);
      S.perDay[day]=S.perDay[day]||{fine:true,cross:0,n:0};
      const d=S.perDay[day]; d.n++; if (raining) d.fine=false;
      if (punt.leg===3 && lastLeg===2) d.cross++; lastLeg=punt.leg;
      for (const a of agents) if (a.far && a.stopped && !seen.has(a)){ seen.add(a); S.arrH.push([a.farAt,+hour.toFixed(2)]); }
    }
    return S;
  }, [DAY0,NDAYS]);
  for (const k in r.branches) branches[k]=(branches[k]||0)+r.branches[k];
  for (const k in r.fails) fails[k]=(fails[k]||0)+r.fails[k];
  arrH.push(...r.arrH); fitH.push(...r.fitH); n+=r.n;
  for (const k in r.perDay){ const d=r.perDay[k]; if (d.n<50) continue; days++; if (d.fine){ fine++; if (d.cross) fineWithCross++; } }
  await page.close();
}
await br.close();
const med=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:NaN;
console.log(`spawnFarAgent n=${n} over ${days} days = ${(n/days).toFixed(2)}/day`);
console.log('branches: ' + Object.entries(branches).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}=${v}`).join('  '));
console.log(`farJettyFits: fits ${fitH.length} (med hour ${med(fitH)}), fails: ` + Object.entries(fails).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}=${v}`).join('  '));
for (const k of ['mill','orchard','church','towpath','jetty']){ const a=arrH.filter(r=>r[0]===k).map(r=>r[1]);
  if (a.length) console.log(`  arrive ${k.padEnd(8)} n=${String(a.length).padStart(3)} median ${med(a).toFixed(1)}  <12h ${a.filter(x=>x<12).length}`); }
console.log(`FINE DAYS WITH A CROSSING: ${fineWithCross}/${fine}`);
