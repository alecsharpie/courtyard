#!/usr/bin/env node
/* throwaway: three birds are SPAWNED — how many are SEEN? A bird north or east of
 * the fountain sorts ahead of it (items are y-sorted and the fountain sits at
 * FOUNTAIN.y+1.2), so the basin and its plume can draw straight over one.
 *
 * Leave-one-out, not patch-sampling: a patch centred on a bird's ground anchor
 * misses a sprite drawn above it and reports a visible bird as hidden. Instead
 * shoot the crop with all three birds, then again with bird k spliced out. If the
 * frame does not change, bird k contributed no pixels — it is behind something. */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(`${PAGE}?seed=42&pause&t=175`);
await p.waitForFunction('typeof window.__census === "function"');
const box = await p.locator('#cv').boundingBox();
const draw = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

const CASES = [
  ['roundel-n', 105, 27], ['roundel-s', 105, 33], ['roundel-w', 103, 30], ['roundel-e', 108, 30],
  ['roundel-ne',107, 27], ['roundel-sw',103, 33],
  ['plaza-open',105, 45], ['court', 32, 10], ['court-w', 6, 32], ['lane', 30, 77],
];
for (const [name, cx, cy] of CASES) {
  // clear everything, click, keep ONLY the three the click made (the bell can flush
  // the belfry mid-warp and those are not ours)
  await p.evaluate(() => { birds.length = 0; });
  const s = await p.evaluate(({ cx, cy }) => { const q = project(cx + 0.5, cy + 0.5, 0); return { sx: q[0], sy: q[1] }; }, { cx, cy });
  await p.mouse.click(Math.round(box.x + s.sx), Math.round(box.y + s.sy));
  await p.evaluate(() => { window.__mine = birds.slice(); });
  await p.evaluate(() => __warp(1.8));
  await p.evaluate(() => { birds.length = 0; birds.push(...window.__mine); });
  await draw();

  const clip = await p.evaluate(({ cx, cy }) => {
    const a = project(cx - 7, cy - 7, 0), z = project(cx + 7, cy + 7, 0);
    return { x0: a[0], y0: a[1] - 40, w: z[0] - a[0], h: z[1] - a[1] + 40 };
  }, { cx, cy });
  const shot = () => p.screenshot({ clip: { x: box.x + clip.x0, y: box.y + clip.y0, width: clip.w, height: clip.h } });
  const all = await shot();
  const spots = await p.evaluate(() => birds.map(b => [+b.x.toFixed(1), +b.y.toFixed(1)]));

  const seen = [];
  for (let k = 0; k < spots.length; k++) {
    await p.evaluate(i => { birds.length = 0; birds.push(...window.__mine.filter((_, j) => j !== i)); }, k);
    await draw();
    const lessOne = await shot();
    seen.push(!(lessOne.length === all.length && lessOne.equals(all)));
  }
  console.log(`${name.padEnd(11)} (${cx},${cy}) · ${spots.length} birds at ${spots.map(s => s.join(',')).join('  ')}` +
              ` · visible ${seen.filter(Boolean).length}/${seen.length}` + (seen.every(Boolean) ? '' : '   <-- one is behind something'));
}
await b.close();
