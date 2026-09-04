/* probe: are there birds AT the colony, and are they at the NESTS? Presence, not a
 * per-instant crop: sampled every 0.25 s of a midsummer day. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const CASES = [[7,600],[1234,585],[99,1590],[42,1600],[5,1600],[271,1590]];
const browser = await chromium.launch();
console.log('seed warp nests | samples  meanAloft  meanClinging  %samples>=1 clinging  offNest  daylitShare');
for (const [seed, warp] of CASES){
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(w => {
    window.__reseed(); window.__warp(w);
    let n=0, aloft=0, cling=0, any=0, off=0, lit=0;
    const rows = {};
    for (let k=0;k<440;k++){                      // 110 sim seconds = two sim days
      window.__warp(0.25);
      const ms = birds.filter(b=>b.mart);
      n++; aloft += ms.length;
      const c = ms.filter(b=>b.state==='cling');
      cling += c.length; if (c.length) any++;
      if (daylight > 0.25) lit++;
      for (const b of c){
        const gx = Math.round(b.x - 0.5), gy = b.y - 1;
        if (mart[gy*GW+gx] < MART_SET) off++;
        rows[gy] = (rows[gy]||0)+1;
      }
    }
    return {n, aloft, cling, any, off, lit, on: martOn, rows};
  }, warp);
  if (errs.length) console.error('PAGE ERROR', errs[0]);
  console.log(`${String(seed).padStart(4)} ${String(warp).padStart(4)} ${String(r.on).padStart(5)} |`
    + ` ${String(r.n).padStart(6)}  ${(r.aloft/r.n).toFixed(2).padStart(8)}  ${(r.cling/r.n).toFixed(2).padStart(11)}`
    + `  ${(100*r.any/r.n).toFixed(1).padStart(17)}%  ${String(r.off).padStart(6)}`
    + `  ${(100*r.lit/r.n).toFixed(0).padStart(9)}%   rows ${JSON.stringify(r.rows)}`);
  await page.close();
}
await browser.close();
