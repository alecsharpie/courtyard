/* #201 — one bay of leads, close enough to judge. The clip is solved in the page and
 * mapped canvas -> CSS through the canvas's own rect: project() returns CANVAS pixels and
 * the element is inset inside the frame, so a clip taken straight off project() lands a
 * whole block north of what it names. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(ROOT, arg('--file', 'courtyard.html'));
const T = arg('--t', '175'), SEED = arg('--seed', '42'), TAG = arg('--tag', '');
const BAYS = arg('--bays', '1,2,3,4,5').split(',').map(Number);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 6 });
await page.goto(pathToFileURL(SRC).href + `?seed=${SEED}&t=${T}`);
await page.waitForFunction('typeof __census === "function"');
await page.waitForTimeout(900);
for (const i of BAYS){
  const r = await page.evaluate(`(() => {
    const bay = LEADS_BAYS[${i}];
    if (!bay) return null;
    const cv = document.querySelector('canvas').getBoundingClientRect();
    const cx = v => cv.left + v * cv.width / W, cy = v => cv.top + v * cv.height / H;
    const a = project(bay.x0 - 0.3, 84.6, 0), c = project(bay.x1 + 0.3, 88, 0);
    return {x0:cx(a[0]), x1:cx(c[0]), y0:cy(a[1]), y1:cy(c[1] + 10),
            kit:JSON.parse(JSON.stringify(bay.kit)), house:bay.house, wash:bayWash(bay),
            tip:+chairTip().toFixed(3), phase:+seasonPhase.toFixed(3),
            leaf:+potLeaf(0).toFixed(2), bloom:+potBloom(0).toFixed(2), fall:+leafFallF().toFixed(2), hour:+hour.toFixed(1), day, dl:+daylight.toFixed(2), snow:+snowCover.toFixed(2), rain:!!raining};
  })()`);
  if (!r) continue;
  await page.screenshot({ path: resolve(ROOT, `shots/bay${TAG}-${i}.png`),
    clip: { x: r.x0, y: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0 } });
  const k = r.kit;
  console.log(`bay${TAG}-${i}  house ${r.house}  wash=${k.wash}/${r.wash}  tidy=${k.tidy.toFixed(2)}  ` +
    `pots=${k.pots.length}[${k.pots.map(p => (p.sp ? 'bay' : 'ger')).join(',')}]  ` +
    `crate=${k.crate ? k.crate.n : 0}  chair=${k.chair ? 'y' : 'n'}  mat=${k.mat ? 'y' : 'n'}` +
    `   | tip ${r.tip} phase ${r.phase} leaf ${r.leaf} bloom ${r.bloom} fall ${r.fall} hour ${r.hour} day ${r.day} dl ${r.dl} snow ${r.snow} rain ${r.rain}`);
}
await page.close(); await b.close();
