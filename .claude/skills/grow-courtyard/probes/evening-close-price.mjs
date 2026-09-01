/* b101 — price the CLOSE. For every far-side east retire (the stayOn source) and every
 * evening gate roll, compute the walk IN to each stay post and the walk OUT to the gate,
 * then score candidate (EVE_GONE, HURRY) rules: does a stand of >= EVE_STAND still fit,
 * and is the walker off the frame before 03h?
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i+1] ? process.argv[i+1] : d; };
const FILE = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : new URL('../../../../courtyard.html', import.meta.url).pathname;
const NDAYS = +arg('--days', 4), DAY0 = +arg('--day0', 4);
const SEEDS = [3,7,11,19,23,29,42,51,64,77];
const br = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0, NDAYS]) => {
    window.__reseed(); window.__warp(DAY0 * 55 - simT);
    const eq = (p,q) => Math.abs(p[0]-q[0])<1e-6 && Math.abs(p[1]-q[1])<1e-6;
    const deckPath = a => { const w = a.wp.slice(a.i); const k = w.findIndex(p => eq(p,[TOW_WALK,DECK_WALK]));
      if (k >= 0) return w.slice(0,k+1);
      if (Math.abs(a.x - TOW_WALK) < 0.3) return [[TOW_WALK, DECK_WALK]];
      return null; };
    const out = [];
    const POSTS = [126.5, 124.5, 122.5];
    const LEAD = DECK_LEAD_A.slice(0,4);
    for (let i = 0; day < DAY0 + NDAYS; i++){
      window.__warp(0.25);
      for (const a of agents){
        if (!a.east || a.nightRail || a.with || a.__seen) continue;
        if (!(a.stopped && a.state === 'walk')) continue;
        a.__seen = 1;
        if (a.x < RIVER_X1 - 1 || a.y > 60 || !eveWeather() || day < 1) continue;
        const way = (a.band && typeof bandWay === 'function') ? bandWay(a) : deckPath(a);
        if (!way) continue;
        const o = { day, h:+hourEve().toFixed(2), sd:+sunDown.toFixed(2), end:+eveEnd().toFixed(2),
                    speed:+a.speed.toFixed(2), band:!!a.band, posts:[] };
        for (const px of POSTS){
          const inH = pathHours(a.x, a.y, way.concat([[px, DECK_Y0+0.5]]), a.speed);
          const outH = pathHours(px, DECK_Y0+0.5, LEAD.slice().reverse().concat([EAST_GATE_A]), a.speed);
          o.posts.push({ px, in:+inH.toFixed(2), out:+outH.toFixed(2) });
        }
        out.push(o);
      }
    }
    return out;
  }, [DAY0, NDAYS]);
  r.forEach(o => { o.seed = seed; rows.push(o); });
  await page.close();
}
await br.close();
console.log(`far-side east retires in warm weather: ${rows.length} over ${SEEDS.length} seeds x ${NDAYS} days (${(rows.length/SEEDS.length/NDAYS).toFixed(2)}/night)`);
const hist = {}; for (const o of rows){ const b = Math.floor(o.h - o.sd); hist[b] = (hist[b]||0)+1; }
console.log('release hour rel sunDown:', Object.keys(hist).sort((a,b)=>a-b).map(k => `${k>=0?'+':''}${k}:${hist[k]}`).join(' '));
const HEADFIT = rows.filter(o => { const p = o.posts[0]; const arr = o.h + p.in; return arr >= o.sd - 2.5 && arr + 1 < o.end; }).length;
console.log(`HEAD rule (arrive>=sd-2.5, arrive+1<eveEnd) fits at 126.5: ${HEADFIT}`);
console.log('\nrule: leaveBy = min(eveEnd, GONE - out/HURRY); fit if arrive >= sd-EVE_LEAD and arrive + 1 <= leaveBy');
for (const GONE of [25.5, 26.0, 26.5, 26.8]) for (const HURRY of [1.4, 1.7, 2.0]){
  let fit = 0, stands = [], offs = [];
  for (const o of rows){
    for (const p of o.posts){
      const arr = o.h + p.in, ret = p.out / HURRY, leaveBy = Math.min(o.end, GONE - ret);
      if (arr < o.sd - 2.5 || arr + 1 > leaveBy) continue;
      fit++; stands.push(leaveBy - arr); offs.push(leaveBy + ret * 1.15); break;   // first post that fits, as stayOn does
    }
  }
  stands.sort((a,b)=>a-b); offs.sort((a,b)=>a-b);
  console.log(`  GONE ${GONE} HURRY ${HURRY}: fits ${fit}/${rows.length} (${(fit/SEEDS.length/NDAYS).toFixed(2)}/night)` +
    (stands.length ? `  stand med ${stands[stands.length>>1].toFixed(2)} max ${stands[stands.length-1].toFixed(2)}  off med ${offs[offs.length>>1].toFixed(2)} max ${offs[offs.length-1].toFixed(2)}` : ''));
}

// distributions
const ins = rows.map(o => o.posts[0].in).sort((a,b)=>a-b), outs = rows.map(o => o.posts[0].out).sort((a,b)=>a-b);
const q = (a,p) => a[Math.floor(a.length*p)].toFixed(2);
console.log(`\nwalk IN to 126.5 (h): min ${q(ins,0)} p25 ${q(ins,.25)} med ${q(ins,.5)} p75 ${q(ins,.75)} max ${ins[ins.length-1].toFixed(2)}`);
console.log(`walk OUT from 126.5 (h, unhurried): min ${q(outs,0)} med ${q(outs,.5)} max ${outs[outs.length-1].toFixed(2)}`);
console.log(`arrive rel sunDown: ` + (()=>{const a=rows.map(o=>o.h+o.posts[0].in-o.sd).sort((x,y)=>x-y);return `min ${q(a,0)} p25 ${q(a,.25)} med ${q(a,.5)} p75 ${q(a,.75)} max ${a[a.length-1].toFixed(2)}`})());
const headRows = rows.filter(o => { const p=o.posts[0]; const arr=o.h+p.in; return arr >= o.sd-2.5 && arr+1 < o.end; });
console.log(`\nthe ${headRows.length} that fit on HEAD:`);
const ha = headRows.map(o=>o.h+o.posts[0].in-o.sd).sort((x,y)=>x-y);
console.log(`  arrive rel sunDown: min ${q(ha,0)} med ${q(ha,.5)} max ${ha[ha.length-1].toFixed(2)}`);
const ho = headRows.map(o=>o.posts[0].out).sort((x,y)=>x-y);
console.log(`  walk out (unhurried): min ${q(ho,0)} med ${q(ho,.5)} max ${ho[ho.length-1].toFixed(2)}`);
for (const H of [1.4,1.7,2.0]){
  const off = headRows.map(o=>Math.min(o.end, 99) + o.posts[0].out/H*1.15).sort((a,b)=>a-b);
  console.log(`  HEAD stay to eveEnd, HURRY ${H}: off-frame med ${q(off,.5)} max ${off[off.length-1].toFixed(2)}`);
}
