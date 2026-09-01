#!/usr/bin/env node
/* probe: b104's thicker bonfire column must NOT have thickened the chimneys — they share
 * drawSmoke(). The test the brief's `avoid` clause asks for: with bon.fire/bon.ember forced
 * to 0 the bonfire block cannot draw at all, so the candidate's canvas must be byte-identical
 * to HEAD's on a chimney-smoking hour. Run at hour ~7 (cold peaks at 7) so the chimney branch
 * is LOUD — a green identity on a frame with no smoke in it would prove nothing (#31).
 *
 *   node bonfire-chimney-identity.mjs        (candidate = courtyard.html, control = head-courtyard.html)
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = { HEAD: 'head-courtyard.html', CAND: 'courtyard.html' };
const SEEDS = [7, 42, 1234];
const HOURS = [7.0, 19.5];   // the chimneys' two peaks: the chilly morning and after dark

const browser = await chromium.launch();
/* hour < 0 means "walk to this seed's own fire" — a fixed hour is fire 0 on most seeds, and
 * a control that never fires is no control (#31). */
const shot = async (file, seed, hour, force) => {
  const c = await browser.newContext({ viewport: { width: 1200, height: 720 }, deviceScaleFactor: 1 });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${pathToFileURL(resolve(REPO, file)).href}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(({ targetHour, force }) => {
    window.__reseed();
    let g = 0;
    if (targetHour < 0) { while (g++ < 6000 && !(bon.fire > 0.85)) window.__warp(0.5); }
    else while (g++ < 3000 && !(day === 12 && Math.abs(hour - targetHour) < 0.12)) window.__warp(0.25);
    if (force) { bon.fire = 0; bon.ember = 0; bon.on = false; }
    drawScene(simT, 1 / 30);
    // how loud is the chimney branch here? count the smoke drawn over the sky/roofs
    const cold = clamp(1 - Math.abs(hour - 7) / 3.5, 0, 1) + rainFall * 0.7 + clamp((hour - 18.5) / 2, 0, 1) * 0.8;
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i += 4) { h ^= d[i]; h = Math.imul(h, 16777619); h ^= d[i + 1]; h = Math.imul(h, 16777619); h ^= d[i + 2]; h = Math.imul(h, 16777619); }
    return { hash: (h >>> 0).toString(16), hour: +hour.toFixed(2), cold: +cold.toFixed(2), chimneys: CHIMNEYS.length, fire: +bon.fire.toFixed(2), ember: +bon.ember.toFixed(2), px: d.length / 4 };
  }, { targetHour: hour, force });
  await c.close();
  if (errs.length) { console.error('PAGE ERROR', errs[0]); process.exitCode = 1; }
  return r;
};

console.log('\n=== chimneys untouched? (bonfire forced OFF; candidate vs HEAD)');
console.log('seed  hour  cold  chimneys   HEAD hash   CAND hash   same');
let bad = 0;
for (const seed of SEEDS) for (const hour of HOURS) {
  const a = await shot(FILES.HEAD, seed, hour, true), b = await shot(FILES.CAND, seed, hour, true);
  const same = a.hash === b.hash; if (!same) bad++;
  console.log(`${String(seed).padStart(4)} ${a.hour.toFixed(2).padStart(5)} ${a.cold.toFixed(2).padStart(5)}  ${String(a.chimneys).padStart(8)}   ${a.hash.padStart(9)}   ${b.hash.padStart(9)}   ${same ? 'YES' : 'NO  <<<'}`);
}
// and the non-zero control: with the bonfire ON the two builds MUST differ, or the probe is blind
console.log('\n=== the same test with the bonfire ON — these MUST differ, or the instrument is blind');
let differed = 0;
for (const seed of SEEDS) {
  const a = await shot(FILES.HEAD, seed, -1, false), b = await shot(FILES.CAND, seed, -1, false);
  const diff = a.hash !== b.hash; if (diff) differed++;
  console.log(`${String(seed).padStart(4)} ${a.hour.toFixed(2).padStart(5)}  fire ${a.fire}  ${a.hash.padStart(9)}   ${b.hash.padStart(9)}   ${diff ? 'differ ok' : 'IDENTICAL <<< blind'}`);
}
await browser.close();
console.log(`\n${bad === 0 ? 'PASS' : 'FAIL'}: ${SEEDS.length * HOURS.length - bad}/${SEEDS.length * HOURS.length} bonfire-off frames identical; ${differed}/${SEEDS.length} bonfire-on frames differ.`);
process.exitCode = bad === 0 && differed === SEEDS.length ? (process.exitCode || 0) : 1;
