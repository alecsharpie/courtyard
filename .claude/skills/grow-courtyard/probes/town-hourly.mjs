/* People on frame BY HOUR of the day, and how OLD they are. Written for b161, whose
 * premise was that the dawn hour is empty; the shape here is the answer to "is the
 * night a population or a residue" for any hour, not just that one. A walk across the
 * 138-cell world is ~26 sim hours at 5.2 cells/h, so an age of half a day is a WALKER
 * still walking, not a leak — what a leak would look like is a count that never
 * saturates day over day (it does: see the h03 row). */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const NDAYS=+arg('--days',8), DAY0=+arg('--day0',2), SEEDS=arg('--seeds','42').split(',').map(Number);
const br = await chromium.launch();
const sum={}, cnt={}, ages=[], byDay={};
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
  await page.goto(pathToFileURL(resolve(REPO,'courtyard.html')).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0,NDAYS]) => {
    window.__reseed(); window.__warp(DAY0*55 - simT);
    const S={sum:{},cnt:{},ages:[],rows:{}};
    const ph = h => ((h - 6 + 24) % 24) / 24;
    let pPrev=(simT%55)/55, dPrev=day;
    while (day < DAY0+NDAYS){
      window.__warp(0.25);
      for (const a of agents) if (a.__born === undefined) a.__born = simT;   // lower bound for day-DAY0 residents
      const h = Math.floor(hour), on = agents.filter(a=>a.x>-1&&a.x<GW+1).length;
      S.sum[h]=(S.sum[h]||0)+on; S.cnt[h]=(S.cnt[h]||0)+1;
      const p=(simT%55)/55;
      for (const [nm,pt] of [['h03',ph(3)],['h15',ph(15)],['morn',ph(sunUp+0.5)]]){
        const crossed = day===dPrev ? (pPrev<pt && p>=pt) : (pPrev<pt || p>=pt);
        if (!crossed) continue;
        (S.rows[nm] ||= []).push(on);
        if (nm==='morn') for (const a of agents) S.ages.push(+((simT-a.__born)*24/55).toFixed(2));
      }
      pPrev=p; dPrev=day;
    }
    return S;
  }, [DAY0,NDAYS]);
  for (const k in r.sum){ sum[k]=(sum[k]||0)+r.sum[k]; cnt[k]=(cnt[k]||0)+r.cnt[k]; }
  for (const k in r.rows) (byDay[k] ||= []).push(...r.rows[k]);
  ages.push(...r.ages);
  await page.close();
}
console.log(`people on frame by hour  (seeds ${SEEDS.join(',')}, days ${DAY0}..${DAY0+NDAYS-1})`);
for (let h=0;h<24;h++){ const m=cnt[h]?sum[h]/cnt[h]:0;
  console.log(String(h).padStart(2)+': '+(cnt[h]?m.toFixed(2):'-').padStart(6)+'  '+'#'.repeat(Math.round(m))); }
for (const k in byDay) console.log('\n'+k.padEnd(5)+' by day: '+byDay[k].join(' '));
const s = ages.slice().sort((a,b)=>a-b);
console.log(`\nage at sunUp+0.5 (sim HOURS since first seen): n=${s.length} med ${s[s.length>>1]} p90 ${s[Math.floor(s.length*.9)]} max ${s[s.length-1]}`
  + `\n  >6h ${s.filter(x=>x>6).length}  >12h ${s.filter(x=>x>12).length}  >24h ${s.filter(x=>x>24).length}   (a world crossing is ~26 h)`);
await br.close();
