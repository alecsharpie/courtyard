// #90: the cart on its way EAST (first east cart-market day >= 10 under CART_EAST's salt) — on the bridge and passing the far-bank gatehouse — warped live inside one evaluate on a fresh page.
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
const STATES = [
  ['east-bridge', c => c.out && c.hx > 0.9 && c.x > 118 && c.x < 121],
  ['east-gate',   c => c.out && c.hx > 0.9 && c.x > 133 && c.x < 135.5],
  ['east-edge',   c => c.out && c.hx > 0.9 && c.x > 138.5],
];
for (const [name, pred] of STATES){
  const page = await br.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=3&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([src]) => {
    const pred = eval(src);
    let d0 = 10; while (!(isMarketDay.call && (d0 % 4 === 2) && hash(d0, 733) < CART_P && hash(d0, 763) < CART_EAST)) d0 += 4;
    window.__reseed(); window.__warp(d0 * 55);
    for (let i = 0; i < 55 / 0.1; i++){ window.__warp(0.1); if (cart && pred(cart)) break; }
    if (!cart || !pred(cart)) return { d0, miss:true };
    window.__draw && window.__draw();
    const c = cart, [sx, sy] = project(c.x + c.hx * 1.2, c.y + c.hy * 1.2, 0.5);
    const cv = document.querySelector('canvas').getBoundingClientRect();
    return { d0, hour:+hour.toFixed(2), x:+c.x.toFixed(1), y:+c.y.toFixed(1), name: cartName(), W: cv.width,
             clip:{ x: Math.max(0, cv.left + sx - 160), y: cv.top + sy - 90, width: 320, height: 170 } };
  }, [pred.toString()]);
  if (r.miss){ console.log(name, 'NOT REACHED on day', r.d0); await page.close(); continue; }
  await page.waitForTimeout(80);
  await page.screenshot({ path: `shots/cart-${name}.png`, clip: r.clip });
  if (name === 'east-bridge') await page.screenshot({ path: `shots/cart-east-wide.png` });
  console.log(name, JSON.stringify({ ...r, clip: undefined }));
  await page.close();
}
await br.close();
