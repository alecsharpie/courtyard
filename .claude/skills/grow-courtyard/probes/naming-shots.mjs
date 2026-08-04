#!/usr/bin/env node
/* naming-shots.mjs — what the naming LOOKS like, which no number can tell you.
 *
 * One pinned instant, the pointer put on six subjects in turn, and the sill shot each
 * time. A ring is injected at the pointer (the page has no cursor in a screenshot) so
 * the PNG shows what was being pointed AT next to what was said about it.
 *
 * The instant is pinned with ?pause + __warp, and the warp's own news is given its
 * reading time first — the label waits for the ticker, so a shot taken too early is a
 * shot of an empty sill. Season is a parameter: --warp 625 is late summer, --warp 1090
 * lands in the winter where the words change.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const PAGE = pathToFileURL(resolve(ROOT, 'courtyard.html')).href;
const OUT = resolve(ROOT, 'shots');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const warp = +arg('--warp', '625'), seed = arg('--seed', '42'), tag = arg('--tag', '');
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
p.on('pageerror', e => console.log('PAGE ERROR ' + e));
await p.goto(`${PAGE}?pause&seed=${seed}`);
await p.waitForFunction('typeof window.__census === "function"');
await p.evaluate(w => __warp(w), warp);
await p.waitForFunction('crowns.length > 0');
await p.waitForTimeout(2700);                        // the warp's own line, read first
console.log(await p.evaluate(() => `${seasonLabel()} · day ${day + 1} · ${timeLabel()}`));

// the pointer ring, injected: a screenshot has no cursor in it
await p.evaluate(() => {
  const d = document.createElement('div');
  d.id = 'ring';
  d.style.cssText = 'position:fixed;width:19px;height:19px;margin:-10px 0 0 -10px;border:2px solid #fff;' +
    'border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 0 7px rgba(0,0,0,.5);pointer-events:none;z-index:9';
  document.body.appendChild(d);
});

const box = await p.locator('#cv').boundingBox();
/* Each subject is FOUND on the grid, never typed as a coordinate: the world is seeded,
 * so a hard-coded point drifts the moment anything upstream reshuffles it. */
const subjects = await p.evaluate(() => {
  const q = (x, y) => project(x + 0.5, y + 0.5, 0);
  const find = t => {
    for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){
      const j = y * GW + x;
      if (grid[j] === t && (t !== CBED || bSp[j]) && !treeAt(q(x, y))) return q(x, y);
    }
  };
  const crown = n => { const c = crowns.find(k => k.name === n); return [c.x, c.y]; };
  const plot = () => {
    for (let y = 8; y < 61; y++) for (let x = 80; x < 96; x++)
      if (grid[y * GW + x] === BED && plotCrop(x, y) && !treeAt(q(x, y))) return q(x, y);
  };
  return [['bed', find(CBED)], ['lawn', find(GRASS)], ['linden', crown('the linden')],
          ['orchard', crown('an orchard tree')], ['plot', plot()], ['pond', q(POND.x | 0, POND.y | 0)]];
});
for (const [name, pt] of subjects){
  if (!pt){ console.log(`  ${name}: not found in this world`); continue; }
  await p.mouse.move(Math.round(box.x + pt[0]), Math.round(box.y + pt[1]));
  await p.evaluate(([x, y]) => { const r = document.getElementById('ring'); r.style.left = x + 'px'; r.style.top = y + 'px'; },
    [Math.round(box.x + pt[0]), Math.round(box.y + pt[1])]);
  await p.waitForTimeout(260);
  const said = await p.evaluate(() => document.getElementById('naming').textContent);
  const file = join(OUT, `naming-${tag ? tag + '-' : ''}${name}.png`);
  await p.screenshot({ path: file });
  console.log(`  ${name.padEnd(8)} → "${said}"   ${file}`);
}

/* and the phone: no hover at all, so the TAP names, and the sill is borrowed for it */
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const q = await ctx.newPage();
await q.goto(`${PAGE}?seed=${seed}`);
await q.waitForFunction('typeof window.__census === "function"');
await q.evaluate(w => __warp(w), warp);
await q.waitForFunction('crowns.length > 0');
const qbox = await q.locator('#cv').boundingBox();
const bed = await q.evaluate(() => {
  for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){
    const j = y * GW + x, t = project(x + 0.5, y + 0.5, 0);
    if (grid[j] === CBED && bSp[j] && !treeAt(t)) return t;
  }
});
await q.touchscreen.tap(Math.round(qbox.x + bed[0]), Math.round(qbox.y + bed[1]));
await q.waitForTimeout(400);
const file = join(OUT, `naming-${tag ? tag + '-' : ''}phone.png`);
await q.screenshot({ path: file });
console.log(`  phone    → "${await q.evaluate(() => document.getElementById('naming').textContent)}"   ${file}`);
await b.close();
