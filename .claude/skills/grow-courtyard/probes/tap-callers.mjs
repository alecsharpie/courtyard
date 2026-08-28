/* tap-callers — who calls in at the evening door besides its own roll? (#47)
 *  1. MARKET days folded over a year: does the trader / evening sweeper reach a
 *     TAP slot (act stand, caller 1), and in which seasons does the walk fit?
 *  2. CONCERT nights: the priced walk from the green vs the window, and whether any
 *     band id ever turns up as a tap id (expected 0 — and the margin says why).
 *  3. scarcity: the town's night rate term with the pavement full vs empty. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1400, height:840} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(FILE + '?pause&seed=42&t=0'); await p.waitForFunction(() => window.__warp);
const r = await p.evaluate(() => {
  __reseed();
  const out = {market:[], concert:[], scar:null};
  const H = 24 / DAY_LEN;
  for (let d = 2; d < 54; d++){
    __setTime(d * DAY_LEN + 0.4 * DAY_LEN);
    const mk = isMarketDay(), bd = isBandDay();
    if (!mk && !bd) continue;
    // start at the market's close / the band's end, warp through the evening to the shut
    const from = mk ? marketClose() : bandEnd();
    __setTime(d * DAY_LEN + (from - 6) / 24 * DAY_LEN);
    const bandIds = new Set(), callers = new Map(), tapIds = new Set();
    let priced = null;
    for (let k = 0; k < 200; k++){                  // 50 s: to the shut and past it
      __warp(0.25);
      for (const e of __entities()){
        if (e.band) bandIds.add(e.id);
        if (e.tap){ tapIds.add(e.id); if (e.caller && e.act === "stand") callers.set(e.id, e.role || e.kind); }
      }
      if (bd && priced === null && bandF() < 0.9 && bandF() > 0){
        const a = agents.find(a => a.band);
        if (a) priced = {walkH:+pathHours(a.x, a.y, a.wp.slice(a.i).concat([[PARK_GATE, LANE_N_Y],[TAP_SLOTS[0].x, TAP_SLOTS[0].y]]), a.speed).toFixed(1),
                         hour:+hourEve().toFixed(1), serveTo:TAP_SHUT - TAP_LAST, shut:TAP_SHUT, open:tapOpen()};
      }
      if (hourEve() > TAP_SHUT + 0.5 && hour > 6) break;
    }
    const row = {d, season:+seasonPhase.toFixed(2), warm:+warmth.toFixed(2), close:+from.toFixed(1),
                 callers:[...callers.values()], tapN:tapIds.size};
    if (mk) out.market.push(row);
    if (bd){ row.priced = priced; row.bandToTap = [...bandIds].filter(i => tapIds.has(i)).length; out.concert.push(row); }
  }
  return out;
});
console.log('1. MARKET DAYS — who called in at the door after the last stall came down');
for (const m of r.market) console.log(`   day ${String(m.d).padStart(2)} season ${m.season} warm ${m.warm} close ${m.close}  callers: ${m.callers.join(', ') || '-'}   (tap ids seen ${m.tapN})`);
const got = r.market.filter(m => m.callers.length).length;
console.log(`   -> ${got}/${r.market.length} market days had a caller reach the pavement   ${got > 0 ? 'PASS' : 'FAIL'}`);
console.log('\n2. CONCERT NIGHTS — the priced walk from the green');
for (const c of r.concert) console.log(`   day ${String(c.d).padStart(2)} warm ${c.warm} bandEnd ${c.close}  walk ${c.priced?.walkH}h from hour ${c.priced?.hour} (serving to ${c.priced?.serveTo}, shut ${c.priced?.shut}, open ${c.priced?.open})  band->tap ${c.bandToTap}`);
const anyFit = r.concert.some(c => c.priced && c.priced.hour + +c.priced.walkH < c.priced.shut);
console.log(`   -> walk fits inside the shut on ${r.concert.filter(c => c.priced && c.priced.hour + +c.priced.walkH < c.priced.shut).length}/${r.concert.length} nights;` +
            ` listeners who became tap ids: ${r.concert.reduce((s,c)=>s+c.bandToTap,0)}   ${anyFit ? 'CHECK' : 'PRICED OUT (send nobody)'}`);
console.log('   WOULD-CATCH: a caller row is non-zero only if callIn() re-routed someone — the market section shows the same code can.');
await b.close();
