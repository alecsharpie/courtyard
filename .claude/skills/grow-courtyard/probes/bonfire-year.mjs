#!/usr/bin/env node
/* probe: the allotment bonfire's year (#93).
 *
 * bonfireDay() is a hash of the day gated on leafFallF() > 0.3, and the kindle is gated
 * on the weather at set-out AND at arrival, so what a seed sees is the calendar's offer
 * minus the weather's cut. Folds, over a whole seasonal year on several seeds:
 *   - the calendar: days hash(day, 517) < BON_K, and how many fall in the leaf-fall window
 *   - fires per season quarter (lit events), share of autumn days with one
 *   - the weather at each kindle (raining / windF / wetF) — the brief wants 0 in rain, 0 in wind > 0.5
 *   - set-out → kindle walk in sim hours, kindle hour, flame-out hour, ember-out hour
 *   - a holder standing at it: share of burning (fire > 0.3) samples with an a.tend stander
 *   - litter within 3 cells: the max seen on a fire day before the kindle, and at flame-out
 *   - burning samples in rain / wind > 0.5 (mid-burn weather, not kindle weather)
 *
 *   node bonfire-year.mjs [pathToHtml] [label]
 *   SEEDS=7,42 DAYS=27 node bonfire-year.mjs
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const LABEL = process.argv[3] || 'HERE';
const PAGE = pathToFileURL(FILE).href;
const SEEDS = (process.env.SEEDS || '7,42,1234,99,3,11,21,77').split(',').map(Number);
const DAY = 55, DAYS = +(process.env.DAYS || 27), STEP = 1;

const browser = await chromium.launch();
const runs = [];
for (const seed of SEEDS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ step, n }) => {
    window.__reseed();
    const out = [], cal = [];
    for (let d = 0; d < 40; d++) cal.push(hash(d, BON_SALT) < BON_K ? 1 : 0);
    const cx = Math.floor(BONFIRE.x), cy = Math.floor(BONFIRE.y);
    const litNear = () => { let s = 0; for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if (Math.hypot(x - cx, y - cy) <= 3) s += litter[y * GW + x]; return s; };
    let lastDay = -1, spawnT = -1;
    for (let k = 0; k < n; k++) {
      window.__warp(step);
      if (bon.day !== lastDay) { lastDay = bon.day; spawnT = simT; }
      const stander = agents.some(a => a.tend && a.state === 'stand');
      const walker = agents.some(a => a.tend && a.state === 'walk');
      out.push([+simT.toFixed(2), day, +hour.toFixed(2), +seasonPhase.toFixed(4), +leafShed().toFixed(3), raining ? 1 : 0, +windF().toFixed(2), +wetF().toFixed(2),
                +bon.fire.toFixed(3), +bon.ember.toFixed(3), bon.on ? 1 : 0, +bon.lit.toFixed(2), bon.day, stander ? 1 : 0, walker ? 1 : 0, litNear(), snowCover > 0 ? 1 : 0, spawnT, agents.length]);
    }
    return { out, cal, BON_K, salt: BON_SALT };
  }, { step: STEP, n: Math.round(DAYS * DAY / STEP) });
  if (errs.length) { console.error(`seed ${seed}: PAGE ERROR`, errs[0]); process.exitCode = 1; }
  runs.push({ seed, ...r }); await page.close();
}
await browser.close();
const T = 0, D = 1, H = 2, PH = 3, LF = 4, RAIN = 5, WIND = 6, WET = 7, FIRE = 8, EMB = 9, ON = 10, LIT = 11, BDAY = 12, STAND = 13, WALK = 14, LITTER = 15, SNOW = 16, SPAWN = 17;
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const seasonOf = p => SEASONS[Math.floor(((p + 0.125) % 1) * 4)];
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const fmt = (x, d = 2) => (+x).toFixed(d);

console.log(`\n=== ${LABEL}  (${FILE})\n${SEEDS.length} seeds x ${DAYS} days, 1 s samples; BON_K ${runs[0].BON_K}`);
// the calendar
const cal = runs[0].cal.slice(1, DAYS);
const dayInfo = {};     // per day: leaf-fall at noon (seed 0)
for (const v of runs[0].out) if (Math.abs(v[H] - 12) < 0.5 && !(v[D] in dayInfo)) dayInfo[v[D]] = { lf: v[LF], season: seasonOf(v[PH]) };
const autumnDays = Object.keys(dayInfo).filter(d => dayInfo[d].lf > 0.1).map(Number);   // the SHED days: leafShed() > 0.1 at noon
const offered = autumnDays.filter(d => runs[0].cal[d]);
console.log(`calendar: hash(day,517) < BON_K on ${cal.reduce((a, b) => a + b, 0)}/${cal.length} days 1..${DAYS - 1}; leafShed() > 0.1 at noon on ${autumnDays.length} days [${autumnDays[0]}..${autumnDays[autumnDays.length - 1]}]; offered a fire on ${offered.length} of them: ${offered.join(',')}`);

// per seed events
const bySeason = { winter: 0, spring: 0, summer: 0, autumn: 0 };
let kindles = [], burnSamples = 0, burnStand = 0, burnRain = 0, burnWind = 0, burnSnow = 0, fireDaysWithStander = 0, firesTotal = 0;
const setouts = [];
for (const r of runs) {
  const o = r.out;
  let lastLit = -1, lastSpawnDay = -1;
  for (let i = 0; i < o.length; i++) {
    const v = o[i];
    if (v[BDAY] !== lastSpawnDay && v[BDAY] >= 0) { lastSpawnDay = v[BDAY]; setouts.push({ seed: r.seed, day: v[BDAY], hour: v[H], lit: false }); }
    if (v[LIT] !== lastLit && v[LIT] >= 0) {
      lastLit = v[LIT]; firesTotal++;
      bySeason[seasonOf(v[PH])]++;
      const so = setouts.find(s => s.seed === r.seed && s.day === v[D]) || setouts.find(s => s.seed === r.seed && s.day === v[BDAY]);
      if (so) so.lit = true;
      // litter before the kindle: the max within 3 cells over the day so far
      let litBefore = 0; for (let j = i; j >= 0 && o[j][D] === v[D]; j--) litBefore = Math.max(litBefore, o[j][LITTER]);
      // flame-out, ember-out
      let outI = -1, embI = -1, standers = 0, n = 0;
      for (let j = i; j < o.length; j++) { if (o[j][FIRE] > 0.3) { n++; standers += o[j][STAND]; } if (outI < 0 && j > i + 3 && o[j][FIRE] <= 0.05) outI = j; if (embI < 0 && j > i + 3 && o[j][EMB] <= 0.001) { embI = j; break; } }
      kindles.push({ seed: r.seed, day: v[D], hour: v[H], rain: v[RAIN], wind: v[WIND], wet: v[WET], walkH: so ? (v[T] - v[SPAWN]) * 24 / DAY : NaN,
        outH: outI >= 0 ? o[outI][H] : NaN, embH: embI >= 0 ? o[embI][H] : NaN, embDay: embI >= 0 ? o[embI][D] - v[D] : NaN,
        litBefore, litOut: outI >= 0 ? o[outI][LITTER] : NaN, standShare: n ? standers / n : NaN, burnH: n * 24 / DAY,
        rainOut: outI >= 0 && (o[outI][RAIN] || o[outI][SNOW]) ? 1 : 0 });
      if (n && standers / n > 0.5) fireDaysWithStander++;
    }
    if (v[FIRE] > 0.3) { burnSamples++; burnStand += v[STAND]; burnRain += v[RAIN]; burnWind += v[WIND] > 0.5 ? 1 : 0; burnSnow += v[SNOW]; }
  }
}
const autumnPerSeed = autumnDays.length;
console.log(`\nfires by season (all seeds): ${SEASONS.map(s => s + ' ' + bySeason[s]).join(' · ')}   total ${firesTotal}`);
console.log(`autumn days with a fire: ${bySeason.autumn}/${autumnPerSeed * SEEDS.length} = ${fmt(100 * bySeason.autumn / (autumnPerSeed * SEEDS.length), 0)}%  (brief: 25–40%); per seed: ${SEEDS.map(s => kindles.filter(k => k.seed === s).length).join(',')}`);
console.log(`set-outs ${setouts.length}, of which lit ${setouts.filter(s => s.lit).length}; unlit (weather turned by arrival): ${setouts.filter(s => !s.lit).map(s => s.seed + ':d' + s.day).join(' ') || 'none'}`);
// offered days that never set out: the weather in the set-out window
const missed = [];
for (const r of runs) for (const d of offered) if (!setouts.some(s => s.seed === r.seed && s.day === d)) {
  const w = r.out.filter(v => v[D] === d && v[H] >= 6.5 && v[H] <= 10.5);
  missed.push(`${r.seed}:d${d}(rain ${fmt(mean(w.map(v => v[RAIN])), 2)} wet ${fmt(mean(w.map(v => v[WET])), 2)} wind ${fmt(mean(w.map(v => v[WIND])), 2)})`);
}
console.log(`offered days with no set-out: ${missed.length}/${offered.length * SEEDS.length} — ${missed.join(' ') || 'none'}`);
console.log(`kindles in rain: ${kindles.filter(k => k.rain).length}; in wind > 0.5: ${kindles.filter(k => k.wind > 0.5).length}; wet > 0.4: ${kindles.filter(k => k.wet > 0.4).length}`);
console.log(`kindle hour: ${fmt(Math.min(...kindles.map(k => k.hour)), 1)}–${fmt(Math.max(...kindles.map(k => k.hour)), 1)} (mean ${fmt(mean(kindles.map(k => k.hour)), 1)}); set-out → kindle ${fmt(mean(kindles.map(k => k.walkH)), 1)} h (range ${fmt(Math.min(...kindles.map(k => k.walkH)), 1)}–${fmt(Math.max(...kindles.map(k => k.walkH)), 1)})`);
console.log(`flames > 0.3 for ${fmt(mean(kindles.map(k => k.burnH)), 1)} h; flame-out at ${fmt(mean(kindles.filter(k => !isNaN(k.outH)).map(k => k.outH)), 1)} h (${kindles.filter(k => k.rainOut).length} put out by rain/snow); embers out at ${fmt(mean(kindles.filter(k => !isNaN(k.embH)).map(k => k.embH)), 1)} h (+${fmt(mean(kindles.filter(k => !isNaN(k.embDay)).map(k => k.embDay)), 1)} d)`);
console.log(`a holder standing at it: ${fmt(100 * burnStand / Math.max(1, burnSamples), 0)}% of burning samples; fires with a stander > half the burn: ${fireDaysWithStander}/${firesTotal}`);
console.log(`burning samples in rain ${burnRain}/${burnSamples}, in snow ${burnSnow}, in wind > 0.5 ${burnWind} (${fmt(100 * burnWind / Math.max(1, burnSamples), 0)}%)`);
const withLit = kindles.filter(k => k.litBefore > 0);
console.log(`litter within 3 cells: non-zero before the kindle on ${withLit.length}/${firesTotal} fires (max ${Math.max(0, ...kindles.map(k => k.litBefore))}); at flame-out ${withLit.map(k => k.litOut).join(',') || '-'}; max litter near the cell over the whole run: ${Math.max(...runs.map(r => Math.max(...r.out.map(v => v[LITTER]))))}`);
console.log(`\nper fire: seed day  kindle  walk  out   embers  stand  wind  wet  litter(before→out)`);
for (const k of kindles) console.log(`  ${String(k.seed).padStart(4)} d${String(k.day).padStart(2)}  ${fmt(k.hour, 1).padStart(5)}  ${fmt(k.walkH, 1).padStart(4)}  ${fmt(k.outH, 1).padStart(4)}  ${fmt(k.embH, 1).padStart(5)}   ${fmt(k.standShare, 2)}   ${fmt(k.wind)}  ${fmt(k.wet)}  ${k.litBefore}→${k.litOut}`);
