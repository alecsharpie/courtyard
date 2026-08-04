#!/usr/bin/env node
/* probe-paving.mjs — the census cannot see a sentence. Two questions, numerically:
 *
 *   1. TOTALITY. Every SIDE/ROAD cell in the world — and there are thousands,
 *      spread over five separate quarters — must be placed by pavingAt() inside
 *      the box that place declares. One predicate, one definition: if a cell is
 *      named "quay" but sits outside the quay's box, the birds go somewhere the
 *      words did not promise. Assert zero escapes, and print the census of cells
 *      per place so a place that is silently empty shows up as a 0.
 *
 *   2. THE PROMISE. Click one real screen point in each place, read the ticker,
 *      and read where the birds actually landed. The line must be that place's
 *      line, every bird must be inside that place's box, and the word "lane" must
 *      appear for the lane and the lane only.
 *
 * Driven with ?pause: the clock is frozen, the invitation stands down, and the
 * birds sit where they were spawned instead of hopping away between the click and
 * the read. ?t picks an hour with daylight > 0.2, which is the spawn's own gate.
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '42'), simT = arg('--t', '175');

let bad = 0;
const fail = m => { bad++; console.log('  FAIL ' + m); };
const errs = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
p.on('pageerror', e => errs.push(String(e)));
await p.goto(`${PAGE}?seed=${seed}&pause&t=${simT}`);
await p.waitForFunction('typeof window.__census === "function"');

/* ---- 1: totality — every paving cell lands inside the box it was named for ---- */
{
  const r = await p.evaluate(() => {
    const per = {}, escapes = [];
    for (const k in PAVING) per[k] = 0;
    for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++) {
      const g = grid[y * GW + x];
      if (g !== SIDE && g !== ROAD && g !== PATH) continue;
      const q = pavingAt(x, y);
      const key = Object.keys(PAVING).find(k => PAVING[k] === q);
      per[key]++;
      if (x + 0.5 < q.x0 || x + 0.5 > q.x1 || y + 0.5 < q.y0 || y + 0.5 > q.y1)
        if (escapes.length < 6) escapes.push({ x, y, key });
    }
    return { per, escapes, total: Object.values(per).reduce((a, n) => a + n, 0) };
  });
  console.log('paving cells by place (' + r.total + ' SIDE/ROAD/PATH cells in the world):');
  for (const [k, n] of Object.entries(r.per)) {
    console.log('  ' + k.padEnd(9) + String(n).padStart(6));
    if (!n) fail('place "' + k + '" claims no cell in the world — it can never be clicked');
  }
  if (r.escapes.length) fail(r.escapes.length + '+ cells named for a place they are outside: ' +
    JSON.stringify(r.escapes));
}

/* ---- 1b: the 0.9-cell law, EXHAUSTIVELY. Twelve hand-picked clicks below say
 * nothing about the 2,626 PATH cells added at #24 — and the courtyard and the
 * plaza are the first places whose shape is not the box that contains them (an
 * annulus round a garden; a square with a fountain in the middle). So run
 * crumbSpot itself over EVERY paving cell in the world, several draws each, and
 * count: birds outside their own box, pairs under 0.9 cells apart, and birds that
 * came down in water. A hand-picked point cannot find the one cell that fails. */
{
  const r = await p.evaluate(() => {
    const DRAWS = 6, per = {};
    const key = q => Object.keys(PAVING).find(k => PAVING[k] === q);
    for (const k in PAVING) per[k] = { cells: 0, out: 0, close: 0, wet: 0, minGap: 9, maxShift: 0 };
    for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++) {
      const g = grid[y * GW + x];
      if (g !== SIDE && g !== ROAD && g !== PATH) continue;
      const q = pavingAt(x, y), s = per[key(q)];
      s.cells++;
      for (let d = 0; d < DRAWS; d++) {
        const b = [0, 1, 2].map(k => crumbSpot(q, x, y, k));
        for (const [bx, by] of b) {
          if (bx < q.x0 || bx > q.x1 || by < q.y0 || by > q.y1) s.out++;
          const gx = Math.floor(bx), gy = Math.floor(by);
          if (gx >= 0 && gy >= 0 && gx < GW && gy < WH && grid[gy * GW + gx] === WATER) s.wet++;
          s.maxShift = Math.max(s.maxShift, Math.hypot(bx - (x + 0.5), by - (y + 0.5)));
        }
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
          const gap = Math.hypot(b[i][0] - b[j][0], b[i][1] - b[j][1]);
          s.minGap = Math.min(s.minGap, gap);
          if (gap < 0.9) s.close++;
        }
      }
    }
    __reseed();
    return { per, DRAWS };
  });
  console.log(`\ncrumbSpot over every paving cell, ${r.DRAWS} draws each — box escapes, pairs under 0.9, birds in water:`);
  for (const [k, s] of Object.entries(r.per)) {
    console.log(`  ${k.padEnd(9)} ${String(s.cells).padStart(5)} cells · outside ${s.out} · under-0.9 ${s.close}` +
                ` · in water ${s.wet} · closest pair ${s.minGap.toFixed(2)} · furthest bird ${s.maxShift.toFixed(1)} cells from the click`);
    if (s.out) fail(`${k}: ${s.out} birds outside their own box`);
    if (s.close) fail(`${k}: ${s.close} bird pairs under 0.9 cells — they draw as one shape`);
    if (s.wet) fail(`${k}: ${s.wet} birds came down in water`);
  }
}

/* ---- 2: the promise — one click per place, words and birds together ---- */
const CASES = [
  ['lane',    30, 77],   // south footway of the lane, well west
  ['lane',    30, 72],   // the lane's roadway
  ['bridge', 120, 72],   // the deck, mid-span
  ['cross',   67, 30],   // west footway of the cross street
  ['cross',   70, 20],   // its roadway
  ['mouth',  105, 62],   // the plaza's mouth onto the lane
  ['quay',   113, 30],   // the quay strip, water one cell east
  ['towpath', 128, 40],  // the far bank
  ['court',   32, 10],   // the courtyard's own flags, north of the garden
  ['plaza',  105, 25],   // the roundel, five cells north of the basin
  ['plaza',  100, 30],   // the roundel's west edge, level with the basin
  // the edges, where a per-bird clamp would collapse the scatter into a heap
  ['lane',     0, 65],   // west end of the lane, hard against the world edge
  ['quay',   112,  0],   // the quay's north end
  ['mouth',  102, 64],   // the plaza mouth's west jamb
  ['towpath',129, 64],   // the towpath's foot, where it meets the lane
  ['court',    6, 32],   // the courtyard's west edge, beside the passage
  ['plaza',   99,  3],   // the plaza's north-west corner
];
const box = await p.locator('#cv').boundingBox();
console.log('\nclick -> line -> where the birds landed:');
for (const [want, cx, cy] of CASES) {
  const pt = await p.evaluate(({ cx, cy }) => {
    const s = project(cx + 0.5, cy + 0.5, 0);
    const g = grid[cy * GW + cx];
    return { sx: s[0], sy: s[1],
             kind: g === ROAD ? 'ROAD' : g === SIDE ? 'SIDE' : g === PATH ? 'PATH' : 'OTHER',
             live: answersTouch(cx, cy) };
  }, { cx, cy });
  if (!pt.live || pt.kind === 'OTHER') { fail(`(${cx},${cy}) is not paving (${pt.kind}) — the case is wrong, not the code`); continue; }

  await p.evaluate(() => { birds.length = 0; tickerQ.length = 0; tickerTimer = -99; tickerEl.textContent = '<<none>>'; });
  await p.mouse.click(Math.round(box.x + pt.sx), Math.round(box.y + pt.sy));
  const got = await p.evaluate(({ want }) => ({
    txt: tickerEl.textContent,
    birds: birds.map(b => [+b.x.toFixed(2), +b.y.toFixed(2)]),
    out: birds.filter(b => b.x < PAVING[want].x0 || b.x > PAVING[want].x1 ||
                           b.y < PAVING[want].y0 || b.y > PAVING[want].y1).length,
    close: birds.some((b, i) => birds.some((c, j) => j > i && Math.hypot(b.x - c.x, b.y - c.y) < 0.9)),
    line: PAVING[want].line,
  }), { want });

  const spanX = got.birds.length ? Math.max(...got.birds.map(b => b[0])) - Math.min(...got.birds.map(b => b[0])) : 0;
  const spanY = got.birds.length ? Math.max(...got.birds.map(b => b[1])) - Math.min(...got.birds.map(b => b[1])) : 0;
  console.log(`  ${want.padEnd(8)} (${cx},${cy}) ${pt.kind}  birds ${got.birds.length} · spread ${spanX.toFixed(1)}x${spanY.toFixed(1)} · outside ${got.out}` +
              (got.close ? ' · OVERLAP' : '') + `\n      "${got.txt}"`);
  if (got.txt !== got.line) fail(`(${cx},${cy}) should say the ${want} line, said "${got.txt}"`);
  if (got.birds.length !== 3) fail(`(${cx},${cy}) spawned ${got.birds.length} birds, want 3`);
  if (got.out) fail(`(${cx},${cy}) put ${got.out} of 3 birds outside the ${want}`);
  if (got.close) fail(`(${cx},${cy}) birds closer than 0.9 cells — three of them read as one shape`);
  if (want !== 'lane' && /\blane\b/i.test(got.txt)) fail(`a click on the ${want} said "lane"`);
  if (want === 'lane' && !/\blane\b/i.test(got.txt)) fail('a click on the lane did not say lane');
}

/* the bird cap and the daylight gate are untouched — check they still hold ---- */
{
  await p.evaluate(() => { birds.length = 0; tickerTimer = -99; });
  const pt = await p.evaluate(() => { const s = project(30.5, 77.5, 0); return { sx: s[0], sy: s[1] }; });
  for (let i = 0; i < 3; i++) await p.mouse.click(Math.round(box.x + pt.sx), Math.round(box.y + pt.sy));
  const n = await p.evaluate(() => birds.length);
  console.log(`\ncap: three clicks in a row -> ${n} birds (cap fires at 4, so 6 is right and 9 is not)`);
  if (n > 6) fail('bird cap no longer holds: ' + n + ' birds after three clicks');

  const night = await b.newPage({ viewport: { width: 1280, height: 760 } });
  await night.goto(`${PAGE}?seed=${seed}&pause&t=45`);          // hour ~01.00 of a 55 s day
  await night.waitForFunction('typeof window.__census === "function"');
  const nb = await night.locator('#cv').boundingBox();
  const dl = await night.evaluate(() => daylight);
  const ns = await night.evaluate(() => { const s = project(30.5, 77.5, 0); return { sx: s[0], sy: s[1] }; });
  await night.mouse.click(Math.round(nb.x + ns.sx), Math.round(nb.y + ns.sy));
  const nbirds = await night.evaluate(() => birds.length);
  console.log(`night gate: daylight ${dl.toFixed(3)} -> ${nbirds} birds from a click (want 0)`);
  if (dl <= 0.2 && nbirds) fail('birds landed at daylight ' + dl.toFixed(3) + ', under the 0.2 gate');
  await night.close();
}

/* ---- 3 (--shot): the numbers say the birds are 1.3 cells apart on a two-cell
 * quay. Only the eye says whether that reads as three birds. Click, warp until
 * they are down (z falls 6/s from 9), and crop to the place. ---- */
if (process.argv.includes('--shot')) {
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(resolve(HERE, '../../../..', 'shots'), { recursive: true });
  // a ten-cell crop off a 1280-wide page is ~100 px; at 1:1 three birds and one
  // bird look identical. Shoot the crop on its own 4x page instead.
  const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 4 });
  const p = await ctx.newPage();
  await p.goto(`${PAGE}?seed=${seed}&pause&t=${simT}`);
  await p.waitForFunction('typeof window.__census === "function"');
  const box = await p.locator('#cv').boundingBox();
  for (const [name, cx, cy] of [
    ['paving-quay',    113, 30],
    ['paving-towpath', 128, 40],
    ['paving-plaza',   105, 62],
    // #24: the two surfaces PATH added. The roundel pair is the keep-out working —
    // clicked one cell off the basin's rim, north and west, where the shove bites.
    ['paving-court',    32, 10],
    ['paving-court-w',   6, 32],
    ['paving-roundel-n',105, 27],
    ['paving-roundel-w',103, 30],
  ]) {
    await p.evaluate(() => { birds.length = 0; });
    // crop from the click's own projected point, ±5 cells: a fraction-of-frame clip
    // put two of the three birds outside the picture and read as a bug
    const s = await p.evaluate(({ cx, cy }) => {
      const q = project(cx + 0.5, cy + 0.5, 0), a = project(cx - 5, cy - 5, 0), z = project(cx + 5, cy + 5, 0);
      return { sx: q[0], sy: q[1], x0: a[0], y0: a[1], w: z[0] - a[0], h: z[1] - a[1] };
    }, { cx, cy });
    await p.mouse.click(Math.round(box.x + s.sx), Math.round(box.y + s.sy));
    await p.evaluate(() => __warp(1.8));
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const png = await p.screenshot({ clip: { x: box.x + s.x0, y: box.y + s.y0, width: s.w, height: s.h } });
    writeFileSync(resolve(HERE, '../../../..', 'shots', name + '.png'), png);
    console.log('  -> shots/' + name + '.png');
  }
  await ctx.close();
}

await p.close();
await b.close();
if (errs.length) { console.log('\npage errors:'); errs.slice(0, 4).forEach(e => console.log('  ' + e)); bad += errs.length; }
console.log('\n' + (bad ? 'VERDICT: FAIL (' + bad + ')' : 'VERDICT: PASS'));
process.exit(bad ? 1 : 0);
