#!/usr/bin/env node
/* moon-month-shots.mjs — the moon at eight nights of one month, cropped to the disc (#188). */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const tag = process.argv[3] || 'moon';
const b = await chromium.launch();
const ctx = await b.newContext({ deviceScaleFactor: 6 });
const p = await ctx.newPage();
await p.setViewportSize({ width: 1200, height: 700 });
await p.goto(`${PAGE}?seed=42&t=0&pause`);
await p.waitForTimeout(300);
for (let d = 0; d < 30; d += 3){
  const t = 43.5 + d * 55;
  const info = await p.evaluate(t => {
    __reseed(); __setTime(t);
    drawScene(t, 0);
    const m = typeof moonDisc === 'function' ? moonDisc() : null;
    const r = cv.getBoundingClientRect();
    return { m, box: [r.left, r.top, r.width / W], ph: typeof moonPhase === 'function' ? +moonPhase().toFixed(3) : -1,
             lit: typeof moonLit === 'function' ? +moonLit().toFixed(3) : -1, night: +nightF.toFixed(2) };
  }, t);
  if (!info.m){ console.log(`d${d.toFixed(1)} no moon (night ${info.night})`); continue; }
  const [mx, my, mr] = info.m, [bl, bt, k] = info.box;
  const x = bl + mx * k, y = bt + my * k, s = Math.round(mr * k * 3.2);
  await p.screenshot({ path: `shots/${tag}-d${d.toFixed(0)}.png`,
    clip: { x: Math.max(0, x - s), y: Math.max(0, y - s), width: 2 * s, height: 2 * s } });
  console.log(`d${d.toFixed(1)}  phase ${info.ph}  lit ${info.lit}  -> shots/${tag}-d${d.toFixed(0)}.png`);
}
await b.close();
