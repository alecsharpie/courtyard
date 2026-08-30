// #72: litter by tile class (GRASS/PATH/SIDE/ROAD), HEAD vs HERE, autumn day 16, hourly 07:00→12:00; crops of the cross street
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function open(file, seed){ const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&t=0&pause`); await p.waitForFunction(() => window.__warp); return p; }
const DAY = 16, H = h => DAY * 55 + (h - 6) / 24 * 55;
const shots = process.argv.includes('shots'), inject = process.argv.includes('inject');
for (const seed of [3, 7, 11]){
  for (const [file, tag] of [['/tmp/head.html', 'HEAD'], ['courtyard.html', 'HERE']]){
    const p = await open(file, seed);
    const rows = await p.evaluate(async ([H0, step, shots, tag, seed, inject]) => { window.__reseed(); window.__warp(H0); const out = [];
      // inject: the SAME heap on both builds at 07:00 — 200 on every open cell — so the cut is attributed to the rule, not to the world's drift
      if (inject){ for (let i = 0; i < litter.length; i++) if (litterTake(grid[i])) litter[i] = 200; litterAny = true; }
      const sums = () => { const s = {GRASS:0, PATH:0, SIDE:0, ROAD:0, SLOT:0}; const names = {[GRASS]:'GRASS',[PATH]:'PATH',[SIDE]:'SIDE',[ROAD]:'ROAD',[SLOT]:'SLOT'};
        for (let i = 0; i < litter.length; i++) if (litter[i]){ const n = names[grid[i]]; if (n) s[n] += litter[i]; } return s; };
      for (let h = 7; h <= 12; h++){ const s = sums(); out.push([h, s.GRASS, s.PATH, s.SIDE, s.ROAD, s.SLOT, hour.toFixed(2), sweeper ? `sweeper@${sweeper.x.toFixed(0)},${sweeper.y.toFixed(0)}` : '-']); if (h < 12) window.__warp(step); }
      return out; }, [H(7), 55 / 24, shots, tag, seed, inject]);
    console.log(`seed ${seed} ${tag}  hour GRASS PATH SIDE ROAD SLOT`); for (const r of rows) console.log('  ' + r.join('\t'));
    if (shots && seed === 7) for (const [h, t] of [[7, H(7)], [12, H(12)]]){
      const q = await open(file, seed);
      await q.evaluate(T => { window.__reseed(); window.__warp(T); drawScene(simT, 0); }, t);
      const r = await q.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); const a = project(32, 70, 0); return { cx: c.x + a[0], cy: c.y + a[1] }; });
      await q.screenshot({ path: `shots/b69-gutter-${tag.toLowerCase()}-${h}h.png`, clip: { x: r.cx - 420, y: r.cy - 110, width: 840, height: 220 } });
      await q.close();
    }
    await p.close();
  }
}
await b.close();
