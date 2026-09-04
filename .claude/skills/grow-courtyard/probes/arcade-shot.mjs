#!/usr/bin/env node
/* #186 — the covered walk with people in it, and the same walk in the rain. Warps a
 * pinned seed forward until N people are standing under it, then shoots.
 * #198: --file, so the same shot can be taken on a pinned ref; and --zoom, which pushes a
 * quarter-shaped box on the north range and lets whereGo()'s ease run in REAL time (the
 * page is ?paused, so rAF keeps drawing the frozen instant) — at wide framing four people
 * under the vaults are four pixels, and the picture is the point. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));   // --file: the same shot on a pinned ref, so the two are comparable
const seed = arg('--seed', '42'), want = +arg('--n', 2), rain = argv.includes('--rain'), zoom = argv.includes('--zoom');
const W = +arg('--w', 1600), H = +arg('--h', 950);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGE ERROR', String(e)));
await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
await page.waitForFunction('typeof __warp === "function"');
const r = await page.evaluate(`(() => {
  __reseed();
  for (let k = 0; k < 40000; k++){
    __warp(0.25);
    const n = agents.filter(a => a.arc && a.state !== 'walk').length;
    if (n >= ${want} && (${rain} ? (raining || wetF() > 0.4) : daylight > 0.55)) {
      if (${zoom}){ QUARTERS.push({ name:'Arcade', x0:22, x1:52, y0:0, y1:16 }); whereGo(QUARTERS.length - 1); }
      else drawScene(simT, 0);
      return { n, simT:+simT.toFixed(1), day, hour:+hour.toFixed(2), raining:!!raining, wet:+wetF().toFixed(2) };
    }
  }
  return null;
})()`);
console.log(r);
if (r && zoom) await page.waitForTimeout(2000);   // the camera ease is 0.9 s of REAL time
if (r) await page.screenshot({ path: `shots/${arg('--out', rain ? '_arc-rain' : '_arc-day')}.png` });
await b.close();
