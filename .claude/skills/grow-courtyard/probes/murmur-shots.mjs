/* murmur-shots.mjs — b96 witnesses, taken by warping seed 42 from the DEFAULT start
 * (the same world as murmur.mjs), never ?t=. Wide + Far bank at sunDown-0.8 on day 13,
 * the funnel at sunDown-0.2, the skein on day 14 at sunUp+0.15. */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');   // the repo, wherever this runs from
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
// [name, day, instant, quarter, dsf, clip]: the 3x crops are the skyline over the river,
// x 100..140 of the wide frame — the Far bank QUARTER has no sky in it (its frame top is
// depth +0.15), so legibility is witnessed at the quarter's scale on the wide framing
const SKY = { x: 880, y: 20, w: 330, h: 180 };
const SHOTS = [
  ['wide',       13, 'sunDown - 0.8',  0, 1, null],
  ['boil-3x',    13, 'sunDown - 0.8',  0, 3, SKY],
  ['funnel-3x',  13, 'sunDown - 0.45', 0, 3, SKY],
  ['skein-3x',   14, 'sunUp + 0.15',   0, 3, SKY],
  ['skein-wide', 14, 'sunUp + 0.15',   0, 1, null],
];
for (const [name, d, when, q, dsf, clip] of SHOTS){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: dsf });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(ROOT, 'courtyard.html')).href + '?seed=42&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([d, when, q]) => {
    __reseed();
    while (day < d - 1) __warp(2); while (day < d) __warp(0.05);   // fine into the day: a sunrise window is 36 min
    const tgt = () => eval(when);
    while (hour < tgt()) __warp(0.05);
    whereGo(q); viewSnap(); groundDirty = true;
    drawScene(simT, 1/30); drawScene(simT, 1/30);
    const nm = murBox.on ? lookAt([murBox.x, murBox.y]) : '';
    return { day, hour: +hour.toFixed(2), env: +murmEnv().toFixed(2), skein: +skeinEnv().toFixed(2), raining, wind: +windF().toFixed(2), view: QUARTERS[whereN].name, name: nm, box: murBox.on ? [murBox.x | 0, murBox.y | 0] : null };
  }, [d, when, q]);
  const cv = p.locator('canvas').first();
  if (clip){ const bb = await cv.boundingBox(); await p.screenshot({ path: resolve(ROOT, `shots/b96-murmur-${name}.png`), clip: { x: bb.x + clip.x, y: bb.y + clip.y, width: clip.w, height: clip.h } }); }
  else await cv.screenshot({ path: resolve(ROOT, `shots/b96-murmur-${name}.png`) });
  console.log(name.padEnd(11), JSON.stringify(r));
  await p.close();
}
await b.close();
