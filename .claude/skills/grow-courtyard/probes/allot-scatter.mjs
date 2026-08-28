// probe: the opening scatter and the produce pipe. Over N seeds: species standing in allotment
// plots at t=0, every non-vegetable cell x CA-step in the block over a folded year, and whether
// any non-vegetable ever reaches mkShelf. Run on HEAD at #41 it read FAIL 8/10; after, PASS.
// usage: node allot-scatter.mjs [seeds=10] [days=26]
// Over N seeds: species in allotment plots at t=0, and whether any non-veg ever reaches mkShelf in a folded year.
import path from 'path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const html = 'file://' + path.resolve(new URL('.', import.meta.url).pathname, '../../../../courtyard.html');
const N = +(process.argv[2] || 10), DAYS = +(process.argv[3] || 26);
const SPECIES_VEG = new Set(['carrots','cabbages','beans','pumpkins']);
const br = await chromium.launch(); let bad = 0;
for (let seed = 1; seed <= N; seed++){
  const pg = await br.newPage({ viewport:{width:1200,height:900} });
  pg.on('pageerror', e => { console.log('PAGEERROR', e.message); bad++; });
  await pg.goto(html + `?seed=${seed}&pause`); await pg.waitForFunction(() => typeof __warp === 'function');
  const r = await pg.evaluate((DAYS) => {
    const at0 = { allot:{}, court:{} };
    for (let y = 3; y < 61; y++) for (let x = 0; x < GW; x++){ const j = y*GW+x; if (!bSp[j]) continue;
      const k = inAllotment(x,y) ? 'allot' : 'court', nm = SPECIES[bSp[j]-1].name; at0[k][nm] = (at0[k][nm]||0)+1; }
    const badShelf = new Set(); let badPlot = 0, shelfMax = 0;
    for (let d = 0; d < DAYS * 4; d++){ __warp(55/4);
      for (const s of mkShelf){ if (!SPECIES[s-1].veg) badShelf.add(SPECIES[s-1].name); }
      shelfMax = Math.max(shelfMax, mkShelf.length);
      for (let y = 3; y < 61; y++) for (let x = ALT_X0; x < 96; x++){ const j = y*GW+x; if (bSp[j] && (grid[j]===BED||grid[j]===CBED) && !SPECIES[bSp[j]-1].veg) badPlot++; }
    }
    return { at0, badShelf:[...badShelf], badPlot, shelfMax, produce: produce.map(v=>+v.toFixed(1)) };
  }, DAYS);
  const nonVeg0 = Object.keys(r.at0.allot).filter(n => !SPECIES_VEG.has(n));
  console.log(`seed ${seed}: allot@0 ${JSON.stringify(r.at0.allot)} court@0 ${JSON.stringify(r.at0.court)} | nonveg-in-plots(cells×steps) ${r.badPlot} | nonveg on shelf ${JSON.stringify(r.badShelf)} shelfMax ${r.shelfMax}`);
  if (nonVeg0.length || r.badPlot || r.badShelf.length) bad++;
  await pg.close();
}
await br.close(); console.log(bad ? `FAIL ${bad}` : 'PASS'); process.exit(bad ? 1 : 0);

