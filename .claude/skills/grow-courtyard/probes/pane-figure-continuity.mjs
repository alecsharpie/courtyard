#!/usr/bin/env node
/* pane-figure-continuity.mjs — does anybody at a window ever get SWAPPED for somebody
 * else half way across the room?
 *
 * paneFigure() returns the FIRST slot whose visit is running, so two slots whose visits
 * overlap show as one figure teleporting: it is at u = 0.6 in one frame and u = 0.1 in
 * the next, in a pane, at night. No gate can see this — the motion gate samples
 * __entities() and a pane figure is not an entity, it is solved from the pane's own hash
 * every frame — so it needs its own probe. #199 added a MORNING visit over the early
 * riser's burn, which in a short summer night can begin while the same pane's evening
 * band is still open; this is the measurement that says it does not.
 *
 * THE THRESHOLD IS NOT A GUESS. u moves fastest on the "away from the glass" phase:
 * 1.08 of u over 0.24*dur night-hours, so at dur = FIG_M_MIN = 0.60 that is 7.5 u/hour.
 * Sampled every 0.025 night-hours a legitimate step is at most 0.19; a swap is 0.4..1.9.
 * 0.30 sits between the two with room either side. Both ends must also be INSIDE the
 * glass (u in [-0.05, 1.05]): one visit leaving at u = 1.44 as the next enters at -0.44
 * is two people in a doorway, not a teleport, and is what the pane is meant to show.
 *
 *   node .claude/skills/grow-courtyard/probes/pane-figure-continuity.mjs [days] [--file=path]   (git show <ref>:courtyard.html > .probe-head.html) [seed]
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const argv = process.argv.slice(2);
const fileArg = (argv.find(a => a.startsWith('--file=')) || '').slice(7);
const rest = argv.filter(a => !a.startsWith('--'));
const DAYS = +(rest[0] || 104), SEED = +(rest[1] || 42);
const FILE = fileArg ? resolve(fileArg) : resolve(REPO, 'courtyard.html');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', e => { console.error('  PAGE ERROR: ' + e); process.exitCode = 1; });
await page.goto(pathToFileURL(FILE).href + `?pause&t=0&seed=${SEED}`);
await page.waitForFunction(() => typeof window.__warp === 'function');
const r = await page.evaluate(({ DAYS }) => {
  __reseed(); __warp(30); drawScene(simT, 1 / 30);              // fill WINDOWS[] / ROOF_LIGHTS[]
  const addrs = WINDOWS.map(w => [w[4], w[5]]).concat(ROOF_LIGHTS.map(r => [r[1], r[2]]));
  const lastU = new Map(); const hits = []; let n = 0, samples = 0, big = 0, ev = 0, mo = 0;
  for (let t = 0; t < DAYS * 55; t += 55 / 960) {               // 0.025 sim-hours
    __setTime(t);
    if (!(nightF > 0.3)) { lastU.clear(); continue; }
    const nt = nightAt(); const seen = new Set();
    for (const [sa, sb] of addrs) {
      if (!windowLit(sa, sb)) continue;
      const key = sa * 1000 + sb, f = paneFigure(sa, sb);
      if (!f) continue;
      seen.add(key); samples++;
      if (lastU.has(key)) {
        const pu = lastU.get(key), d = Math.abs(f.u - pu);
        if (d > 0.19) big++;                                    // the ZERO below is not vacuous:
        if (d > 0.30 && f.u > -0.05 && f.u < 1.05 && pu > -0.05 && pu < 1.05) {
          n++; nt.t >= nt.span - 2.6 ? mo++ : ev++;
          if (hits.length < 8) hits.push({ sa, sb, nid: nt.nid, t: +nt.t.toFixed(2), pu: +pu.toFixed(2), u: +f.u.toFixed(2) });
        }
      }
      lastU.set(key, f.u);
    }
    for (const k of [...lastU.keys()]) if (!seen.has(k)) lastU.delete(k);
  }
  return { hits, n, ev, mo, samples, big, panes: addrs.length };
}, { DAYS });
await browser.close();
console.log(`\n  ${FILE.replace(REPO + '/', '')} · ${DAYS} days · seed ${SEED} · ${r.panes} panes · 0.025 h step`);
console.log(`  ${r.samples} figure-samples · ${r.big} steps over 0.19 (the probe CAN see a step this big) · SWAPS ${r.n} (${r.ev} evening, ${r.mo} morning) — must be 0`);
for (const h of r.hits) console.log('   ' + JSON.stringify(h));
process.exit(r.n ? 1 : (process.exitCode || 0));
