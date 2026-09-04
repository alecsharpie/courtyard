/* b196 — what does drawMoonSheen() cost, in the weather it is most expensive in?
 *
 * perf.mjs is vsync-locked and reads 16.70ms for everything; it is blind to a pass that is
 * expensive only in a rare weather. So this times the FUNCTION, at a moonlit night where
 * every one of its five surfaces is live at once (snow lying, a skin on the river, wet
 * paving) against one where only the water is — and at every camera, because the quarter
 * views change how much of the world is on screen and the roof pass is per-cell.
 *
 *   node .../probes/moon-cost.mjs [file]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = process.argv[2] || 'courtyard.html';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(pathToFileURL(resolve(FILE)).href + '?seed=42&pause&t=0');
await p.waitForFunction('typeof __warp === "function"');
const out = await p.evaluate(() => {
  __reseed();                         // reseed, THEN step, in one evaluate
  const step = DAY_LEN / 96;
  const alt = () => { const ma = moonArc(); return (ma > 0 && ma < 1) ? Math.sin(Math.PI * ma) : 0; };
  const time = (n, f) => { const t0 = performance.now(); for (let i = 0; i < n; i++) f(); return (performance.now() - t0) / n; };
  const at = (day) => {
    let g = 0;
    while (simT < day * DAY_LEN) __warp(step);
    /* and a CLEAR one. A first cut asked only for a moon-up night and found the winter one
     * under a lid of 0.85, where moonLight() is 0.019 and drawMoonSheen() returns at its
     * first line: it timed 0.000 ms and looked like good news. A synthetic miss takes the
     * other branch, it does not fail — so the cover is in the predicate and asserted. */
    while (!(daylight <= 0.02 && nightF > 0.6 && alt() > 0.4 && cloudCover() < 0.45) && g++ < 9000) __warp(step);
    // a full clear moon, so every pass is at its widest — the phase is a `let` for this
    MOON_START = (0.5 - (simT / DAY_LEN) / MOON_DAYS % 1 + 2) % 1;
    return { ok: g < 9000, d: +(simT/DAY_LEN).toFixed(2), snow: +snowCover.toFixed(2),
             ice: iceOn, wet: +wetF().toFixed(2), cloud: +cloudCover().toFixed(2), m: +moonLight().toFixed(3) };
  };
  const rows = [];
  for (const [tag, day] of [['summer night', 8], ['winter night', 22]]){
    const st = at(day);
    if (!st.ok){ rows.push({ tag, q: 'NO MOON-UP CLEAR NIGHT FOUND', ...st, sheen: 0, whole: 0 }); continue; }
    drawScene(simT, 0);                                   // one warm draw, so no cache rebuild is charged
    for (const q of ['Wide', 'Courtyard', 'Street', 'Plaza', 'Far bank']){
      const sel = document.querySelector('#where select') || document.querySelector('#where');
      if (sel && sel.tagName === 'SELECT'){ sel.value = q; sel.dispatchEvent(new Event('change')); }
      for (let i = 0; i < 40; i++) drawScene(simT, 0);     // let the camera ease land
      const sheen = time(60, () => drawMoonSheen());
      const whole = time(20, () => drawScene(simT, 0));
      rows.push({ tag, q, ...st, sheen: +sheen.toFixed(3), whole: +whole.toFixed(2) });
    }
  }
  return rows;
});
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 3));
await b.close();
console.log('drawMoonSheen(), full clear moon, ' + FILE);
console.log('  ' + 'weather'.padEnd(14) + 'camera'.padEnd(11) + 'snow  ice   wet   moonLight   sheen ms   whole frame ms   share');
for (const r of rows_(out)) console.log('  ' + r);
function rows_(rs){ return rs.map(r => r.tag.padEnd(14) + r.q.padEnd(11) +
  String(r.snow).padEnd(6) + String(r.ice).padEnd(6) + String(r.wet).padEnd(6) +
  String(r.m).padEnd(12) + r.sheen.toFixed(3).padStart(6) + '     ' + r.whole.toFixed(2).padStart(8) +
  '        ' + (100 * r.sheen / r.whole).toFixed(1) + '%'); }
