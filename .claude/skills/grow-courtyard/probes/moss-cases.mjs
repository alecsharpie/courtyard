#!/usr/bin/env node
/* the cases a daylit autumn shot cannot see: the plaza at night, under a lying cover,
 * and on a phone. Errors are collected; the pictures are for the eye. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SHOTS = fileURLToPath(new URL('../../../../shots/', import.meta.url));
const FILE = fileURLToPath(new URL('../../../../courtyard.html', import.meta.url));
const CASES = [
  ['night',  2264.3, 22.5, 0,    1400, 900, 3],
  ['snow',   2264.3, 10.1, 0.75, 1400, 900, 3],
  ['phone',  2264.3, 10.1, 0,     390, 844, 0],
];
const browser = await chromium.launch();
for (const [name, t, targetHour, snow, w, h, quarter] of CASES){
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(resolve(FILE)).href + '?pause&seed=42&t=0', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ t, targetHour, snow, quarter }) => {
    window.__reseed(); window.__warp(t);
    let g = 0; while (g++ < 900 && !(hour > targetHour && hour < targetHour + 0.4)) window.__warp(0.2);
    if (snow) snowCover = snow;
    if (quarter){ window.__where(quarter); window.__where(undefined, 30); }
    groundDirty = true; drawScene(simT, 1 / 30);
    let mossy = 0, buried = 0;
    for (let y = 3; y < 61; y++) for (let x = PLAZA_X0; x < PLAZA_X1; x++){
      const i = y * GW + x; if (grid[i] !== PATH) continue;
      if (moss[i] > 1 / MOSS_BUCKET){ mossy++; if (snowAt(x, y, PATH) > 0.5) buried++; }
    }
    return { hour: +hour.toFixed(2), warmth: +warmth.toFixed(3), snow: +snowCover.toFixed(2), mossy, buried };
  }, { t, targetHour, snow, quarter });
  await page.screenshot({ path: join(SHOTS, `b103-case-${name}.png`) });
  console.log(`${name.padEnd(6)} hour ${String(r.hour).padStart(5)} warmth ${r.warmth} snow ${r.snow}  mossy ${r.mossy} (buried under the cover ${r.buried})`
    + (errs.length ? '  ERRORS ' + errs[0] : '  no page errors'));
  await page.close();
}
await browser.close();
