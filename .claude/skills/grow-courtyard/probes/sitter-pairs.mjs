/* sitter-pairs.mjs — the courtyard bench pair EXISTS but at what rate? sitter arrivals → pairs → leader seated → both seated → in daylight, 10 seeds × 4 days (#75). run from repo root. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch();
let T = { sitterArr:0, sitterPairs:0, ledSat:0, bothSat:0, refused:0, dayBoth:0 };
for (const seed of [3, 7, 11, 19, 42, 63, 101, 1234, 5, 77]){
  const p = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(`${pathToFileURL(resolve('courtyard.html')).href}?pause&seed=${seed}&t=${55*2.1}`);
  await p.waitForFunction('typeof window.__census === "function"');
  const r = await p.evaluate(() => {
    const o = withCompanion; const pairs = new Set(); let sitterArr = 0, sitterPairs = 0;
    withCompanion = (a, room) => { if (!a.street && a.kind === 'sitter') sitterArr++; const n = agents.length; o(a, room); if (agents.length > n && a.kind === 'sitter' && !a.street){ sitterPairs++; pairs.add(a); } };
    const sat = new Set(), both = new Set(), dayBoth = new Set(), refused = new Set();
    for (let k = 0; k < 4*55*4; k++){ __warp(0.25);
      for (const L of pairs){ const b = agents.find(x => x.with === L);
        if (L.onBench) sat.add(L);
        if (L.state === 'sit' && b && b.state === 'sit'){ both.add(L); if (daylight > 0.5) dayBoth.add(L); }
        if (!L.benchAt && !L.onBench && !refused.has(L) && L.state === 'walk' && L.i < L.wp.length && !sat.has(L) && L.wp.length && L.wp[L.wp.length-1] !== undefined && L.exitRouted) refused.add(L);
      } }
    return { sitterArr, sitterPairs, ledSat: sat.size, bothSat: both.size, dayBoth: dayBoth.size, refused: refused.size };
  });
  console.log(seed, JSON.stringify(r)); for (const k in T) T[k] += r[k]; await p.close();
}
console.log('TOTAL', JSON.stringify(T)); await browser.close();
