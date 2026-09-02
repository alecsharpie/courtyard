#!/usr/bin/env node
/* the punt station, cropped off the canvas in the same evaluate as the draw.
 *   node probe-punt-station.mjs [file] [--tag cand]
 * Three frames: both hulls moored at 10h; one hull out mid-channel; both out. */
import { resolve, join, dirname } from 'node:path'; import { homedir } from 'node:os'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : d; };
const f = process.argv.find((s, i) => i > 1 && s.endsWith('.html'));
const FILE = resolve(f || resolve(HERE, '../../../../courtyard.html')), TAG = arg('--tag', f ? 'head' : 'cand');
const br = await chromium.launch();
const p = await br.newPage({ viewport:{ width:1600, height:950 }, deviceScaleFactor:2 });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(pathToFileURL(FILE).href + '?pause&seed=42', { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');
const shot = async (name, setup, hour) => {
  const url = await p.evaluate(`(() => {
    window.__reseed(); window.__warp(5 * 55 - simT); __setTime(((${hour} - 6) % 24) * 55 / 24);
    const H = (typeof PUNTS !== 'undefined') ? PUNTS : [punt];
    (${setup})(H);
    drawScene(simT, 1/30);
    const [cx, cy] = project(126.1, 39.3, 0), W = 130, H2 = 130, K = 3.4;   // upscaled: the hulls are small
    const c = document.createElement('canvas'); c.width = W * K; c.height = H2 * K;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(ctx.canvas, Math.round((cx - W/2) * DPR), Math.round((cy - H2/2) * DPR),
                W * DPR, H2 * DPR, 0, 0, W * K, H2 * K);
    return c.toDataURL();
  })()`);
  const o = resolve(HERE, '../../../../shots', `b141-${name}-${TAG}.png`);
  writeFileSync(o, Buffer.from(url.split(',')[1], 'base64')); console.log('  -> ' + o);
};
await shot('moored', 'H => {}', 10);
// both under way, each on ITS OWN lane at the same row — the worst case for the one-shape law
await shot('both-out', 'H => { H[0].leg = 2; H[0].x = 126.59; H[0].y = 39.0; if (H[1]){ H[1].leg = 4; H[1].x = 125.60; H[1].y = 39.0; } }', 10);
// and both beached at their landings, which is where the first layout put one through the other
await shot('both-ashore', 'H => { H[0].leg = 3; H[0].x = 126.3; H[0].y = 42.2; if (H[1]){ H[1].leg = 3; H[1].x = 125.45; H[1].y = 40.4; } }', 10);
await br.close();
