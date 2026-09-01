// does the bottle paint? seed 42 day 5 08:00: pixels in a box round door 4's step that differ when the marks are forced expired; at 1x and 3x. And at 09:45: zero.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
for (const dsf of [1, 3]){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: dsf });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=42');
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    const res = [];
    window.__reseed(); window.__setTime(5 * DAY_LEN + DAY_LEN * (20 - 6) / 24);
    for (const tgt of [8.0, 9.75]){
      window.__warp((((tgt - hour) % 24) + 24) % 24 / 24 * DAY_LEN);
      const box = (() => { const a = project(4.2, 64.9, 0.6), c = project(5.4, 65.4, 0); return [Math.floor(a[0] * DPR), Math.floor(a[1] * DPR), Math.ceil((c[0] - a[0]) * DPR), Math.ceil((c[1] - a[1]) * DPR)]; })();
      drawScene(simT, 1 / 30); const on = ctx.getImageData(...box).data;
      const saved = roundMarks.map(m => m.until); for (const m of roundMarks) m.until = 0;
      drawScene(simT, 1 / 30); const off = ctx.getImageData(...box).data;
      roundMarks.forEach((m, i) => m.until = saved[i]);
      let diff = 0, lum = 0, n = 0; for (let i = 0; i < on.length; i += 4){ const d = Math.abs(on[i] - off[i]) + Math.abs(on[i+1] - off[i+1]) + Math.abs(on[i+2] - off[i+2]); if (d > 24){ diff++; lum += (on[i] + on[i+1] + on[i+2]) / 3 - (off[i] + off[i+1] + off[i+2]) / 3; } n++; }
      res.push({ hour: +hour.toFixed(2), live: roundMarks.filter(m => simT < m.until).map(m => m.x), boxPx: n, diffPx: diff, meanLumRaise: diff ? +(lum / diff).toFixed(1) : 0 });
    }
    return { DPR, res };
  });
  console.log('dsf', dsf, 'DPR', out.DPR, JSON.stringify(out.res));
  await p.close();
}
await b.close();
