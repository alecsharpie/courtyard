/* Is the day/butterfly jump mine, or was it always latent?
 * Replays the motion gate's exact sampling (0.25 s x 240, warm 175) over many
 * seeds, on whichever page you point it at, and reports how often a butterfly
 * trips ABS_JUMP=2.5 AND 8x its own median. Run it on HEAD's file and on mine.
 *
 *   node .claude/skills/grow-courtyard/probes/butterfly-step.mjs [page.html]   (from the repo root)
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;

const b = await chromium.launch();
let trips = 0, maxD = 0;
for (const seed of [1,2,3,4,5,6,7,8,9,10,11,12]){
  const p = await b.newPage();
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(175);
    const d = new Map(); let prev = new Map();
    for (let i = 0; i < 240; i++){
      window.__warp(0.25);
      const now = new Map(window.__entities().filter(e => e.kind === 'butterfly').map(e => [e.id, e]));
      for (const [id, e] of now){ const w = prev.get(id);
        if (w) (d.get(id) || d.set(id, []).get(id)).push(Math.hypot(e.x - w.x, e.y - w.y)); }
      prev = now;
    }
    let trips = 0, maxD = 0;
    for (const [, arr] of d){
      if (arr.length < 6) continue;
      const s = [...arr].sort((a, b) => a - b), med = s[s.length >> 1] || 1e-4;
      const mx = s[s.length - 1]; if (mx > maxD) maxD = mx;
      if (mx > 2.5 && mx > med * 8) trips++;
    }
    return {trips, maxD: +maxD.toFixed(2)};
  });
  await p.close();
  trips += r.trips; maxD = Math.max(maxD, r.maxD);
  console.log(`  seed ${String(seed).padStart(2)}  trips ${r.trips}  maxStep ${r.maxD}`);
}
console.log(`TOTAL trips ${trips} over 12 seeds, largest single step ${maxD.toFixed(2)}`);
await b.close();
