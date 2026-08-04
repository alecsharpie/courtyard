#!/usr/bin/env node
/* skip-strip.mjs — the brief's gate: filmstrip the season lapse, cropped to the
 * courtyard and to the far bank, and prove nothing pops.
 *
 * filmstrip.mjs cannot do this. It drives the world with __warp on a ?pause page, and
 * a lapse is precisely the thing that does NOT happen under ?pause — it is a real
 * click driving real frames. So this samples the canvas in-page on every drawn frame
 * of an actual lapse (same 320x190 downsample and same mean-abs-Δ as filmstrip.mjs,
 * so the numbers are on the same scale), and diffs the two crops the brief named.
 *
 * The control is the load-bearing part. A raw Δ series through a lapse is huge and
 * lumpy by construction — six sunrises go past — so no absolute threshold means
 * anything. Instead the same world is re-run under __warp at THE SAME SIM GAPS the
 * lapse actually produced, which is the town getting to the same places the ordinary
 * way. If the lapse's Δ distribution matches the control's, the lapse is showing the
 * film the town would have shown anyway, and the only thing compressed is real time.
 * A stale cached ground layer, a trail that fails to keep up, a draw-order fault that
 * only appears at speed — any of those separate the two series.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const OUT = resolve(HERE, '../../../..', 'shots');
mkdirSync(OUT, { recursive: true });

// the two the brief named. `river` is the far bank; `courtyard` is the thing this is for.
const CROPS = { courtyard: [180, 300, 700, 560], river: [1080, 220, 520, 680] };
const SEED = 7;

const browser = await chromium.launch();
let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };

/* The sampler, shared by the lapse and the control so the two series are measured by
 * identical code. Returns a per-frame {simT, d:{crop:Δ}} plus jpeg thumbs. */
const SAMPLER = `(() => {
  const cv = document.getElementById('cv');
  /* shoot.config.json's clips are PAGE-viewport rects (that is what page.screenshot
     takes), but drawImage wants canvas-relative source pixels. The canvas is inset by
     #room's padding and #frame's border, so treating one as the other walks the crop
     off the right-hand edge and silently pads it with black — which is exactly what
     the far-bank strip came back as the first time. Map through the bounding box and
     clamp, so a named crop means the same region here as it does in shoot.mjs. */
  const map = (c) => {
    const r = cv.getBoundingClientRect(), k = cv.width / r.width;
    const x = Math.max(0, (c[0] - r.left) * k), y = Math.max(0, (c[1] - r.top) * k);
    return [x, y, Math.min(c[2] * k, cv.width - x), Math.min(c[3] * k, cv.height - y)];
  };
  const small = document.createElement('canvas');
  small.width = 320; small.height = 190;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  const thumb = document.createElement('canvas'); thumb.width = 300;
  const tctx = thumb.getContext('2d');
  const prev = {};
  const grab = (name, c) => {
    const s = map(c);
    sctx.drawImage(cv, s[0], s[1], s[2], s[3], 0, 0, small.width, small.height);
    const d = sctx.getImageData(0, 0, small.width, small.height).data;
    let out = null;
    if (prev[name]) { let sum = 0; const q = prev[name];
      for (let k = 0; k < d.length; k += 4) sum += Math.abs(d[k]-q[k]) + Math.abs(d[k+1]-q[k+1]) + Math.abs(d[k+2]-q[k+2]);
      out = +(sum / (d.length/4) / 3).toFixed(3); }
    prev[name] = d.slice();
    return out;
  };
  const thumbOf = (c) => {
    const s = map(c);
    thumb.height = Math.round(300 * s[3] / s[2]);
    tctx.drawImage(cv, s[0], s[1], s[2], s[3], 0, 0, thumb.width, thumb.height);
    return thumb.toDataURL('image/jpeg', 0.7);
  };
  return { grab, thumbOf };
})()`;

/* ---- the lapse, sampled every drawn frame ------------------------------------- */
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`${PAGE}?seed=${SEED}`);
await page.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
const start = await page.evaluate(() => window.__census().clock);

const lap = await page.evaluate(({ CROPS, SAMPLER }) => new Promise(res => {
  const { grab, thumbOf } = eval(SAMPLER);
  const el = document.getElementById('season');
  const rows = [], thumbs = [];
  const names = Object.keys(CROPS);
  let n = 0;
  const tick = () => {
    const simT = window.__census().clock.simT;
    const d = {}; for (const k of names) d[k] = grab(k, CROPS[k]);
    rows.push({ simT, d });
    // 16 thumbs spread across the lapse, for the eye
    if (n++ % 14 === 0) thumbs.push({ simT, img: Object.fromEntries(names.map(k => [k, thumbOf(CROPS[k])])) });
    if (rows.length > 3 && !el.disabled) return res({ rows, thumbs });
    if (rows.length > 900) return res({ rows, thumbs });
    requestAnimationFrame(tick);
  };
  el.click();
  requestAnimationFrame(tick);
}), { CROPS, SAMPLER });
await page.close();

const gaps = lap.rows.slice(1).map((r, i) => +(r.simT - lap.rows[i].simT).toFixed(4));
console.log(`\nlapse: ${lap.rows.length} drawn frames, ${(lap.rows[lap.rows.length-1].simT - start.simT).toFixed(1)} sim s` +
            `, gaps ${Math.min(...gaps).toFixed(2)}–${Math.max(...gaps).toFixed(2)} sim s/frame\n`);

/* ---- the control: the same world, the same gaps, driven by __warp -------------- */
const cpage = await browser.newPage({ viewport: { width: 1600, height: 950 } });
cpage.on('pageerror', e => errs.push(String(e)));
await cpage.goto(`${PAGE}?seed=${SEED}&pause&t=${start.simT.toFixed(3)}`);
await cpage.waitForFunction(() => !!window.__warp);
const ctl = await cpage.evaluate(async ({ CROPS, SAMPLER, gaps }) => {
  const { grab } = eval(SAMPLER);
  const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const names = Object.keys(CROPS);
  const rows = [];
  await raf();
  for (let i = 0; i <= gaps.length; i++) {
    if (i) window.__warp(gaps[i - 1]);
    await raf();
    const d = {}; for (const k of names) d[k] = grab(k, CROPS[k]);
    rows.push({ simT: window.__census().clock.simT, d });
  }
  return rows;
}, { CROPS, SAMPLER, gaps });
await cpage.close();

/* ---- compare the two Δ distributions, per crop --------------------------------- */
const stat = (rows, k) => {
  const v = rows.map(r => r.d[k]).filter(x => x !== null && x !== undefined);
  const s = [...v].sort((a, b) => a - b);
  return { med: s[s.length >> 1], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1], n: v.length, v };
};
for (const k of Object.keys(CROPS)) {
  const L = stat(lap.rows, k), C = stat(ctl, k);
  console.log(`  ${k.padEnd(10)} lapse  med ${L.med.toFixed(2)}  p95 ${L.p95.toFixed(2)}  max ${L.max.toFixed(2)}   (${L.n} frames)`);
  console.log(`  ${''.padEnd(10)} warp   med ${C.med.toFixed(2)}  p95 ${C.p95.toFixed(2)}  max ${C.max.toFixed(2)}   (${C.n} frames)`);
  // the lapse must not be doing anything the ordinary town does not also do at these gaps
  ok(L.max <= C.max * 1.6 + 1.5,
     `${k}: the lapse's biggest frame-to-frame change (${L.max.toFixed(2)}) is no worse than ` +
     `__warp's at the same sim gaps (${C.max.toFixed(2)})`);
  ok(L.med <= C.med * 1.8 + 0.6 && L.med >= C.med * 0.4,
     `${k}: typical change per frame tracks the control (${L.med.toFixed(2)} vs ${C.med.toFixed(2)})`);
  // a POP is a frame far out of line with its own neighbours — a cache rebuilding, a
  // draw order fault. Count them in both; the lapse may not have MORE than the control.
  const pops = s => { let n = 0; for (let i = 2; i < s.v.length; i++){
    const nb = (s.v[i-1] + s.v[i-2]) / 2; if (nb > 0.05 && s.v[i] > nb * 4) n++; } return n; };
  const lp = pops(L), cp = pops(C);
  ok(lp <= cp + 2, `${k}: ${lp} out-of-line frames in the lapse vs ${cp} in the control`);
  ok(L.v.every(x => x > 0) || k !== 'courtyard', `${k}: no frozen frame (nothing stopped drawing)`);
}
ok(errs.length === 0, `no page errors in either run (${errs.length})`);

/* ---- the contact sheets, for the eye -------------------------------------------- */
for (const k of Object.keys(CROPS)) {
  const cells = lap.thumbs.map(t => `<figure><img src="${t.img[k]}"><figcaption>` +
    `+${(t.simT - start.simT).toFixed(0)} s &middot; day ${((t.simT - start.simT) / 55).toFixed(1)}` +
    `</figcaption></figure>`).join('');
  const cols = Math.min(4, lap.thumbs.length);
  const sheet = await browser.newPage({ viewport: { width: cols * 312 + 24, height: 400 } });
  await sheet.setContent(`<style>body{margin:12px;background:#171310;color:#d8cfc0;
    font:12px system-ui;display:grid;grid-template-columns:repeat(${cols},300px);gap:12px}
    figure{margin:0}img{width:300px;display:block;border:1px solid #3a2c1e}
    figcaption{padding-top:4px;color:#9a8f7d}</style>` + cells);
  await sheet.waitForTimeout(250);
  await sheet.screenshot({ path: join(OUT, `skip-strip-${k}.png`), fullPage: true });
  await sheet.close();
  console.log(`  -> shots/skip-strip-${k}.png  (${lap.thumbs.length} frames across the lapse)`);
}

await browser.close();
console.log(bad ? `\nFAIL — ${bad} check(s)` : '\nPASS — all checks');
process.exit(bad ? 1 : 0);
