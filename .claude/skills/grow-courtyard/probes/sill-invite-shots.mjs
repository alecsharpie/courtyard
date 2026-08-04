#!/usr/bin/env node
/* sill-invite-shots.mjs — the four states of the sill's second invitation, as pictures.
 *
 * The numbers in season-invite.mjs say the label is underlined, inked and 29px tall,
 * and that the season stays visible while the sill asks you to press it. Only an eye
 * can say whether the result reads as a control rather than as damage. Crops to the
 * SILL — the picture above it is the census's business, not this probe's.
 *
 * Real-clock, so it waits the offers out (~30 s per viewport).
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const PAGE = pathToFileURL(resolve(ROOT, arg('--file', 'courtyard.html'))).href;
const OUT = join(ROOT, 'shots');
const tag = arg('--tag', '');
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const shot = async (p, name) => {
  const box = await p.locator('#sill').boundingBox();
  const pad = 6;
  await p.screenshot({ path: join(OUT, `sill-${name}${tag}.png`),
    clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 } });
  console.log('  shots/sill-' + name + tag + '.png');
};

for (const [w, h, wide] of [[1400, 860, true], [390, 844, false]]) {
  const k = wide ? 'wide' : 'narrow';
  console.log(`${w}x${h}`);
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`${PAGE}?seed=42`);
  await p.waitForFunction('typeof window.__census === "function"');
  await shot(p, k + '-rest');                       // the label at rest
  await p.hover('#season');
  await shot(p, k + '-hover');
  await p.mouse.move(5, 5);
  // wait out offer 1 (INVITE_AT 8) and then offer 2 (+ DWELL 5.5 + GAP 6)
  const waitFor = async (pre, until) => {
    const t0 = Date.now();
    while (Date.now() - t0 < until * 1000) {
      if (await p.evaluate(s => tickerEl.textContent.startsWith(s), pre)) return true;
      await new Promise(r => setTimeout(r, 150));
    }
    return false;
  };
  // the lines come off the page, never a copy here — see season-invite.mjs
  const [inv, sea] = await p.evaluate(w => w
    ? [INVITE_WIDE, SEASON_WIDE] : [INVITE_NARROW, SEASON_NARROW], wide);
  if (await waitFor(inv, 22)) await shot(p, k + '-offer1');
  else console.log('  (offer 1 not seen)');
  if (await waitFor(sea, 26)) await shot(p, k + '-offer2');
  else console.log('  (offer 2 not seen)');
  await new Promise(r => setTimeout(r, 9000));
  await shot(p, k + '-after');                      // the sill given back
  await p.close();
}
await b.close();
