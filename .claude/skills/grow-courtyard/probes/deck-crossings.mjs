/* probe-deck — does the footbridge carry people both ways, does the boat go under it,
 * and what does alley → jetty cost before and after?  node probe-deck.mjs [file] */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = [3, 7, 11, 19, 23, 29, 31, 37, 41, 43];
const b = await chromium.launch();
let tot = {east:0, west:0, jetty:0, boats:0, under:0, firstMin:0, deckZ0:0, zmax:0, days:0};
for (const seed of SEEDS){
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    window.__reseed();
    const sp = 1.9, A = EAST_GATE_A;
    const before = pathHours(A[0], A[1], [[99.8, ALLEY_Y + 0.4], [105, 64], [105, LANE_N_Y], [PARK_GATE, LANE_N_Y],
      [PARK_GATE, 60.5], [TOW_WALK, 59], [TOW_WALK, JETTY.y + 1.3], [JETTY.x - 1.3, JETTY.y]], sp);
    const after = typeof DECK_LEAD_A === 'undefined' ? NaN :
      pathHours(A[0], A[1], DECK_LEAD_A.concat([[TOW_WALK, JETTY.y + 1.3], [JETTY.x - 1.3, JETTY.y]]), sp);
    const onDeck = a => a.y > 29.7 && a.y < 32.3 && a.x > RIVER_X0 && a.x < RIVER_X1;
    const side = new Map(); let east = 0, west = 0, jetty = 0, firstMin = 0, boats = 0, under = 0, deckZ0 = 0, zmax = 0;
    const seen = new WeakSet(), jset = new WeakSet(), bseen = new Set(); let lastBoatUnder = false;
    for (let i = 0; i < 11000; i++){       // 550 s = 10 days
      window.__warp(0.05);
      if (i % 5) continue;
      for (const a of agents){
        if (a.jetty && !jset.has(a)){ jset.add(a); jetty++; }
        if (onDeck(a)){
          const z = typeof agentZ === 'function' ? agentZ(a) : 0; zmax = Math.max(zmax, z);
          if (z < 1) deckZ0++;
          const was = side.get(a);
          if (was === undefined) side.set(a, a.x < (RIVER_X0 + RIVER_X1) / 2 ? 'W' : 'E');
        } else if (side.has(a)){
          const from = side.get(a); side.delete(a);
          if (a.x >= RIVER_X1 && from === 'W'){ east++; if (simT < 60) firstMin++; }
          if (a.x < RIVER_X0 && from === 'E'){ west++; if (simT < 60) firstMin++; }
        }
      }
      if (boat && !bseen.has(boat.id)){ bseen.add(boat.id); boats++; }
      const u = typeof boatUnderDeck === 'function' && boatUnderDeck();
      if (u && !lastBoatUnder) under++; lastBoatUnder = u;
    }
    return {before:+before.toFixed(1), after:+after.toFixed(1), east, west, jetty, firstMin, boats, under, deckZ0, zmax:+zmax.toFixed(2)};
  });
  console.log('seed', seed, JSON.stringify(out));
  for (const k of ['east','west','jetty','boats','under','firstMin','deckZ0']) tot[k] += out[k];
  tot.zmax = Math.max(tot.zmax, out.zmax); tot.days += 10; tot.before = out.before; tot.after = out.after;
  await p.close();
}
await b.close();
console.log('TOTAL over', tot.days, 'days:', JSON.stringify(tot));
console.log('per day: east→', (tot.east / tot.days).toFixed(2), ' west←', (tot.west / tot.days).toFixed(2), ' jetty standers', (tot.jetty / tot.days).toFixed(2));
