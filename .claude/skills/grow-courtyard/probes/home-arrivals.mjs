/* spawnHomeAgent over ten seed-nights: rolls, refusals (no door fits), homer arrivals, and priced-vs-actual lag. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const tot = { calls: 0, refused: 0, spawned: 0, arrived: 0, lags: [], spans: [], fitsAtDusk: [] };
for (let seed = 1; seed <= 10; seed++){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    const DAY = 55, dayN = 3; window.__reseed();
    window.__setTime(dayN * DAY + DAY * (16 - 6) / 24); window.__warp(0.001);
    const duskAt = sunDown - NIGHT_K * dayHours;
    window.__setTime(dayN * DAY + DAY * (duskAt - 1 - 6) / 24); window.__warp(0.001);
    const o = { calls: 0, refused: 0, spawned: 0, arrived: 0, lags: [], span: +nightAt().span.toFixed(1), fits: null, homeDoors: 0 };
    const origS = spawnHomeAgent, origA = arriveHome;
    spawnHomeAgent = () => { o.calls++; const n = agents.length; origS(); if (agents.length === n) o.refused++; else o.spawned++; };
    arriveHome = a => { if (a.homer){ o.arrived++; const h = HOMES.get(a.home.sa * 1000 + a.home.sb); o.lags.push(+(nightAt().t - h.due).toFixed(2)); } origA(a); };
    let fitsDone = false;
    for (let i = 0; i < (14 * DAY / 24) / 0.05; i++){
      window.__warp(0.05);
      if (!fitsDone && nightF > 0.3){ fitsDone = true;
        o.homeDoors = HOME_DOORS.filter(d => windowHours(d.sa, d.sb)).length;
        o.fits = [-2.5, GW + 2.5].map(ex => HOME_DOORS.filter(d => { const w = windowHours(d.sa, d.sb); if (!w || d.nid === nightAt().nid) return false;
          return w.t + pathHours(ex, LANE_N_Y, [[d.x + 0.5, LANE_N_Y], [d.x + 0.5, 65.35]], 2.1) + HOME_MIN < w.last; }).map(d => d.x)); }
    }
    return o;
  });
  console.log('seed', seed, JSON.stringify(r));
  for (const k of ['calls','refused','spawned','arrived']) tot[k] += r[k];
  tot.lags.push(...r.lags); tot.spans.push(r.span);
  await p.close();
}
console.log('TOTAL', JSON.stringify(tot));
await b.close();
