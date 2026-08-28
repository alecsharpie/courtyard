#!/usr/bin/env node
/* probe: the same stretch of river, pinned at the same HOUR in two opposite seasons,
 * on HEAD and here. b22's success criterion is "visibly different water" — a whole
 * frame is the wrong crop for that, since the river is a tenth of it and the trees
 * and the light are shouting. So this clips to the channel itself, computed from
 * project() rather than guessed, and reports the mean colour of the crop so the
 * difference is a number as well as a picture.
 *
 * Pinned with ?pause + __warp(): noon of day 6 is midsummer, noon of day 19 midwinter,
 * and both are hour 13.75 — phase varies, hour held, per the pinning law.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT = join(REPO, 'shots');
mkdirSync(OUT, { recursive: true });
const FILES = { head: '/tmp/courtyard-head.html', here: join(REPO, 'courtyard.html') };
const noon = d => d * 55 + 13.75;
const SHOTS = [{ name: 'summer', t: noon(6) }, { name: 'winter', t: noon(19) }];

const browser = await chromium.launch();
for (const [label, file] of Object.entries(FILES)) {
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(`${pathToFileURL(file).href}?pause&seed=42&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const info = await page.evaluate(t => {
      window.__reseed(); window.__warp(t);
      const c = window.__census();
      // the channel, north of the bridge, in page pixels — read off project(), and
      // offset by the canvas' own position in the document
      const r = cv.getBoundingClientRect();
      const a = project(FOUNTAIN.x - 7, FOUNTAIN.y - 8, 0), b = project(FOUNTAIN.x + 7, FOUNTAIN.y + 9, 0);
      return { clip: { x: r.x + a[0], y: r.y + a[1], w: b[0] - a[0], h: b[1] - a[1] },
               hour: +c.clock.hour.toFixed(2), season: +c.clock.season.toFixed(3),
               run: typeof fountainPlay === "function" ? +fountainPlay().toFixed(3) : 1,
               boat: !!boat, cloud: +c.clock.cloud.toFixed(2),
               // the channel's own colour, before any light or weather touches it —
               // the mean below is a photograph and moves with the cloud, this does not
               deep: groundCol(105, 30, grid[30 * GW + 105], hash(105, 30), maturity()) };
    }, s.t);
    await page.waitForTimeout(700);
    const path = join(OUT, `fountain-${s.name}-${label}.png`);
    const clip = { x: Math.round(info.clip.x), y: Math.round(info.clip.y),
                   width: Math.round(info.clip.w), height: Math.round(info.clip.h) };
    await page.screenshot({ path, clip });
    // mean colour of the crop, straight off the canvas, so "greyer / greener" is a number
    const mean = await page.evaluate(c => {
      const r = cv.getBoundingClientRect(), d = cv.getContext('2d')
        .getImageData((c.x - r.x) * DPR, (c.y - r.y) * DPR, c.width * DPR, c.height * DPR).data;
      let R = 0, G = 0, B = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; }
      return [R / n, G / n, B / n].map(v => +v.toFixed(2));
    }, clip);
    console.log(`${label.padEnd(5)} ${s.name.padEnd(7)} hour ${info.hour}  season ${info.season}` +
      `  play ${String(info.run).padEnd(5)}  cloud ${info.cloud}  boat ${info.boat ? 'yes' : 'no '}` +
      `  mean rgb ${mean.join(', ')}  g-b ${(mean[1] - mean[2]).toFixed(2)}  channel ${info.deep}` +
      `${errs.length ? '  PAGE ERROR ' + errs[0] : ''}`);
    if (errs.length) process.exitCode = 1;
    await page.close();
  }
}
await browser.close();
