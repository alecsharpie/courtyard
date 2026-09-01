/* nearScale() is a ramp over the whole town, so the claim "nothing that already existed
 * changed size" has to be MEASURED, not asserted: max nearScale over every non-roof bird
 * and over the lane cat, across seeds and a full year. Anything but 1.000 is a regression.
 * usage: node probe-near-identity.mjs [seeds=8] */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const ART = path.join(REPO, 'courtyard.html');
const N = +(process.argv[2] || 8);
const br = await chromium.launch();
let worstBird = 1, worstCat = 1, nB = 0, nC = 0, worstRoof = 0, worstCatRoof = 0;
for (let seed = 1; seed <= N; seed++){
  const p = await br.newPage();
  await p.goto('file://' + ART + `?seed=${seed}&t=0&pause`); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    window.__reseed(); let wb = 1, wc = 1, nb = 0, nc = 0, wr = 0, wcr = 0;
    for (let i = 0; i < 2400; i++){
      window.__warp(0.25);
      for (const b of birds){
        if (b.roof) wr = Math.max(wr, nearScale(b.y));
        else { nb++; wb = Math.max(wb, nearScale(b.y)); }
      }
      if (catA){ if (catA.leg === 'lane'){ nc++; wc = Math.max(wc, nearScale(catA.y)); }
                 else wcr = Math.max(wcr, nearScale(catA.y)); }
    }
    return { wb, wc, nb, nc, wr, wcr };
  });
  worstBird = Math.max(worstBird, r.wb); worstCat = Math.max(worstCat, r.wc);
  worstRoof = Math.max(worstRoof, r.wr); worstCatRoof = Math.max(worstCatRoof, r.wcr);
  nB += r.nb; nC += r.nc; await p.close();
}
await br.close();
console.log(`non-roof birds  n=${nB}  max nearScale ${worstBird.toFixed(6)}  ${worstBird === 1 ? 'PASS (unchanged)' : 'FAIL'}`);
console.log(`cat on the lane n=${nC}  max nearScale ${worstCat.toFixed(6)}  ${worstCat === 1 ? 'PASS (unchanged)' : 'FAIL'}`);
console.log(`roof birds      max nearScale ${worstRoof.toFixed(3)} · cat on the roof max ${worstCatRoof.toFixed(3)}  (the predicate DOES fire)`);
