/* How often does the cached ground layer ACTUALLY rebuild, and why? Steps one summer and
 * one winter day at 0.05 s, drawing whenever groundDirty is set, and attributes each
 * rebuild to the light bucket, snow, or "other" (the grass-wear `R()<dt*2` line).
 * #48: ~650/day, 80% wear — the cache is repainted every few frames, 9 ms a time.
 *   node ground-rebuilds.mjs [file] */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || new URL('../../../../courtyard.html', import.meta.url).pathname);
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1600, height:950} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + '?seed=7&t=0&pause');
await p.waitForFunction(() => window.__warp);
const out = await p.evaluate(async () => {
  const res = {};
  for (const [name, T0] of [['summer d6', 330], ['winter d21', 1155]]){
    window.__reseed(); window.__warp(T0);
    let n = 0, why = { lb: 0, snow: 0, wet: 0, other: 0 }, prevLb = lightBucket, prevSnow = snowPainted;
    for (let i = 0; i < 55 / 0.05; i++){
      window.__warp(0.05);
      if (groundDirty){ n++; if (lightBucket !== prevLb) why.lb++; else if (Math.abs(snowCover - snowPainted) > SNOW_REPAINT) why.snow++; else if (typeof wetBucket === 'function' && wetBucket() !== wetPainted) why.wet++; else why.other++; prevLb = lightBucket;
        drawScene(simT, 0); }
    }
    res[name] = { rebuildsPerDay: n, why, snowCover: +snowCover.toFixed(3) };
  }
  return res;
});
console.log(JSON.stringify(out)); await b.close();
