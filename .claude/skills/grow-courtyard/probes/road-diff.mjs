/* probe: how much of the SHIPPING picture is the traffic?
 * The build censuses byte-identically to HEAD, so at one (seed, simT) the two towns
 * are the same town and every differing pixel is a rig. Rendered at the wide framing's
 * shipping size, counted over a Δ3 luma threshold, and quoted as a RATIO to a
 * same-code control (the candidate against itself) — which is the floor a diff of two
 * identical builds can produce at all.
 *   node probe-road-diff.mjs [head] [cand]    SEED=… TS=…
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HEAD = resolve(process.argv[2] || '/tmp/head-courtyard.html');
const CAND = resolve(process.argv[3] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEED = +(process.env.SEED || 42);
const TS = (process.env.TS || '175,566,570,900,1160,1400').split(',').map(Number);
const browser = await chromium.launch();
/* ONE page per (file, instant), and reseed + warp + draw + read all inside ONE
 * evaluate: a ?pause'd page still runs rAF, so warping to six instants down a single
 * page accumulates wall-clock drift between them — the same-code control read 270k-940k
 * px of "difference" between two runs of the SAME file before this was fixed. */
async function shot(file, T){
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  await page.goto(pathToFileURL(file).href + `?pause&seed=${SEED}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ T }) => { window.__reseed(); window.__warp(T);
    drawScene(simT, 0);
    const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height);
    return { w: cv.width, h: cv.height, px: Array.from(im.data),
             rigs: typeof TRAFFIC === 'undefined' ? 0 : TRAFFIC.length }; }, { T });
  await page.close();
  return r;
}
const shots = async (file) => { const o = []; for (const T of TS) o.push(await shot(file, T)); return o; };
const luma = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
function mass(A, B){
  let n = 0, sum = 0, peak = 0;
  for (let i = 0; i < A.px.length; i += 4){
    const dl = Math.abs(luma(A.px, i) - luma(B.px, i));
    if (dl > 3){ n++; sum += dl; if (dl > peak) peak = dl; }
  }
  return { n, mean: n ? sum / n : 0, peak, total: A.px.length / 4 };
}
const [h, c, c2] = [await shots(HEAD), await shots(CAND), await shots(CAND)];
await browser.close();
console.log(`seed ${SEED} · wide framing ${c[0].w}x${c[0].h} device px · Δ>3 luma`);
console.log('    t   rigs |   HEAD vs build px    mean Δ   peak |  same-code control px |  ratio');
let tn = 0, tc = 0;
TS.forEach((T, i) => {
  const m = mass(h[i], c[i]), ctl = mass(c[i], c2[i]);
  tn += m.n; tc += ctl.n;
  console.log(`${String(T).padStart(5)} ${String(c[i].rigs).padStart(6)} | ${String(m.n).padStart(18)} ${m.mean.toFixed(1).padStart(9)} ${m.peak.toFixed(0).padStart(6)} |` +
    ` ${String(ctl.n).padStart(21)} | ${ctl.n ? (m.n / ctl.n).toFixed(1) + 'x' : '∞ (control 0 px)'}`);
});
console.log(`TOTAL ${tn} px of traffic ink over ${tc} px of same-code floor` + (tc ? ` — ${(tn / tc).toFixed(1)}x` : ' — the floor is ZERO'));
