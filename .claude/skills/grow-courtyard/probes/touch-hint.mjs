#!/usr/bin/env node
/* touch-hint.mjs — the census cannot see an affordance, so measure it.
 *
 * Four questions, numerically:
 *   1. Cursor: over a grid of real screen points, does the cursor say `pointer`
 *      on exactly the cells the click handler answers, and `default` on the rest?
 *      Agreement must be 100% — one predicate, both readers — and the live share
 *      must be a big enough share of the frame that a hand finds it by accident.
 *   2. Click: a `pointer` point actually changes the ticker; a `default` point
 *      does not. The hint may not promise a response the click will not give.
 *   3. Invitation: appears exactly ONCE, not before INVITE_AT, holds the surface
 *      for at least TICK_DWELL, and never comes back inside the window.
 *   4. Stands down: if the viewer clicks first, the invitation never comes.
 *      And at 390x844 (no cursor, no ticker) it borrows the sill, fits on one
 *      line untruncated, and gives the plate and the clock back.
 *
 * Runs WITHOUT ?pause on purpose: the invitation is suppressed on a harness-driven
 * page, and it is timed in real seconds, so this probe is wall-clock slow (~60 s).
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '42');

const b = await chromium.launch();
const errs = [];
let bad = 0;
const fail = m => { bad++; console.log('  FAIL ' + m); };

/* ---- 1 & 2: the cursor, against the click handler's own predicate ---- */
{
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}`);
  await p.waitForFunction('typeof window.__census === "function"');

  const box = await p.locator('#cv').boundingBox();
  const pts = [];
  // INTEGER screen coordinates: Chromium rounds the coordinates it puts on the
  // event, so a fractional point makes the page floor a different cell than this
  // probe does, and the run reports ~4% phantom disagreements along terrain edges.
  for (let iy = 1; iy < 16; iy++) for (let ix = 1; ix < 24; ix++)
    pts.push([Math.round(box.x + box.width * ix / 24), Math.round(box.y + box.height * iy / 16)]);

  let live = 0, disagree = 0;
  for (const [sx, sy] of pts) {
    await p.mouse.move(sx, sy);
    const r = await p.evaluate(({ sx, sy }) => {
      const r = cv.getBoundingClientRect();
      const [wx, wy] = unproject(sx - r.left, sy - r.top);
      return { want: answersTouch(Math.floor(wx), Math.floor(wy)),
               got: getComputedStyle(cv).cursor };
    }, { sx, sy });
    if (r.want) live++;
    if (r.want !== (r.got === 'pointer')) { disagree++; if (disagree < 4) console.log(`  disagree @${sx | 0},${sy | 0} want=${r.want} got=${r.got}`); }
  }
  const share = (100 * live / pts.length).toFixed(1);
  console.log(`cursor: ${pts.length} points · live ${live} (${share}% of frame) · disagreements ${disagree}`);
  if (disagree) fail('cursor and click handler disagree on ' + disagree + ' points');
  if (live / pts.length < 0.25) fail('only ' + share + '% of the frame answers — too little to find');

  // does a live point actually DO something, and a dead one not?
  const probeClick = async (wantLive) => {
    for (const [sx, sy] of pts) {
      const r = await p.evaluate(({ sx, sy }) => {
        const r = cv.getBoundingClientRect();
        const [wx, wy] = unproject(sx - r.left, sy - r.top);
        return answersTouch(Math.floor(wx), Math.floor(wy));
      }, { sx, sy });
      if (r !== wantLive) continue;
      await p.evaluate(() => { tickerEl.textContent = '<<none>>'; tickerTimer = -99; });
      await p.mouse.click(sx, sy);
      return await p.evaluate(() => tickerEl.textContent);
    }
    return null;
  };
  const onLive = await probeClick(true), onDead = await probeClick(false);
  console.log(`click: live cell -> "${(onLive || '').slice(0, 46)}"  ·  dead cell -> "${onDead}"`);
  if (!onLive || onLive === '<<none>>') fail('a pointer cell did not answer a click');
  if (onDead !== '<<none>>') fail('a default cell answered a click');
  await p.close();
}

/* ---- 3: the invitation, watched in real time on a fresh page ---- */
const watch = async (opts) => {
  const p = await b.newPage({ viewport: opts.viewport });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}`);
  await p.waitForFunction('typeof window.__census === "function"');
  const t0 = Date.now();
  if (opts.clickAt) {
    await new Promise(r => setTimeout(r, opts.clickAt * 1000));
    const box = await p.locator('#cv').boundingBox();
    await p.mouse.click(box.x + box.width * 0.30, box.y + box.height * 0.55);
  }
  const seen = [];
  while (Date.now() - t0 < opts.secs * 1000) {
    const s = await p.evaluate(() => ({
      txt: tickerEl.textContent,
      tickerShown: tickerEl.offsetWidth > 0,
      clipped: tickerEl.scrollWidth > tickerEl.clientWidth + 1,
      plateShown: document.getElementById('plate').offsetWidth > 0,
      inviting: document.getElementById('sill').classList.contains('inviting'),
    }));
    seen.push({ t: (Date.now() - t0) / 1000, ...s });
    await new Promise(r => setTimeout(r, 250));
  }
  await p.close();
  return seen;
};

const INV = { wide: 'Reach out of the window', narrow: 'Touch the picture' };
{
  const s = await watch({ secs: 26, viewport: { width: 1280, height: 760 } });
  const hits = s.filter(r => r.txt.startsWith(INV.wide));
  const runs = s.reduce((a, r, i) => a + (r.txt.startsWith(INV.wide) && !(s[i - 1] || {}).txt?.startsWith(INV.wide) ? 1 : 0), 0);
  const first = hits.length ? hits[0].t : -1, last = hits.length ? hits[hits.length - 1].t : -1;
  console.log(`invite wide: runs ${runs} · first seen ${first}s · on screen ${(last - first).toFixed(2)}s · lines seen ${new Set(s.map(r => r.txt)).size}`);
  if (runs !== 1) fail('invitation appeared ' + runs + ' times in 26 s, must be exactly 1');
  if (first < 8) fail('invitation came at ' + first + 's, before INVITE_AT');
  if (first > 16) fail('invitation came at ' + first + 's — too late to be found');
  if (last - first < 5.0) fail('invitation held the surface ' + (last - first) + 's, under INVITE_DWELL');
}
{
  const s = await watch({ secs: 24, clickAt: 3, viewport: { width: 1280, height: 760 } });
  const hits = s.filter(r => r.txt.startsWith(INV.wide)).length;
  console.log(`invite after a click at 3s: appearances ${hits} (want 0)`);
  if (hits) fail('invitation came to a viewer who had already touched the picture');
}
{
  const s = await watch({ secs: 24, viewport: { width: 390, height: 844 } });
  const hits = s.filter(r => r.txt.startsWith(INV.narrow));
  const shown = hits.filter(r => r.tickerShown);
  const clipped = shown.filter(r => r.clipped).length;
  const first = shown.length ? shown[0].t : -1;
  const back = s.filter(r => r.t > (first < 0 ? 1e9 : first) && !r.inviting && r.plateShown);
  console.log(`invite 390x844: visible samples ${shown.length}/${hits.length} · first ${first}s · clipped ${clipped} · plate back at ${back.length ? back[0].t : 'never'}s`);
  if (!shown.length) fail('narrow sill never showed the invitation');
  if (clipped) fail('invitation truncated on a narrow sill in ' + clipped + ' samples');
  if (!back.length) fail('narrow sill never gave the plate and the clock back');
}

await b.close();
console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'page errors: 0');
console.log(bad || errs.length ? `VERDICT: FAIL (${bad})` : 'VERDICT: PASS');
process.exit(bad || errs.length ? 1 : 0);
