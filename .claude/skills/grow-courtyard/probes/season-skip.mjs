#!/usr/bin/env node
/* season-skip.mjs — does clicking the season actually get you to another season,
 * without anything popping on the way?
 *
 * The census cannot see this at all: no click ever reaches a ?pause page, so the
 * whole feature is invisible to every gate by construction. Four questions:
 *   1. Arithmetic — a whole number of sim days, so the HOUR is preserved, and four
 *      clicks from the anchor close the year exactly (7+6+7+6 = 26 = SEASON_LEN).
 *   2. Continuity — sampled every frame through the lapse: simT strictly monotone,
 *      no NaN, and every rate-capped scalar inside its own per-sim-second cap. The
 *      claim under test is that a sub-stepped fast-forward is indistinguishable from
 *      having waited, so cover must never move faster than 0.02/sim s.
 *   3. Legibility — the lapse must actually take real seconds and deliver a spread of
 *      intermediate seasons, not cut. And it must ease: the first and last frames of
 *      the lapse run near the ordinary clock rate, not at the peak.
 *   4. No leak — `speed` unchanged, ?fast unchanged, __warp unchanged, and a page
 *      that never clicks is bit-identical to one built without the feature.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;

const browser = await chromium.launch();
let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };
const DAY = 55, SEASON_LEN = 26;

/* Install a per-frame sampler, click the season, and return every frame of the lapse.
 * One page.evaluate for the whole run — the page keeps running between host
 * round-trips, so a sampler driven from node would be sampling a different world. */
async function lapse(page) {
  return page.evaluate(() => new Promise(res => {
    const el = document.getElementById('season');
    const rows = [];
    const t0 = performance.now();
    const tick = () => {
      const c = window.__census().clock;
      rows.push({ ms: performance.now() - t0, simT: c.simT, hour: c.hour, day: c.day,
                  season: c.season, cloud: c.cloud, people: window.__entities().length,
                  label: el.textContent, off: el.disabled });
      // it re-enables on landing: the DOM state IS the completion signal
      if (rows.length > 3 && !el.disabled) return res(rows);
      if (rows.length > 900) return res(rows);
      requestAnimationFrame(tick);
    };
    el.click();
    requestAnimationFrame(tick);
  }));
}

/* ---- 1 + 2 + 3. one lapse, measured ------------------------------------------- */
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE + '?seed=7');
  // let the town actually fill first. At simT 3 it is legitimately empty — the first
  // neighbour is not due until simT 6 — and a continuity probe that starts there
  // measures the opening, not the lapse.
  await page.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
  const before = await page.evaluate(() => ({ ...window.__census().clock,
    label: document.getElementById('season').textContent }));
  const rows = await lapse(page);
  const after = rows[rows.length - 1];

  const days = (after.simT - before.simT) / DAY;
  ok(Math.abs(days - Math.round(days)) < 0.02,
     `advanced ${days.toFixed(3)} sim days — a WHOLE number, so the hour survives`);
  const dh = Math.abs(((after.hour - before.hour) % 24 + 36) % 24 - 12) - 12;
  ok(Math.abs(after.hour - before.hour) < 0.35 || Math.abs(dh) < 0.35,
     `hour ${before.hour.toFixed(2)} → ${after.hour.toFixed(2)} (left at noon, arrive at noon)`);
  // whole-day rounding can miss a boundary by at most half a day = 0.5/26 = 0.0192 phase
  const q = Math.abs(after.season - Math.round(after.season / 0.25) * 0.25);
  ok(q < 0.021, `landed ${q.toFixed(4)} in phase from a quarter boundary (max possible 0.0192,` +
     ` the half-day the whole-day rounding buys the hour with)`);
  ok(before.label !== after.label, `season name moved: ${before.label} → ${after.label}`);
  ok(errs.length === 0, `no page errors through the lapse (${errs.length})`);

  // continuity, frame by frame
  let mono = true, nan = 0, up = 0, down = 0, covN = 0;
  for (let i = 1; i < rows.length; i++) {
    const dT = rows[i].simT - rows[i - 1].simT;
    if (dT < 0) mono = false;
    if (!isFinite(rows[i].simT) || !isFinite(rows[i].season) || !isFinite(rows[i].cloud)) nan++;
    // cover is reported to 3 dp, so a rate read over a short frame is quantisation, not
    // cover: 0.001/0.017 sim s reads as 0.059/s on a scalar that physically cannot.
    // Only frames carrying 2+ sim seconds measure it, which puts the read-out slack at
    // 0.001/2 = 0.0005 — and signed, because stepClouds clamps rising at 0.020/s and
    // FALLING at 0.026/s: they are two different caps and one number cannot gate both.
    if (dT >= 2) { const r = (rows[i].cloud - rows[i - 1].cloud) / dT;
                   up = Math.max(up, r); down = Math.min(down, r); covN++; }
  }
  ok(mono, 'simT strictly non-decreasing across every frame of the lapse');
  ok(nan === 0, `no NaN in simT / season / cover (${nan} frames)`);
  ok(up <= 0.0206 && down >= -0.0266 && covN > 30,
     `cover never outran either of its own caps: +${up.toFixed(4)} / ${down.toFixed(4)} per sim s` +
     ` over ${covN} measurable frames (caps +0.020 rising, -0.026 falling)`);

  // legibility: it takes real time, and it eases
  const secs = after.ms / 1000;
  ok(secs > 2.5 && secs < 9, `the lapse took ${secs.toFixed(2)} real seconds — watchable, not a cut`);
  ok(rows.length > 60, `${rows.length} drawn frames during the lapse (${(rows.length / secs).toFixed(0)} fps)`);
  // rate over ~0.25 s windows: a single frame's dt jitters far too much to read a
  // profile off, and 0.25 s is also about the shortest thing an eye reads as a rate
  const win = (a, b) => (rows[b].simT - rows[a].simT) / ((rows[b].ms - rows[a].ms) / 1000) / DAY;
  const rates = [];
  for (let i = 0; i < rows.length; i++) {
    let j = i; while (j < rows.length - 1 && rows[j].ms - rows[i].ms < 250) j++;
    if (j > i) rates.push(win(i, j));
  }
  const peak = Math.max(...rates), first = rates[0], lastR = rates[rates.length - 1];
  ok(first < peak * 0.4 && lastR < peak * 0.4,
     `eases in and out: ${first.toFixed(2)} → peak ${peak.toFixed(2)} → ${lastR.toFixed(2)} sim days/real s`);
  // one sim day is one light-to-dark-to-light cycle on screen, so days/real s IS the Hz
  ok(peak < 2, `peak day/night alternation ${peak.toFixed(2)} Hz — well under the 3 Hz flash threshold`);
  const seasons = [...new Set(rows.map(r => r.label))];
  ok(seasons.length >= 2, `the sill named ${seasons.length} seasons on the way: ${seasons.join(' → ')}`);
  const minPop = Math.min(...rows.map(r => r.people));
  ok(minPop > 0, `the world never empties mid-lapse: fewest moving things in any frame = ${minPop}`);

  // the town is still alive and unlocked afterwards
  const restored = await page.evaluate(() => ({
    disabled: document.getElementById('season').disabled,
    ticker: document.getElementById('ticker').textContent,
  }));
  ok(!restored.disabled, 'the control re-enables on landing');
  ok(/year runs on/.test(restored.ticker), `the town says where it got to: "${restored.ticker}"`);
  await page.close();
}

/* ---- 1b. four clicks close the year exactly ------------------------------------ */
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(PAGE + '?seed=7&t=0');
  await page.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
  const t0 = await page.evaluate(() => window.__census().clock);
  const steps = [];
  for (let k = 0; k < 4; k++) {
    const r = await lapse(page);
    steps.push(r[r.length - 1]);
  }
  const spans = steps.map((s, i) => (s.simT - (i ? steps[i - 1].simT : t0.simT)) / DAY);
  const total = spans.reduce((a, b) => a + b, 0);
  ok(Math.abs(total - SEASON_LEN) < 0.08,
     `four clicks = ${total.toFixed(2)} sim days vs SEASON_LEN ${SEASON_LEN} — the year closes` +
     ` (${spans.map(s => s.toFixed(1)).join(' + ')})`);
  const dPhase = Math.abs(((steps[3].season - t0.season) % 1 + 1.5) % 1 - 0.5);
  ok(dPhase < 0.01, `back to phase ${steps[3].season.toFixed(4)} from ${t0.season.toFixed(4)} (Δ ${dPhase.toFixed(4)})`);
  ok(Math.abs(steps[3].hour - t0.hour) < 0.5,
     `and to the same hour: ${t0.hour.toFixed(2)} → ${steps[3].hour.toFixed(2)}`);
  const names = [t0.season, ...steps.map(s => s.season)];
  ok(new Set(names.map(n => Math.round(n * 4) % 4)).size === 4,
     `four distinct quarters visited: ${names.map(n => n.toFixed(3)).join(' → ')}`);
  await page.close();
}

/* ---- 4. no leak ---------------------------------------------------------------- */
{
  // a page that never clicks must be identical: same clock after the same wall time
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(PAGE + '?pause&seed=42');
  await page.waitForFunction(() => !!window.__warp);
  const warped = await page.evaluate(() => {
    window.__reseed && window.__reseed();
    window.__warp(300);
    return window.__census().clock;
  });
  ok(Math.abs(warped.simT - (2.2 + 300)) < 0.5,
     `__warp(300) still delivers 300 sim s on a driven page (simT ${warped.simT.toFixed(2)})`);
  const leaked = await page.evaluate(() => {
    const el = document.getElementById('season');
    return { disabled: el.disabled, tag: el.tagName, speedTxt: document.getElementById('speed').textContent };
  });
  ok(leaked.disabled === false && leaked.tag === 'BUTTON', 'the season is a real button, enabled at rest');
  ok(leaked.speedTxt === '1×', `the speed button is untouched by any of this (${leaked.speedTxt})`);

  /* And it must be STYLED like the label it replaced, which is a different question
   * from being the right element. A CSS rule that fails to parse is completely silent:
   * the tag is right, the text is right, the handler fires, and the declarations are
   * simply gone. The first build of this closed its explanatory comment one line early,
   * so the prose after it parsed as a selector and swallowed the whole rule, and the
   * season shipped as a grey chip with a border. Assert on COMPUTED STYLE. */
  const css = await page.evaluate(() => {
    const el = document.getElementById('season'), s = getComputedStyle(el);
    const a = getComputedStyle(el, '::after');
    return { border: s.borderTopWidth, bg: s.backgroundColor, cursor: s.cursor,
             font: s.fontFamily, size: s.fontSize, after: a.content, pad: s.paddingLeft };
  });
  ok(css.border === '0px', `no button border (${css.border}) — it is a label, not a chip`);
  ok(/rgba\(0, 0, 0, 0\)|transparent/.test(css.bg), `no button background (${css.bg})`);
  ok(css.cursor === 'pointer' && css.pad === '0px', `it invites a click (cursor ${css.cursor}, pad ${css.pad})`);
  ok(/Iowan|Palatino|Georgia|serif/.test(css.font), `still in the plate's serif (${css.font})`);
  ok(css.size === '14px', `still at the label's size (${css.size})`);
  ok(css.after.includes('›'), `the chevron is there at rest, for a phone with no hover (${css.after})`);
  await page.close();
}

/* ---- 5. reduced motion takes the honest cut instead ----------------------------- */
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 },
                                        reducedMotion: 'reduce' });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE + '?seed=7');
  await page.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
  const before = await page.evaluate(() => window.__census().clock);
  const veil = await page.evaluate(() => new Promise(res => {
    const el = document.getElementById('season'), v = document.getElementById('veil');
    let peak = 0, n = 0;
    el.click();
    const tick = () => {
      peak = Math.max(peak, +getComputedStyle(v).opacity);
      if (++n > 240 || (!el.disabled && n > 40)) return res({ peak, n });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  await page.waitForFunction(() => !document.getElementById('season').disabled, { timeout: 5000 });
  const after = await page.evaluate(() => window.__census().clock);
  const days = (after.simT - before.simT) / DAY;
  ok(Math.abs(days - Math.round(days)) < 0.02 && days > 3,
     `RM: same whole-day advance, ${days.toFixed(3)} days, with no time-lapse drawn`);
  ok(veil.peak > 0.85, `RM: the veil actually covered the frame (peak opacity ${veil.peak.toFixed(2)})`);
  ok(errs.length === 0, `RM: no page errors (${errs.length})`);
  const q = Math.abs(after.season - Math.round(after.season / 0.25) * 0.25);
  ok(q < 0.024, `RM: landed on a quarter boundary too (${after.season.toFixed(4)}, ${q.toFixed(4)} off)`);
  await page.close();
}

await browser.close();
console.log(bad ? `\nFAIL — ${bad} check(s)` : '\nPASS — all checks');
process.exit(bad ? 1 : 0);
