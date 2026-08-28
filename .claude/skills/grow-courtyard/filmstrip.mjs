#!/usr/bin/env node
/* filmstrip.mjs — look at the town MOVING, in one image you can actually read.
 *
 *   node filmstrip.mjs                        day scene, 12 frames
 *   node filmstrip.mjs --scene night --n 16
 *   node filmstrip.mjs --gap 0.1              tight spacing, to catch a flicker
 *   node filmstrip.mjs --clip 180,300,700,560 zoom on the courtyard
 *
 * Writes shots/filmstrip-<scene>.png — a labelled contact sheet — and prints the
 * frame-to-frame pixel-difference series beside it.
 *
 * The pair matters. motion.mjs catches things that move WRONGLY (teleport, NaN,
 * vanish); this catches things that DRAW wrongly over time — a sprite drawn behind
 * a wall on every other frame, a light that strobes, a whole scene that pops when
 * a cached layer is rebuilt. Neither is visible in a single screenshot, and the
 * numbers below tell you which frame to look at instead of asking you to spot it.
 *
 * Frames are stepped with __warp() at a pinned seed, so the same command produces
 * the same filmstrip twice — you can diff two builds frame for frame.
 */
import { homedir } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

/* A preset is an instant = a whole day plus an hour of it. The page's clock is
 * `hour = (6 + (t % 55) / 55 * 24) % 24` — the day ROLLS at 06:00, so hour h on day d
 * is `d*55 + 55*((h - 6 + 24) % 24)/24`. Read the legacy numbers through that:
 * day 175 = d3 10:22, dusk 1080 = d19 21:16, market 605 = d11 06:00 (the opening),
 * rain 430 = d7 01:38. `night` used to be 1230 = d22 14:44 — a day strip wearing a
 * night label; it is now derived: day 22 at 00:00 (dayHours ≈ 12.4 there, sunDown
 * ≈ 19.0, so midnight is five hours into full dark). */
const AT = (day, h) => day * 55 + 55 * (((h - 6) + 24) % 24) / 24;
const SCENES = { day: 175, dusk: 1080, night: AT(22, 0), market: 605, rain: 430 };
const scene = arg('--scene', 'day');
const t = SCENES[scene] ?? +scene;
const N = +arg('--n', '12');
const GAP = +arg('--gap', '0.35');       // sim seconds between frames
const SEED = arg('--seed', '42');
const clip = arg('--clip', null);        // "x,y,w,h" in CSS pixels
const OUT = join(REPO, 'shots');
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(`${pathToFileURL(join(REPO, 'courtyard.html')).href}?seed=${SEED}&t=0&pause`);
await p.waitForTimeout(500);

const shot = await p.evaluate(async ({ warm, gap, n, clip }) => {
  const cv = document.getElementById('cv');
  const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  /* downsample into a small buffer once, and diff in that space — full-resolution
   * diffs are dominated by antialiasing noise and are far slower */
  const small = document.createElement('canvas');
  small.width = 320; small.height = 190;
  const sctx = small.getContext('2d', { willReadFrequently: true });

  const thumbW = 460;
  const thumb = document.createElement('canvas');
  const tctx = thumb.getContext('2d');

  const c = clip ? clip.split(',').map(Number) : null;
  const dpr = cv.width / cv.clientWidth;
  const src = c ? [c[0] * dpr, c[1] * dpr, c[2] * dpr, c[3] * dpr] : [0, 0, cv.width, cv.height];
  thumb.width = thumbW; thumb.height = Math.round(thumbW * src[3] / src[2]);

  window.__reseed();
  window.__warp(warm);
  await raf();

  const frames = [], diffs = [];
  let prev = null;
  for (let i = 0; i < n; i++) {
    if (i) { window.__warp(gap); }
    await raf();
    sctx.drawImage(cv, src[0], src[1], src[2], src[3], 0, 0, small.width, small.height);
    const d = sctx.getImageData(0, 0, small.width, small.height).data;
    if (prev) {
      let sum = 0;
      for (let k = 0; k < d.length; k += 4) sum += Math.abs(d[k] - prev[k]) + Math.abs(d[k + 1] - prev[k + 1]) + Math.abs(d[k + 2] - prev[k + 2]);
      diffs.push(+(sum / (d.length / 4) / 3).toFixed(3));
    }
    prev = d.slice();
    tctx.drawImage(cv, src[0], src[1], src[2], src[3], 0, 0, thumb.width, thumb.height);
    frames.push(thumb.toDataURL('image/jpeg', 0.72));
  }
  return { frames, diffs, simT: window.__census().clock.simT };
}, { warm: t, gap: GAP, n: N, clip });

/* Compose the contact sheet by rendering it as a page and screenshotting that —
 * no image library, no dependency. */
const cols = Math.min(4, N);
const sheet = await b.newPage({ viewport: { width: cols * 470 + 24, height: 400 } });
await sheet.setContent(`<style>
  body{margin:0;background:#15130f;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#e8dcc4}
  h1{font:600 14px/1.4 system-ui,sans-serif;margin:12px;color:#e8dcc4}
  .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:0 12px 12px}
  figure{margin:0}
  img{width:100%;display:block;border-radius:3px}
  figcaption{padding:3px 2px;color:#a89a80;display:flex;justify-content:space-between}
  .hot{color:#e88a5a;font-weight:700}
</style>
<h1>The Courtyard — filmstrip · scene ${scene} (t=${t}s, seed ${SEED}) · ${GAP}s between frames · number after Δ is mean pixel change from the previous frame</h1>
<div class="g">${shot.frames.map((f, i) => {
  const d = i ? shot.diffs[i - 1] : null;
  const med = [...shot.diffs].sort((a, b) => a - b)[shot.diffs.length >> 1] || 1;
  const hot = d != null && d > med * 3.5;
  return `<figure><img src="${f}"><figcaption><span>#${i} · t+${(i * GAP).toFixed(2)}s</span><span class="${hot ? 'hot' : ''}">${d == null ? '—' : 'Δ' + d.toFixed(2)}</span></figcaption></figure>`;
}).join('')}</div>`);
await sheet.waitForTimeout(300);
const file = join(OUT, `filmstrip-${scene}.png`);
await sheet.screenshot({ path: file, fullPage: true });
await b.close();

const med = [...shot.diffs].sort((a, b) => a - b)[shot.diffs.length >> 1] || 0;
console.log(`filmstrip: ${file}`);
console.log(`  scene ${scene} (t=${t}s), seed ${SEED}, ${N} frames ${GAP}s apart\n`);
console.log('  frame  Δ from previous');
shot.diffs.forEach((d, i) => {
  const bar = '█'.repeat(Math.min(40, Math.round(d / Math.max(med, 0.01) * 6)));
  const flag = d > med * 3.5 ? '  ← POP: something changed far more than the frames around it' : d === 0 ? '  ← FROZEN: nothing moved at all' : '';
  console.log(`  ${String(i + 1).padStart(5)}  ${d.toFixed(3).padStart(7)}  ${bar}${flag}`);
});
console.log(`\n  median Δ ${med.toFixed(3)}`);
if (errs.length) { console.error(`\n  ${errs.length} page error(s):`); errs.slice(0, 5).forEach(e => console.error('   ' + e)); }
console.log('\n  Now LOOK at the sheet. Numbers find the suspicious frame; only your eye can');
console.log('  say whether the thing that changed was meant to. Check the still parts too —');
console.log('  a draw-order regression usually shows up where you were not editing.');
if (errs.length) process.exit(1);
