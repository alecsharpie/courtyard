// probe-eyot-shots.mjs — the Far bank quarter at its zoom (desktop 1400 px), day and night, plus a windy frame
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
import { pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const PAGE = pathToFileURL(resolve(new URL('../../../../courtyard.html', import.meta.url).pathname)).href;
const browser = await chromium.launch();
for (const [tag, t, wind] of [['day', 175, 0], ['windy', 175, 1], ['night', 175 + 55 * 0.5, 0], ['winter', 175 + 55 * 19, 0]]){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.error('PAGE ERROR', e));
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const at = await p.evaluate(([t, wind]) => {
    window.__reseed(); window.__warp(t);
    if (wind){ windSign = 1; windF = () => 1; }
    window.__where(4, 2);
    drawScene(simT, 1 / 30);
    return { hour: +hour.toFixed(2), season: +seasonPhase.toFixed(3), s: viewS, nightF: +nightF.toFixed(2), snow: +snowCover.toFixed(2) };
  }, [t, wind]);
  await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const box = await p.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await p.screenshot({ path: join(REPO, `shots/b85-farbank-${tag}.png`), clip: box });
  console.log(tag, JSON.stringify(at));
  await ctx.close();
}
await browser.close();
