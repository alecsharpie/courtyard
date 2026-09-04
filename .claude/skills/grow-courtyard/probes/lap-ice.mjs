/* #200 premise: at midwinter, is there open water lying on the towpath beside iced margin?
 * ICE_CELLS is built from onChannel() at BUILD time, when col RIVER_X1 was still SIDE. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const PAGE = pathToFileURL(process.env.PAGE || 'courtyard.html').href;
const SEEDS = [7, 42, 1234];
const WARPS = [1160, 1220, 1280];
const b = await chromium.launch();
for (const seed of SEEDS) for (const w of WARPS){
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(250);
  const r = await p.evaluate(([w]) => {
    __reseed(); __warp(w);
    const inIce = new Set(ICE_CELLS);
    let lapWet = 0, lapIced = 0, lapInIce = 0, lapNextToIce = 0, lapSkin = 0, marginOn = 0;
    for (let k = 0; k < BANK_CELLS.length; k++){
      const i = BANK_CELLS[k];
      if (bankWas[i] !== SIDE) continue;
      if (grid[i] !== WATER && grid[i] !== ICE) continue;
      lapWet++;
      if (grid[i] === ICE) lapIced++;
      if (inIce.has(i)) lapInIce++;
      if (rice[i] > 0) lapSkin++;
      if (rice[i - 1] >= ICE_SET) lapNextToIce++;
    }
    for (const i of ICE_CELLS) if (rice[i] >= ICE_SET) marginOn++;
    return { lev: +riverLev().toFixed(3), season: +season().toFixed(4), margin: ICE_CELLS.length,
             frozen: marginOn, lapWet, lapIced, lapInIce, lapSkin, lapNextToIce,
             bankLap, skin: +riverSkin().toFixed(4) };
  }, [w]);
  console.log(`seed ${String(seed).padStart(4)} warp ${w}`, JSON.stringify(r));
  await p.close();
}
await b.close();
