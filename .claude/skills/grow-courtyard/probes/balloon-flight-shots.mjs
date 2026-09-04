#!/usr/bin/env node
/* balloon-flight-shots.mjs — one whole flight, six frames, wide (#188). */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const tag = process.argv[3] || 'bal';
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1600, height: 950 });
await p.goto(`${PAGE}?seed=42&t=0&pause`);
await p.waitForTimeout(300);
// find a flight
const t0 = await p.evaluate(() => {
  __reseed(); __setTime(0);
  for (let k = 0; k < 40000 && !balloon; k++) __warp(0.25, 1 / 30);
  return balloon ? simT : -1;
});
if (t0 < 0){ console.log('no flight found'); await b.close(); process.exit(1); }
console.log('flight starts at simT', t0.toFixed(2));
const GAP = +(process.argv[4] || 3.2), SKIP = +(process.argv[5] || 0);
for (let i = 0; i < 13; i++){
  const st = await p.evaluate(([i, GAP, SKIP]) => {
    if (!i && SKIP) __warp(SKIP, 1 / 30);
    if (i) __warp(GAP, 1 / 30);
    drawScene(simT, 0);
    return balloon ? { x: +balloon.x.toFixed(1), fall: +balloon.fall.toFixed(2), sa: +sunArc.toFixed(2),
                       dl: +daylight.toFixed(2), simT: +simT.toFixed(1) } : { gone: 1, simT: +simT.toFixed(1) };
  }, [i, GAP, SKIP]);
  await p.screenshot({ path: `shots/${tag}-${i}.png` });
  console.log(` ${i}  ${JSON.stringify(st)}`);
  if (st.gone) break;
}
await b.close();
