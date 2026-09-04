/* probe: the ground is a CACHE, and a new dirty gate is charged at whatever cadence it
 * fires. weedBucket() quantizes 102 live scalars — if it trips every frame the whole
 * ground layer rebuilds every frame. Count REBUILDS per sim day, candidate v HEAD. */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const browser = await chromium.launch();
console.log('build   seed   sim days   ground rebuilds   per day   frames');
for (const [tag, file] of [['HEAD', '.probe-head.html'], ['cand', 'courtyard.html']]){
  for (const seed of [7, 42, 99]){
    const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
    const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
    await page.goto(pathToFileURL(resolve(REPO, file)).href + `?seed=${seed}&t=400`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(() => new Promise(res => {
      let n = 0, frames = 0; const g = window.drawGround;
      window.drawGround = function(){ n++; return g.apply(this, arguments); };
      const t0 = simT; const start = performance.now();
      const step = () => { frames++;
        if (performance.now() - start > 9000) res({ n, frames, days: (simT - t0) / 55 });
        else requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }));
    if (errs.length) console.error('PAGE ERROR', errs[0]);
    console.log(`${tag.padEnd(6)} ${String(seed).padStart(5)}  ${r.days.toFixed(2).padStart(8)}  ${String(r.n).padStart(15)}  ${(r.n/r.days).toFixed(1).padStart(8)}  ${String(r.frames).padStart(6)}`);
    await page.close();
  }
}
await browser.close();
