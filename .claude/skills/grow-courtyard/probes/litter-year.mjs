// litter across the year on 3 seeds; June ground hash vs HEAD; autumn crop seed 7
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function open(file, seed){ const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&t=0&pause`); await p.waitForFunction(() => window.__warp); return p; }
const mode = process.argv[2];
if (mode === 'year'){
  for (const seed of [3, 7, 11]){
    const p = await open('courtyard.html', seed);
    const rows = await p.evaluate(() => { window.__reseed(); const out = []; let T = 0;
      for (let d = 0; d < 26; d++){ window.__warp(55 * 0.5); T += 27.5;   // noon each day
        let cells = 0, sum = 0, mx = 0; for (let i = 0; i < litter.length; i++) if (litter[i]){ cells++; sum += litter[i]; mx = Math.max(mx, litter[i]); }
        out.push([d, +seasonPhase.toFixed(2), +leafShed().toFixed(2), cells, sum, mx, +snowCover.toFixed(2), leaves.length]); window.__warp(27.5); }
      return out; });
    console.log('seed', seed, 'day phase shed cells sum max snow airborne'); for (const r of rows) console.log(r.join('\t'));
    await p.close();
  }
} else if (mode === 'hash'){
  for (const [T, name] of [[330, 'summer d6'], [957, 'autumn d17.4']]) for (const file of ['/tmp/head.html', 'courtyard.html']){
    const p = await open(file, 7);
    const h = await p.evaluate(async T => { window.__reseed(); window.__warp(T); drawScene(simT, 0);
      const d = gtx.getImageData(0, 0, gcv.width, gcv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i+1] * 3 + d[i+2] * 7) >>> 0;
      let cells = 0; for (let i = 0; i < (typeof litter !== 'undefined' ? litter.length : 0); i++) if (litter[i]) cells++;
      return { h, cells, phase: +seasonPhase.toFixed(3) }; }, T);
    console.log(name, file, JSON.stringify(h)); await p.close();
  }
} else if (mode === 'shots'){
  for (const [file, tag] of [['/tmp/head.html', 'head'], ['courtyard.html', 'here']]){
    const p = await open(file, 7);
    await p.evaluate(() => { window.__reseed(); window.__warp(957); drawScene(simT, 0); });
    const r = await p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); const a = project(CX, CY, 0); return { cx: c.x + a[0], cy: c.y + a[1] }; });
    await p.screenshot({ path: `shots/b63-autumn-courtyard-${tag}.png`, clip: { x: r.cx - 320, y: r.cy - 200, width: 640, height: 400 } });
    await p.screenshot({ path: `shots/b63-autumn-wide-${tag}.png` });
    console.log('shot', tag); await p.close();
  }
}
await b.close();
