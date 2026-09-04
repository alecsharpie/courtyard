/* b210: how long does the river's ice skin sit in the STATE before the ground cache
 * repaints and shows it? `stepIce` sets no groundDirty and there is no ice trigger among
 * the seven, so the skin is shown only when the light, the snow, the wet, the washing, a
 * barrow, the weeds or the wear next dirty the cache.
 *
 * Steps a freeze and a thaw at the frame's own dt (1/30 s) on a FRESH page each span (a
 * warp ADVANCES the clock, it does not set it), drawing whenever groundDirty is set — the
 * convention probes/ground-rebuilds.mjs uses. The DRAWN state is the per-cell bucket
 * drawIce() paints (ICE_BUCKET levels off rice[]/ICE_CAP) summed over ICE_CELLS: one
 * integer that changes exactly when a cell's drawn level does.
 *
 * Per span: repaints/day and WHY they fire, level crossings/day, and the lag from a
 * crossing to the repaint that shows it in SIM HOURS (24/55 per sim second) — mean, p95,
 * max — plus the share of the span the cache disagreed with the state. Then simulates the
 * candidate trigger at deadbands D: the EXTRA repaints/day it would add over what already
 * fires, and the lag and stale share it would leave.
 *   node ice-lag.mjs [file] [seeds] */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || new URL('../../../../courtyard.html', import.meta.url).pathname);
const SEEDS = (process.argv[3] || '7,42,99').split(',').map(Number);
const SPANS = [['freeze', 1000, 1140], ['thaw', 1260, 1360]];
const DBS = [0, 1, 2, 4, 8, 16];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
const rows = [];
for (const seed of SEEDS){
  const per = {};
  for (const span of SPANS){
    await p.goto(pathToFileURL(file).href + '?seed=' + seed + '&t=0&pause');
    await p.waitForFunction(() => window.__warp);
    per[span[0]] = await p.evaluate(async ({ span, DBS }) => {
      const [name, T0, T1] = span, HPS = 24 / 55, DT = 1 / 30;
      const lvNow = () => { let s = 0; for (let k = 0; k < ICE_CELLS.length; k++){
        const v = rice[ICE_CELLS[k]]; if (v > 0) s += Math.min(ICE_BUCKET - 1, (v / ICE_CAP) * ICE_BUCKET | 0); } return s; };
      window.__reseed(); window.__warp(T0 - simT);
      let lv = lvNow(), lvPainted = lv, pend = -1, repaints = 0, crossings = 0, stale = 0, n = 0, maxDrift = 0, driftSum = 0;
      const lags = [], why = { light: 0, snow: 0, wet: 0, other: 0 };
      const D = {};                        // per-deadband simulated schedule
      for (const d of DBS) D[d] = { painted: lv, pend: -1, extra: 0, stale: 0, lags: [] };
      let lvMin = lv, lvMax = lv, lvEnd = lv;
      for (let t = T0; t < T1; t += DT){
        window.__warp(DT); n++;
        const was = lv; lv = lvNow(); lvEnd = lv;
        if (lv < lvMin) lvMin = lv; if (lv > lvMax) lvMax = lv;
        if (lv !== was){ crossings++; if (pend < 0) pend = simT; for (const d of DBS) if (D[d].pend < 0) D[d].pend = simT; }
        const dirty = groundDirty;
        for (const d of DBS){
          const s = D[d], want = Math.abs(lv - s.painted) > d;
          if (dirty || want){
            if (!dirty && want) s.extra++;
            s.painted = lv;
            if (s.pend >= 0){ s.lags.push((simT - s.pend) * HPS); s.pend = -1; }
          }
          if (lv !== s.painted) s.stale++;
        }
        if (dirty){
          if (lightMoved()) why.light++; else if (Math.abs(snowCover - snowPainted) > SNOW_REPAINT) why.snow++;
          else if (wetBucket() !== wetPainted) why.wet++; else why.other++;
          drawScene(simT, 0); repaints++;
          if (pend >= 0){ lags.push((simT - pend) * HPS); pend = -1; }
          lvPainted = lv;
        }
        if (lv !== lvPainted) stale++;
        const dr = Math.abs(lv - lvPainted); if (dr > maxDrift) maxDrift = dr; driftSum += dr;
      }
      const days = (T1 - T0) / 55, stat = ls => { ls = ls.slice().sort((a, b) => a - b); return ls.length ? {
        n: ls.length, mean: +(ls.reduce((a, b) => a + b, 0) / ls.length).toFixed(3),
        p95: +ls[Math.min(ls.length - 1, Math.floor(ls.length * 0.95))].toFixed(3), max: +ls[ls.length - 1].toFixed(3) } : null; };
      return {
        repaintsPerDay: +(repaints / days).toFixed(1), why,
        crossingsPerDay: +(crossings / days).toFixed(1), lv: [lvMin, lvMax, lvEnd],
        maxDrift, meanDrift: +(driftSum / n).toFixed(2),
        lagH: stat(lags), staleShare: +(stale / n).toFixed(3), staleHours: +(stale * DT * HPS).toFixed(2),
        db: Object.fromEntries(DBS.map(d => [d, { extraPerDay: +(D[d].extra / days).toFixed(1),
          lag: stat(D[d].lags), staleShare: +(D[d].stale / n).toFixed(3) }])),
      };
    }, { span, DBS });
  }
  rows.push({ seed, ...per });
  for (const [name] of SPANS){ const r = per[name];
    console.log(`seed ${seed} ${name}: repaints/day ${r.repaintsPerDay} ${JSON.stringify(r.why)} crossings/day ${r.crossingsPerDay} lv ${JSON.stringify(r.lv)}`);
    console.log(`   lag(h) ${JSON.stringify(r.lagH)} stale ${r.staleShare} drift max ${r.maxDrift} mean ${r.meanDrift}`);
    for (const d of DBS) console.log(`   D=${d}: +${r.db[d].extraPerDay}/day  lag ${JSON.stringify(r.db[d].lag)}  stale ${r.db[d].staleShare}`);
  }
}
const mean = a => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3);
console.log('\nMEAN over ' + SEEDS.length + ' seeds');
for (const [name] of SPANS){ const rs = rows.map(r => r[name]);
  console.log(` ${name}: repaints/day ${mean(rs.map(r => r.repaintsPerDay))} crossings/day ${mean(rs.map(r => r.crossingsPerDay))} ` +
    `lag mean ${mean(rs.map(r => r.lagH ? r.lagH.mean : 0))} max ${Math.max(...rs.map(r => r.lagH ? r.lagH.max : 0)).toFixed(3)} stale ${mean(rs.map(r => r.staleShare))} ` +
    `drift max ${Math.max(...rs.map(r => r.maxDrift))} mean ${mean(rs.map(r => r.meanDrift))}`);
  for (const d of DBS) console.log(`   D=${d}: +${mean(rs.map(r => r.db[d].extraPerDay))}/day  lag mean ${mean(rs.map(r => r.db[d].lag ? r.db[d].lag.mean : 0))} max ${Math.max(...rs.map(r => r.db[d].lag ? r.db[d].lag.max : 0)).toFixed(3)}  stale ${mean(rs.map(r => r.db[d].staleShare))}`);
}
await b.close();
