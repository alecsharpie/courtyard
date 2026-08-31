/* probe: replay the motion gate's dusk scene (t 1080) cart on HEAD vs the candidate — the
 * "cart moved N in one step (its median is 0.000)" flag is the median rule firing on a
 * reshuffle when the worst step's INSTANT matches on both builds. HEAD=/tmp/x.html to point at
 * a `git show HEAD:courtyard.html` dump (#92, #93). */import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch();
for (const [label, file] of [['HEAD', process.env.HEAD || '/tmp/courtyard-head.html'], ['CAND', 'courtyard.html']]) for (const seed of [7, 42]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await page.goto(`${pathToFileURL(resolve(REPO, file)).href}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => {
    window.__reseed(); window.__warp(1080);
    const steps = []; let prev = null;
    for (let i = 0; i < 240; i++){ window.__warp(0.25);
      const c = window.__entities().find(e => e.kind === 'cart'); if (!c){ prev = null; continue; }
      if (prev && prev.id === c.id) steps.push({ d: +Math.hypot(c.x - prev.x, c.y - prev.y).toFixed(2), h: +hour.toFixed(2), x: +c.x.toFixed(1), y: +c.y.toFixed(1) });
      prev = c; }
    const ds = steps.map(s => s.d).sort((a, b) => a - b);
    const worst = steps.reduce((a, b) => b.d > a.d ? b : a, { d: 0 });
    return { n: steps.length, median: ds[ds.length >> 1], p90: ds[Math.floor(ds.length * 0.9)], worst, moving: steps.filter(s => s.d > 0).length };
  });
  console.log(label, 'seed', seed, JSON.stringify(r));
  await page.close();
}
await browser.close();
