/* probe: one tight crop per rig KIND, both headings, so the drawing can be judged.
 * The rigs are pushed onto TRAFFIC by hand at a pinned spot — this photographs the
 * DRAW, not the population; road-load.mjs measures the population.
 *   node probe-rig-sheet.mjs [file]     SEED=… T=… PAD=…
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEED = +(process.env.SEED || 42), T = +(process.env.T || 500), PAD = +(process.env.PAD || 5);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 8 });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(FILE).href + `?pause&seed=${SEED}&t=0`, { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.__warp === 'function');
await page.evaluate(({ t }) => { window.__reseed(); window.__warp(t); }, { t: T });
for (const kind of ['trap', 'rider', 'wagon', 'barrow'])
for (const dir of [1, -1]){
  const info = await page.evaluate(({ kind, dir, pad }) => {
    TRAFFIC.length = 0;
    const K = TRAF_KINDS.find(q => q.k === kind), x = 40;
    TRAFFIC.push({ kind, dir, lane: dir > 0 ? TRAF_Y_E : TRAF_Y_W, len: K.len, berth: K.berth,
      x, y: dir > 0 ? TRAF_Y_E : TRAF_Y_W, hx: dir, hy: 0, ph: 3.1, sp: K.sp,
      col: TRAF_PAINT[1], coat: TRAF_COAT[0], load: kind === 'wagon' ? 3 : 1, goods: TRAF_GOODS[0], mate: kind === 'trap',
      who: { shirt: SHIRT[1], pants: PANTS[0], skin: SKIN[1], hat: true } });
    drawScene(simT, 0);
    const t = TRAFFIC[0];
    const a = project(t.x - pad, t.y - 3.0, 2.9), b = project(t.x + pad, t.y + 2.6, 0);
    const r = cv.getBoundingClientRect(), k = 1;   // project() is CSS px inside the canvas, not device px (LAWS)
    return { x: r.left + Math.min(a[0], b[0]) * k, y: r.top + Math.min(a[1], b[1]) * k,
             w: Math.abs(b[0] - a[0]) * k, h: Math.abs(b[1] - a[1]) * k, hour: +hour.toFixed(2),
             dbg: { a, b, k, rt: r.top, rl: r.left, rw: r.width, cw: cv.width, dpr: window.devicePixelRatio, cellW, cellH } };
  }, { kind, dir, pad: PAD });
  await page.screenshot({ path: `shots/rig-${kind}-${dir > 0 ? 'e' : 'w'}.png`,
    clip: { x: info.x, y: info.y, width: info.w, height: info.h } });
  console.log(`${kind} ${dir > 0 ? 'east' : 'west'}  -> shots/rig-${kind}-${dir > 0 ? 'e' : 'w'}.png`);
}
if (errs.length) console.log('PAGE ERROR', errs[0]);
await browser.close();
