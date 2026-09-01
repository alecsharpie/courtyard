/* b101 — trace every a.dusk agent's WHOLE life: choice -> walk -> post -> retire -> off.
 * Prints per-agent lines and the 03h census of the evening's people.
 *   node probe-eve-life.mjs [file] [--seeds 10] [--days 4] [--day0 4]
 */
import { homedir } from 'node:os'; import { resolve } from 'node:path'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i+1] ? process.argv[i+1] : d; };
const FILE = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : new URL('../../../../courtyard.html', import.meta.url).pathname;
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 4), DAY0 = +arg('--day0', 4);
const SEEDS = [3,7,11,19,23,29,42,51,64,77].slice(0, NS);
const br = await chromium.launch();
const all = [], night = [];
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0, NDAYS]) => {
    window.__reseed(); window.__warp(DAY0 * 55 - simT);
    const out = [], night = [];
    let lastN = -1;
    for (let i = 0; day < DAY0 + NDAYS; i++){
      window.__warp(0.25);
      const he = hourEve();
      for (const a of agents){
        if (!a.dusk || a.with) continue;
        if (!a.__t){
          a.__t = { seed:0, day, stay:!!a.stay, band:!!a.fromBand, sd:+sunDown.toFixed(2), end0:+eveEnd().toFixed(2),
                    chose:+he.toFixed(2), spot:a.stop ? [+a.stop.x.toFixed(1), +a.stop.y.toFixed(1)] : null,
                    speed:+a.speed.toFixed(2), pred:a.pred ? +a.pred.toFixed(2) : null,
                    from:[+a.x.toFixed(1), +a.y.toFixed(1)], ev:[], bell:0, bellH:0 };
          out.push(a.__t);
        }
        const t = a.__t;
        if (t.done !== undefined) continue;
        if (a.listen > 0 && !t.__inBell){ t.__inBell = 1; t.bell++; }
        if (!(a.listen > 0)) t.__inBell = 0;
        if (a.listen > 0) t.bellH += 0.25 * (24/55);
        const st = a.state + (a.listen>0?'/bell':'') + (a.greet>0?'/greet':'');
        if (t.last !== st){ t.ev.push(`${st}@${he.toFixed(2)}(${a.x.toFixed(0)},${a.y.toFixed(0)})`); t.last = st;
          if (a.state !== 'walk' && t.stood === undefined){ t.stood = +he.toFixed(2);
            t.onPost = a.stop ? +Math.hypot(a.x-a.stop.x, a.y-a.stop.y).toFixed(2) : null; }
          if (a.state === 'walk' && t.stood !== undefined && t.left === undefined) t.left = +he.toFixed(2); }
        if (a.home && !t.home) t.home = +he.toFixed(2);
      }
      for (const t of out) if (t.done === undefined && !agents.some(a => a.__t === t)){ t.done = +he.toFixed(2); }
      // the 03h sample, once per night
      if (he >= 27 && he < 27.3 && lastN !== day){
        lastN = day;
        const on = agents.filter(a => a.dusk);
        night.push({ day, n:on.length, who:on.map(a => `${a.state}${a.stay?'/stay':''}@(${a.x.toFixed(0)},${a.y.toFixed(0)})`) });
      }
    }
    for (const t of out) delete t.__inBell;
    return { out, night, sd:+sunDown.toFixed(2) };
  }, [DAY0, NDAYS]);
  r.out.forEach(t => { t.seed = seed; all.push(t); });
  r.night.forEach(t => { t.seed = seed; night.push(t); });
  await page.close();
}
await br.close();
const f = n => (+n).toFixed(2);
console.log(`== ${all.length} dusk agents over ${SEEDS.length} seeds x ${NDAYS} days`);
const stay = all.filter(t => t.stay), gate = all.filter(t => !t.stay);
for (const [nm, set] of [['gate arrivals', gate], ['stayers (stayOn)', stay]]){
  console.log(`\n-- ${nm}: ${set.length}`);
  const stood = set.filter(t => t.stood !== undefined);
  console.log(`   reached a post: ${stood.length}/${set.length}`);
  const dwell = stood.filter(t => t.left !== undefined).map(t => t.left - t.stood).sort((a,b)=>a-b);
  if (dwell.length) console.log(`   stand hours: min ${f(dwell[0])} med ${f(dwell[dwell.length>>1])} max ${f(dwell[dwell.length-1])}`);
  const lost = stood.filter(t => t.stood >= t.end0);
  console.log(`   stood AFTER eveEnd (post lost): ${lost.length}  (bell held ${lost.filter(t=>t.bell>0).length} of them)`);
  const offs = set.filter(t => t.done !== undefined).map(t => t.done - t.end0).sort((a,b)=>a-b);
  if (offs.length) console.log(`   off-frame minus eveEnd: min ${f(offs[0])} med ${f(offs[offs.length>>1])} max ${f(offs[offs.length-1])}  (${set.filter(t=>t.done===undefined).length} never left)`);
  const late = set.filter(t => t.done === undefined || t.done >= 27);
  console.log(`   still about at 03h: ${late.length}`);
  console.log(`   bell holds: ${set.reduce((s,t)=>s+t.bell,0)} over ${set.length}; mean held h ${f(set.reduce((s,t)=>s+t.bellH,0)/Math.max(1,set.length))}`);
}
console.log(`\n-- 03h samples: ${night.length} nights, ${night.filter(n=>n.n>0).length} with a dusk agent still out`);
for (const n of night.filter(n=>n.n>0).slice(0,12)) console.log(`   seed ${n.seed} day ${n.day}: ${n.n} :: ${n.who.join(' ')}`);
console.log('\n-- three whole lives:');
for (const t of stay.slice(0,3)) console.log(`  seed ${t.seed} d${t.day} sd ${t.sd} end ${t.end0} spot ${t.spot} speed ${t.speed}: ${t.ev.join(' ')} => off ${t.done}`);

console.log('\n-- never left / latest off:');
for (const t of all.filter(t => t.done === undefined)) console.log(`  NEVER seed ${t.seed} d${t.day} stay=${t.stay} spot ${t.spot} sd ${t.sd}: ${t.ev.join(' ')}`);
const late = all.filter(t => t.done !== undefined).sort((a,b)=>(b.done-b.end0)-(a.done-a.end0)).slice(0,5);
for (const t of late) console.log(`  LATE  seed ${t.seed} d${t.day} stay=${t.stay} spot ${t.spot} sd ${t.sd} end ${t.end0} off ${t.done} (+${(t.done-t.end0).toFixed(2)}): ${t.ev.join(' ')}`);
console.log('\n-- gate arrivals that lost the post to the bell:');
for (const t of gate.filter(t => t.stood !== undefined && t.stood >= t.end0)) console.log(`  seed ${t.seed} d${t.day} spot ${t.spot} end ${t.end0} stood ${t.stood} bells ${t.bell} heldH ${t.bellH.toFixed(2)}: ${t.ev.join(' ')}`);
