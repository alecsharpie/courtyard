// #90: the cart's way home from the stalls by END. Cart-market days traced 0.25 s at a time on 3 seeds.
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
async function run(seed, day0){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([day0]) => {
    window.__reseed(); window.__warp(day0 * 55);
    let seen = false, reached = false, last = null, inside = 0, maxStep = 0, steps = 0, mktSeen = false, hIn = null, hOut = null, exitEnd = null, bridge = 0, late = false;
    for (let i = 0; i < 55 / 0.25; i++){ window.__warp(0.25);
      if (marketActive()) mktSeen = true;
      if (cart){ const c = cart; if (!seen){ seen = true; hIn = +hour.toFixed(2); }
        if (c.at === 'market') reached = true;
        if (last){ const d = Math.hypot(c.x - last.x, c.y - last.y); if (d > maxStep) maxStep = d; steps++; }
        last = { x:c.x, y:c.y, out:c.out };
        if (c.x > RIVER_X0 && c.x < RIVER_X1 && c.y > 60) bridge++;
        for (const a of agents){ if (a.loader) continue; const u = (a.x - c.x) * c.hx + (a.y - c.y) * c.hy, v = Math.abs((a.x - c.x) * -c.hy + (a.y - c.y) * c.hx);
          if (u > -0.3 && u < CART_LEN + 0.3 && v < 1.0) inside++; }
      } else if (seen && last && exitEnd === null){ hOut = +hour.toFixed(2); exitEnd = last.x < 0 ? 'W' : last.x > GW ? 'E' : last.y < 0 ? 'N' : 'in(' + last.x.toFixed(1) + ',' + last.y.toFixed(1) + ')'; }
    }
    return { day:day0, eastHash:+hash(day0, 763).toFixed(2), cartDay: hash(day0, 733) < CART_P, mktDay: isMarketDay(), mktSeen, seen, reached, exitEnd, hIn, hOut, inside, maxStep:+maxStep.toFixed(2), steps, bridgeSamples: bridge };
  }, [day0]);
  await page.close(); return r;
}
const days = [10, 14, 22, 26, 30];
for (const seed of [1, 3]) for (const d of days){ const r = await run(seed, d); console.log(`seed ${seed}`, JSON.stringify(r)); }
await br.close();
