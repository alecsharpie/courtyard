/* #169 — the frontage and the door across one day: is the set-out drawn, in order, and
 * do the casks stand? Crops the block from the tap's door (x 23) to the cafe's tables
 * (x 31), both footways, taken off project() rather than a measured pixel. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const TAG = process.argv[3] || 'open';
const OUT = resolve(REPO,'shots'); mkdirSync(OUT, { recursive: true });
const H = h => ((h < 6 ? h + 24 : h) - 6) / 24 * 55;
// n=6 -> midsummer (sunUp 4.0), n=19 -> midwinter (sunUp 7.0)
const MARKS = [
  ['a-0300', 6 * 55 + H(3.0),  42], ['b-0500', 6 * 55 + H(5.05), 42],
  ['c-0530', 6 * 55 + H(5.4),  42], ['d-0900', 6 * 55 + H(9.0),  42],
  ['e-1400', 6 * 55 + H(14.0), 42], ['f-2230', 6 * 55 + H(22.6), 42],
  ['g-win0700', 19 * 55 + H(7.0), 42], ['h-win0830', 19 * 55 + H(8.35), 42],
];
const b = await chromium.launch();
for (const [name, t, seed] of MARKS){
  const p = await b.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:3 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(FILE + `?pause&seed=${seed}&t=0`);
  await p.waitForFunction(() => window.__warp);
  const info = await p.evaluate(tt => {
    window.__reseed(); window.__warp(tt);
    const r = document.querySelector('canvas').parentElement.getBoundingClientRect();
    const [xa, ya] = project(21.5, 64.0, 3.4);
    const [xb, yb] = project(32.0, 79.5, 0);
    return { x:xa + r.left, y:ya + r.top, x1:xb + r.left, y1:yb + r.top,
      hour:+hour.toFixed(2), day, sunUp:+sunUp.toFixed(2), sunDown:+sunDown.toFixed(2),
      setF: CAFE_TABLES.map(tb => +tb.p.toFixed(2)),
      taken: CAFE_TABLES.map(tb => tb.taken), casks: casksOut(), caskDay,
      opener: !!front, dray: !!dray,
      here: agents.filter(a => a.x > 20 && a.x < 33 && a.y > 63).map(a => a.kind) };
  }, t);
  const clip = { x: Math.round(info.x), y: Math.round(info.y),
                 width: Math.round(info.x1 - info.x), height: Math.round(info.y1 - info.y) };
  await p.screenshot({ path: join(OUT, `${TAG}-${name}.png`), clip });
  console.log(name.padEnd(10), JSON.stringify(info).replace(/"(x1?|y1?)":[-\d.]+,/g, ''));
  await p.close();
}
await b.close();
