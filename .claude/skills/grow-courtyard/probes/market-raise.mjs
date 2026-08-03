/* market-raise — does the market still arrive between two frames?
 *
 *   node probe-market-raise.mjs [path-to-courtyard.html]
 *
 * marketActive() used to gate the whole stall list, so at hour 8 three finished
 * stalls appeared in one frame and at 17 they left the same way. The census cannot
 * see a draw-only change, so this measures the thing directly: it crops the canvas
 * to the market pitch, steps the sim across the opening and closing windows, and
 * reports the largest single-step change in that region. Run it on HEAD and on the
 * work — the number to beat is HEAD's spike, not an absolute.
 *
 * ?pause + __warp needs __reseed() first or it reports a different plausible number
 * every run (LAWS: "Reseed before you measure").
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = [42, 7, 9, 13];
// day 2 is the first market day (day % 4 === 2); DAY_LEN 55, hour = 6 + 24*p
const WINDOWS = [['open', 111.0, 115.6], ['close', 134.0, 138.6]];
const STEP = 0.05;

const b = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1200, height:750} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?seed=' + seed + '&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(async ({ WINDOWS, STEP }) => {
    const cv = document.querySelector('canvas');
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const g = document.createElement('canvas');
    const gx = g.getContext('2d', { willReadFrequently: true });
    const res = [];
    for (const [label, t0, t1] of WINDOWS){
      window.__reseed(); window.__setTime(0);
      window.__warp(t0); await frame();
      // the market pitch in screen pixels — all three stalls, canopy tops to pavement.
      // A fixed rect is safe here: the camera never moves. (1152x667 canvas.)
      const R = { x: 385, y: 493, w: 148, h: 72 };
      g.width = R.w; g.height = R.h;
      const grab = () => { gx.drawImage(cv, R.x, R.y, R.w, R.h, 0, 0, g.width, g.height);
                           return gx.getImageData(0, 0, g.width, g.height).data; };
      let prev = grab(), worst = 0, worstAt = 0, series = [];
      for (let t = t0 + STEP; t <= t1; t += STEP){
        window.__warp(STEP); await frame();
        const now = grab();
        let d = 0;
        for (let i = 0; i < now.length; i += 4)
          d += Math.abs(now[i] - prev[i]) + Math.abs(now[i+1] - prev[i+1]) + Math.abs(now[i+2] - prev[i+2]);
        d = d / (now.length / 4) / 3;                  // mean channel delta, 0..255
        series.push(+d.toFixed(2));
        if (d > worst){ worst = d; worstAt = t; }
        prev = now;
      }
      res.push({ label, worst: +worst.toFixed(2), worstAt: +worstAt.toFixed(2),
                 hour: +window.__census().clock.hour.toFixed(2), series });
    }
    return res;
  }, { WINDOWS, STEP });
  for (const r of out) rows.push({ seed, ...r });
  await p.close();
}
await b.close();

console.log('largest single-step change in the market pitch (mean channel delta, step ' + STEP + ' s sim)\n');
console.log('  seed  window   worst   at simT');
for (const r of rows) console.log('  ' + String(r.seed).padStart(4) + '  ' + r.label.padEnd(7) +
  String(r.worst).padStart(6) + '   ' + r.worstAt);
for (const w of ['open', 'close']){
  const v = rows.filter(r => r.label === w).map(r => r.worst);
  console.log('\n  ' + w + ': max ' + Math.max(...v).toFixed(2) +
    '  median ' + v.sort((a, b) => a - b)[v.length >> 1].toFixed(2));
}
console.log('\nseries (seed 42, open):\n  ' + rows.find(r => r.seed === 42 && r.label === 'open').series.join(' '));
console.log('\nseries (seed 42, close):\n  ' + rows.find(r => r.seed === 42 && r.label === 'close').series.join(' '));
