#!/usr/bin/env node
/* probe: the bonfire column as a person actually sees it — a FULL 1200x720 DSF-1 wide frame
 * at a real kindle hour, plus a 300x260 crop over the heap. Warped from the DEFAULT start on
 * the seed/day bonfire-year.mjs reports a fire on, so the shot witnesses the probe's world.
 *   node bonfire-1x.mjs <label> [pathToHtml]      CASES=7:12,42:12 node bonfire-1x.mjs before
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const LABEL = process.argv[2] || 'x';
const PAGE = pathToFileURL(resolve(REPO, process.argv[3] || 'courtyard.html')).href;
const CASES = (process.env.CASES || '7:12,42:12').split(',').map(s => { const [seed, day] = s.split(':').map(Number); return { seed, day }; });
const browser = await chromium.launch();
for (const { seed, day } of CASES) {
  const c = await browser.newContext({ viewport: { width: 1200, height: 720 }, deviceScaleFactor: 1 });
  const p = await c.newPage(); p.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(targetDay => {
    window.__reseed();
    let g = 0; while (g++ < 4000 && !(day === targetDay && bon.fire > 0.85)) window.__warp(0.5);
    drawScene(simT, 1 / 30);
    const rc = cv.getBoundingClientRect();
    const [sx, sy] = project(BONFIRE.x, BONFIRE.y, 0);
    return { off: [rc.left, rc.top], screen: [Math.round(sx), Math.round(sy)], hour: +hour.toFixed(2), fire: +bon.fire.toFixed(2), day, ok: bon.fire > 0.85 };
  }, day);
  console.log(`s${seed} d${day}`, JSON.stringify(r));
  await p.screenshot({ path: `${REPO}shots/${LABEL}-bonfire-wide-s${seed}d${day}.png` });
  await p.screenshot({ path: `${REPO}shots/${LABEL}-bonfire-crop-s${seed}d${day}.png`,
    clip: { x: r.screen[0] + r.off[0] - 150, y: r.screen[1] + r.off[1] - 210, width: 300, height: 260 } });
  await c.close();
}
await browser.close();
