/* probe-evening.mjs — does a tap on the clock reach this evening, then the next dawn,
 * honestly? Lapse via the button vs a 1x __warp() to the same instant, on the same seed. */
import { homedir } from 'node:os'; import { join, resolve, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../../../..', 'courtyard.html')).href;
const DAY = 55; let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };
const browser = await chromium.launch();

async function lapse(page, id = 'daytime') {
  return page.evaluate(id => new Promise(res => {
    const el = document.getElementById(id), rows = [], t0 = performance.now();
    const tick = () => {
      const c = window.__census().clock;
      rows.push({ ms: performance.now() - t0, simT: c.simT, hour: c.hour, cloud: cloud, wind: wind, wet: wetness,
                  nightF: +nightF.toFixed(3), lit: LIT.length, sunUp, sunDown, people: window.__entities().length,
                  label: el.textContent, off: el.disabled, seasonOff: document.getElementById('season').disabled });
      if (rows.length > 3 && !el.disabled) return res(rows);
      if (rows.length > 900) return res(rows);
      requestAnimationFrame(tick);
    };
    el.click(); requestAnimationFrame(tick);
  }), id);
}
function continuity(rows, name){
  let mono = true, nan = 0, up = 0, down = 0, wmax = 0, wetmax = 0, n = 0;
  for (let i = 1; i < rows.length; i++){
    const dT = rows[i].simT - rows[i-1].simT; if (dT < 0) mono = false;
    for (const k of ['simT','cloud','wind','wet']) if (!isFinite(rows[i][k])) nan++;
    if (dT >= 0.5){ n++; const r = (rows[i].cloud - rows[i-1].cloud) / dT; up = Math.max(up, r); down = Math.min(down, r);
      wmax = Math.max(wmax, Math.abs(rows[i].wind - rows[i-1].wind) / dT * (DAY/24));   // per sim HOUR
      wetmax = Math.max(wetmax, Math.abs(rows[i].wet - rows[i-1].wet) / dT); }
  }
  ok(mono && nan === 0, `${name}: simT monotone, no NaN in cloud/wind/wet`);
  ok(up <= 0.0206 && down >= -0.0266, `${name}: cover inside its caps +${up.toFixed(4)}/${down.toFixed(4)} per sim s (${n} frames)`);
  ok(wmax <= 1 / 2.5 + 0.02, `${name}: wind max slope ${wmax.toFixed(3)}/h (cap 1/WIND_RISE_H = 0.400)`);
  console.log(`         wet max slope ${wetmax.toFixed(4)}/s`);
  const secs = rows[rows.length-1].ms / 1000;
  ok(secs > 1.8 && secs < 3.6, `${name}: took ${secs.toFixed(2)} real s (${rows.length} frames)`);
  ok(rows.every(r => r.seasonOff === r.off), `${name}: the season button was disabled exactly while the clock was`);
  ok(Math.min(...rows.map(r => r.people)) > 0, `${name}: never empties mid-lapse`);
}

/* ---- A. noon → evening → dawn, sampled --------------------------------------- */
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(PAGE + '?seed=7&t=13.75');    // day 0, 12.00
await page.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
const before = await page.evaluate(() => ({ ...window.__census().clock, sunDown, sunUp, ticker: document.getElementById('ticker').textContent }));
const r1 = await lapse(page); const e1 = r1[r1.length-1];
ok(Math.abs(e1.hour - (e1.sunDown + 1)) < 0.05, `tap 1: ${before.hour.toFixed(2)} → ${e1.hour.toFixed(2)} (sunDown AT LANDING ${e1.sunDown.toFixed(2)} + 1 h; at the tap it was ${before.sunDown.toFixed(2)})`);
ok(e1.nightF > 0.9, `tap 1: nightF ${e1.nightF} — it is night`);
ok(e1.lit > 0, `tap 1: ${e1.lit} lit windows`);
continuity(r1, 'tap 1');
const said = await page.waitForFunction(() => /Evening comes/.test(document.getElementById('ticker').textContent), null, { timeout: 8000 }).then(() => true, () => false);
const afterLand = await page.evaluate(() => ({ t: document.getElementById('ticker').textContent, tap: typeof tapOpen === 'function' ? tapOpen() : null }));
ok(said, `the town says so (within its ticker queue): "${afterLand.t}" (tapOpen ${afterLand.tap})`);
// hold for a second of real time so the evening is on screen, then tap again
await page.waitForTimeout(1000);
const r2 = await lapse(page); const e2 = r2[r2.length-1];
ok(Math.abs(e2.hour - (e2.sunUp + 0.5)) < 0.05, `tap 2: ${e1.hour.toFixed(2)} → ${e2.hour.toFixed(2)} (sunUp at landing ${e2.sunUp.toFixed(2)} + 0.5 h) on day ${(e2.simT/DAY)|0}`);
continuity(r2, 'tap 2');
const said2 = await page.waitForFunction(() => /Morning comes/.test(document.getElementById('ticker').textContent), null, { timeout: 8000 }).then(() => true, () => false);
ok(said2, 'and "Morning comes round again over the block."');
// tap 3 from dawn: evening again, same day
const r3 = await lapse(page); const e3 = r3[r3.length-1];
ok(e3.hour > e2.hour && Math.abs(e3.hour - (e3.sunDown + 1)) < 0.05, `tap 3: dawn ${e2.hour.toFixed(2)} → evening ${e3.hour.toFixed(2)} (sunDown now ${e3.sunDown.toFixed(2)})`);
ok(errs.length === 0, `no page errors (${errs.length})`);
await page.close();

/* ---- B. honest? the same instant at 1x ---------------------------------------- */
// 1x control: pause + __warp from the identical start on the same seed, to e1.simT
const ctl = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await ctl.goto(PAGE + '?pause&seed=7&t=13.75');
await ctl.waitForFunction(() => !!window.__warp);
const c = await ctl.evaluate(async (target) => {
  const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__warp(target - simT); await raf();
  return { simT, hour, lit: LIT.length, people: window.__entities().length, cloud, wind, wet: wetness,
           homers: agents.filter(a => a.kind === 'homer' || a.homer).length, tap: typeof tapOpen === 'function' ? tapOpen() : null };
}, e1.simT);
console.log(`  control @ simT ${c.simT.toFixed(2)} hour ${c.hour.toFixed(2)}: lit ${c.lit}, people ${c.people}, cloud ${c.cloud.toFixed(3)}, wind ${c.wind.toFixed(3)}, wet ${c.wet.toFixed(3)}, homers ${c.homers}`);
console.log(`  lapse   @ simT ${e1.simT.toFixed(2)} hour ${e1.hour.toFixed(2)}: lit ${e1.lit}, people ${e1.people}, cloud ${e1.cloud.toFixed(3)}, wind ${e1.wind.toFixed(3)}, wet ${e1.wet.toFixed(3)}`);
ok(Math.abs(c.lit - e1.lit) <= Math.max(4, c.lit * 0.35), `lit windows within spread of the 1x run (${e1.lit} vs ${c.lit})`);
ok(Math.abs(c.cloud - e1.cloud) < 0.12, `cover within 0.12 of the 1x run`);
ok(Math.abs(c.wind - e1.wind) < 0.15, `wind within 0.15 of the 1x run`);
await ctl.close();

/* ---- C. the night after a tap, frame to frame: any POP? ----------------------- */
const fp = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await fp.goto(PAGE + '?seed=7&t=13.75');
await fp.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
await lapse(fp);
const diffs = await fp.evaluate(() => new Promise(res => {
  const cv = document.getElementById('cv'), off = document.createElement('canvas');
  off.width = cv.width / 4 | 0; off.height = cv.height / 4 | 0; const o = off.getContext('2d', { willReadFrequently: true });
  let prev = null; const out = []; let k = 0;
  const grab = () => { o.drawImage(cv, 0, 0, off.width, off.height); const d = o.getImageData(0, 0, off.width, off.height).data;
    if (prev){ let s = 0; for (let i = 0; i < d.length; i += 4) s += Math.abs(d[i]-prev[i]) + Math.abs(d[i+1]-prev[i+1]) + Math.abs(d[i+2]-prev[i+2]); out.push(+(s / (d.length/4) / 3).toFixed(3)); }
    prev = d; if (++k < 16) setTimeout(grab, 350); else res(out); };
  grab();
}));
const med = [...diffs].sort((a,b)=>a-b)[diffs.length>>1];
const pops = diffs.filter((d, i) => { const nb = [diffs[i-1], diffs[i+1]].filter(x => x !== undefined); return d > 4 * Math.max(0.3, ...nb); });
console.log('  post-tap night Δ (0.35 s gap, 1/4 scale): ' + diffs.join(' '));
ok(pops.length === 0, `night after a tap: ${pops.length} POP (median Δ ${med})`);
await fp.close();

/* ---- D. layout: phone, and the computed style of the new button ----------------- */
const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ph.goto(PAGE + '?seed=7');
await ph.waitForFunction(() => !!window.__census);
const lay = await ph.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect();
  const s = getComputedStyle(document.getElementById('daytime'));
  return { sill: r('sill'), clock: r('daytime'), plate: r('plate'), cv: r('cv'), border: s.borderTopWidth, bg: s.backgroundColor,
           cursor: s.cursor, deco: s.textDecorationLine, after: getComputedStyle(document.getElementById('daytime'), '::after').content, font: s.fontFamily }; });
console.log(`  phone: sill h ${lay.sill.height.toFixed(0)} clock ${lay.clock.width.toFixed(0)}×${lay.clock.height.toFixed(0)} @x${lay.clock.left.toFixed(0)} plate ${lay.plate.width.toFixed(0)}×${lay.plate.height.toFixed(0)} canvas ${lay.cv.width.toFixed(0)}×${lay.cv.height.toFixed(0)}`);
ok(lay.border === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(lay.bg) && lay.cursor === 'pointer', `clock is a label, not a chip (border ${lay.border}, bg ${lay.bg})`);
ok(lay.deco.includes('underline') && lay.after.includes('›'), `underline + chevron (${lay.deco}, ${lay.after})`);
ok(!/Iowan|Palatino|Georgia/.test(lay.font), `kept the sans (${lay.font.slice(0, 30)})`);
ok(lay.clock.right <= 390 && lay.clock.height >= 14, `clock fits the phone row (right ${lay.clock.right.toFixed(0)})`);
await ph.close();
await browser.close();
console.log(bad ? `\nFAIL — ${bad}` : '\nPASS'); process.exit(bad ? 1 : 0);
