/* #200 invariant sweep: over a whole year, at every sample —
 *   (a) no SIDE cell of the towpath ever carries a skin (ice on dry paving), and
 *   (b) no lap cell is ICE while the level is off it (a slab stranded on the path), and
 *   (c) iceMargin() is exactly the cells the step walked, and equals ICE_CELLS.length
 *       only when every lap cell is wet.
 * Plus the ledger numbers: lap cells iced, by season. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const PAGE = pathToFileURL(process.env.PAGE || 'courtyard.html').href;
const SEEDS = [7, 42, 1234, 5, 99, 2024];
const b = await chromium.launch();
let bad = 0, samples = 0, wetTicks = 0, icedTicks = 0, everIced = 0, peak = 0;
for (const seed of SEEDS){
  const p = await b.newPage();
  p.on('pageerror', e => { console.log('PAGEERROR', String(e)); bad++; });
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(250);
  const r = await p.evaluate(() => {
    __reseed();
    const out = { viol: [], rows: [], nLap: 0, peak: 0, wet: 0, iced: 0, n: 0, evenIced: 0 };
    for (let i = 0; i < GW * WH; i++) if (iceLap[i]) out.nLap++;
    for (let step = 0; step < 143; step++){          // 143 x 10 s = 1430 s = one year
      __warp(10);
      let dryWithSkin = 0, strandedIce = 0, wet = 0, iced = 0;
      const lev = riverLev();
      for (let k = 0; k < ICE_CELLS.length; k++){
        const i = ICE_CELLS[k];
        if (!iceLap[i]) continue;
        const isWet = lev > bankBed[i];
        if (grid[i] === SIDE && rice[i] > 0) dryWithSkin++;
        if (!isWet && grid[i] === ICE) strandedIce++;
        if (grid[i] !== SIDE) wet++;
        if (grid[i] === ICE) iced++;
      }
      if (dryWithSkin || strandedIce)
        out.viol.push({ step, season: +season().toFixed(3), dryWithSkin, strandedIce });
      if (iceMargin() !== ICE_CELLS.length - (out.nLap - wet))
        out.viol.push({ step, marginMismatch: [iceMargin(), ICE_CELLS.length, wet] });
      out.n++; out.wet += wet; out.iced += iced;
      if (iced) out.evenIced++;
      out.peak = Math.max(out.peak, iced);
    }
    return out;
  });
  samples += r.n; wetTicks += r.wet; icedTicks += r.iced; everIced += r.evenIced;
  peak = Math.max(peak, r.peak);
  bad += r.viol.length;
  console.log(`seed ${String(seed).padStart(4)}  lapCells ${r.nLap}  peakIced ${r.peak}  samplesWithIce ${r.evenIced}/${r.n}  violations ${r.viol.length}`,
              r.viol.length ? JSON.stringify(r.viol.slice(0, 4)) : '');
  await p.close();
}
await b.close();
console.log(`\nTOTAL ${samples} samples x 6 seed-years: violations ${bad}, peak lap cells iced ${peak}, samples with any lap ice ${everIced}`);
process.exit(bad ? 1 : 0);
