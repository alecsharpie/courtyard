/* the carter (#82): crops of the cart in four states, each warped live inside ONE
 * evaluate on a fresh page (LAWS: pin by warping, not by seed alone). Writes
 * shots/cart-<state>.png. Day 10 is a cart day AND a market day; day 11 a plain one. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
const STATES = [
  ['gate',   11, c => c.state === 'stop' && c.at === 'gate' && c.loader && c.loader.state === 'stand'],
  ['turn',   11, c => c.out && c.hy > -0.7 && c.hy < 0.7],
  ['north',  11, c => c.out && c.hy < -0.95 && c.y < 30],
  ['lane',   10, c => c.y > 69 && c.hx < -0.9 && c.x < 66 && c.state === 'drive'],
  ['stalls', 10, c => c.state === 'stop' && c.at === 'market'],
];
for (const [name, day0, pred] of STATES){
  const page = await br.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=3&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([day0, src]) => {
    const pred = eval(src);
    window.__reseed(); window.__warp(day0 * 55);
    for (let i = 0; i < 55 / 0.1; i++){ window.__warp(0.1); if (cart && pred(cart)) break; }
    if (!cart || !pred(cart)) return null;
    window.__draw && window.__draw();
    const c = cart, [sx, sy] = project(c.x + c.hx * 1.2, c.y + c.hy * 1.2, 0.5);
    const cv = document.querySelector('canvas').getBoundingClientRect();
    return { hour:+hour.toFixed(2), day, x:+c.x.toFixed(1), y:+c.y.toFixed(1), h:[+c.hx.toFixed(2), +c.hy.toFixed(2)], name: cartName(),
             clip:{ x: cv.left + sx - 110, y: cv.top + sy - 80, width: 220, height: 150 }, loaderNear: c.loader ? +Math.hypot(c.loader.x - c.x, c.loader.y - c.y).toFixed(2) : null };
  }, [day0, pred.toString()]);
  if (!r){ console.log(name, 'NOT REACHED'); await page.close(); continue; }
  await page.waitForTimeout(80);
  await page.screenshot({ path: `shots/cart-${name}.png`, clip: r.clip });
  console.log(name, JSON.stringify({ ...r, clip: undefined }));
  await page.close();
}
await br.close();
