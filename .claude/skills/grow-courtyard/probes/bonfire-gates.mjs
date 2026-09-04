#!/usr/bin/env node
/* b185 — the bonfire's OFFER and its TWO GATES, and what a count of fires is worth.
 *
 * BON_K's comment claims: "hash share of shed days offered one — 5-6 of the 7 in every
 * year of 12 (histogram); the weather then takes ~2/3". This probe tests that sentence.
 *
 * A. THE OFFER is hash-only — `leafShed() > 0.1 && hash(day, BON_SALT) < BON_K`, and
 *    hash() is not seeded, so ONE page measures every seed's calendar. Measured
 *    analytically: for each day, set simT to the middle of that day's own bonfire window
 *    (bonfireHour() + 1), call updateClock(), and read the predicate there. No stepping.
 *
 * B. THE TWO GATES are the seed's. bonfireWeather() has exactly two call sites —
 *    bonfireDue() (the 2 h WINDOW) and the agent 'tend' block (the MATCH, nine hours of
 *    walking later) — and they are told apart by `bon.day === day`, which spawnBonfireHolder
 *    sets. Both are wrapped AFTER __reseed() (a law: __reseed reassigns R and eats an
 *    earlier monkeypatch) and every clause is recorded in the predicate's own evaluation
 *    order: !raining, wetF()<0.4, !isWindy(), snowCover<=0. skyLifts() is wrapped too and
 *    pinned to the match by simT, so `bonfireWeather() && !skyLifts(a)` is attributed
 *    clause by clause. The kindle is not inferred from bon.on: it IS the match record.
 *
 *   node probe-bonfire-gates.mjs --file courtyard.html --label HEAD
 *   node probe-bonfire-gates.mjs --file .probe-head.html --label 'pre-#178' --json a.json
 */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const FILE = arg('--file', 'courtyard.html'), LABEL = arg('--label', 'HERE');
const SEEDS = arg('--seeds', '7,42,1234,2026,99,3').split(',').map(Number);
const YEARS = +arg('--years', 4), CAL_YEARS = +arg('--cal-years', 12), SAMP = +arg('--samp', 2);
const URL = pathToFileURL(join(process.cwd(), FILE)).href;
const f = (x, d = 2) => (+x).toFixed(d), mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

const browser = await chromium.launch();
const errs = [];
const newPage = async seed => {
  const p = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${URL}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });   // ?t=0 pinned: the default entry is a different world
  await p.waitForFunction(() => typeof window.__warp === 'function');
  return p;
};

/* ---- A. the offer -------------------------------------------------------- */
let page = await newPage(7);
const cal = await page.evaluate(ny => {
  const YL = SEASON_LEN * DAY_LEN;
  const at = (d, h) => d * DAY_LEN + (((h - DAY_ROLL) % 24 + 24) % 24) / 24 * DAY_LEN;
  const rows = [];
  for (let d = 0; d < Math.ceil((ny + 0.75) * SEASON_LEN) + 2; d++) {
    simT = at(d, 12); updateClock();                       // noon, to read the day's own sunUp
    const bh = bonfireHour();
    simT = at(d, bh + 1); updateClock();                   // the middle of this day's window
    rows.push({ d, yr: Math.floor(SEASON_START + simT / YL), p: +seasonPhase.toFixed(4),
                shed: leafShed() > 0.1 ? 1 : 0, coin: hash(day, BON_SALT) < BON_K ? 1 : 0,
                offered: bonfireDay() ? 1 : 0, bh: +bh.toFixed(2) });
  }
  return { rows, K: BON_K, salt: BON_SALT, SEASON_LEN, YL };
}, CAL_YEARS);
await page.close();

const yrs = [...new Set(cal.rows.map(r => r.yr))].filter(y => y > 0 && y <= CAL_YEARS);
const shedPer = yrs.map(y => cal.rows.filter(r => r.yr === y && r.shed).length);
const offPer  = yrs.map(y => cal.rows.filter(r => r.yr === y && r.offered).length);
const hist = a => { const h = {}; for (const v of a) h[v] = (h[v] || 0) + 1; return Object.keys(h).sort((x, y) => x - y).map(k => `${k}:${h[k]}`).join(' '); };
console.log(`\n=== ${LABEL}   (${FILE})`);
console.log(`A. THE OFFER — hash-only, so this is EVERY seed's calendar. ${yrs.length} full years of ${cal.SEASON_LEN} d.`);
console.log(`   shed days (leafShed()>0.1 at the window)  per year: [${shedPer}]  hist ${hist(shedPer)}  mean ${f(mean(shedPer))}`);
console.log(`   OFFERED (shed AND hash<BON_K ${cal.K})      per year: [${offPer}]  hist ${hist(offPer)}  mean ${f(mean(offPer))}`);
console.log(`   share offered ${f(offPer.reduce((a, b) => a + b, 0) / Math.max(1, shedPer.reduce((a, b) => a + b, 0)), 3)} against BON_K ${cal.K}`);

/* ---- B. the two gates ---------------------------------------------------- */
const per = [];
for (const seed of SEEDS) {
  page = await newPage(seed);
  const r = await page.evaluate(({ years, samp }) => {
    __reseed();
    const W = [], M = [], SET = []; let pend = null, fired = 0;
    const snap = () => ({ d: day, h: +hour.toFixed(2), rain: raining ? 1 : 0, wet: +wetF().toFixed(3),
                          windy: isWindy() ? 1 : 0, wf: +windF().toFixed(3), snow: +snowCover.toFixed(3) });
    const _bw = bonfireWeather;
    bonfireWeather = function () { const s = snap(); const r = _bw(); fired++; s.r = r ? 1 : 0;
      if (bon.day === day) { s.t = simT; M.push(s); pend = s; } else W.push(s); return r; };
    const _sl = skyLifts;
    skyLifts = function (a) { const r = _sl(a);
      if (a && a.tend && pend && Math.abs(simT - pend.t) < 1e-6) { pend.sky = r ? 1 : 0; pend.wc = +weatherComing().toFixed(3); pend.wary = +(a.wary ?? 0.5).toFixed(2); pend = null; }
      return r; };
    const _sp = spawnBonfireHolder;
    spawnBonfireHolder = function () { SET.push({ d: day, h: +hour.toFixed(2) }); return _sp(); };

    const YL = SEASON_LEN * DAY_LEN, t0 = simT;
    let onPrev = false, edges = 0;
    while (simT - t0 < years * YL) { __warp(samp); if (bon.on && !onPrev) edges++; onPrev = bon.on; }
    return { W, M, SET, edges, fired, endT: simT, YL };
  }, { years: YEARS, samp: SAMP });
  if (!r.fired) { console.error(`seed ${seed}: INSTRUMENT NEVER FIRED`); process.exitCode = 1; }
  per.push({ seed, ...r }); await page.close();
}
await browser.close();
if (errs.length) { console.error('PAGE ERROR', errs[0]); process.exitCode = 1; }

// first failing clause, in bonfireWeather()'s own evaluation order
const why = s => s.rain ? 'rain' : s.wet >= 0.4 ? 'wet' : s.windy ? 'wind' : s.snow > 0 ? 'snow' : 'pass';
let offDays = 0, setOut = 0, lit = 0, byWin = {}, byMatch = {}, skyRef = 0, perSeed = [];
for (const p of per) {
  const days = [...new Set(p.W.map(w => w.d))];                 // a day is OFFERED iff the window asked at all
  offDays += days.length;
  const so = p.SET.length, li = p.M.filter(m => m.r && !m.sky).length;
  setOut += so; lit += li;
  skyRef += p.M.filter(m => m.r && m.sky).length;
  for (const d of days) { const ss = p.W.filter(w => w.d === d); if (ss.some(s => s.r)) continue;
    const k = why(ss[0]); byWin[k] = (byWin[k] || 0) + 1; }
  for (const m of p.M) if (!m.r) { const k = why(m); byMatch[k] = (byMatch[k] || 0) + 1; }
  perSeed.push({ seed: p.seed, off: days.length, so, li, edges: p.edges, asks: p.W.length / Math.max(1, days.length) });
}
const nSY = SEEDS.length * YEARS;
console.log(`\nB. THE TWO GATES — ${SEEDS.length} seeds x ${YEARS} years = ${nSY} seed-years, samp ${SAMP}s`);
console.log(`   offered days reaching the window  ${offDays}   (${f(offDays / nSY)}/seed-year); bonfireDue() asks ${f(mean(perSeed.map(s => s.asks)))} times across its 2 h`);
console.log(`   GATE 1 the WINDOW  set out ${setOut}/${offDays} = ${f(100 * setOut / Math.max(1, offDays), 1)}%   refused ${offDays - setOut} by: ${Object.entries(byWin).map(([k, v]) => k + ' ' + v).join(' · ') || '-'}`);
console.log(`   GATE 2 the MATCH   lit ${lit}/${setOut} = ${f(100 * lit / Math.max(1, setOut), 1)}%   refused ${setOut - lit} by: ${Object.entries(byMatch).map(([k, v]) => k + ' ' + v).join(' · ') || '-'} · skyLifts ${skyRef}`);
console.log(`   FIRES ${lit} in ${nSY} seed-years = ${f(lit / nSY)}/year; bon.on rising edges ${per.reduce((a, p) => a + p.edges, 0)} (independent count)`);
console.log(`   the weather's total cut: ${f(1 - lit / Math.max(1, offDays), 3)} of the offer`);
const fpy = per.flatMap(p => { const o = []; for (let y = 0; y < YEARS; y++) o.push(p.M.filter(m => m.r && !m.sky && m.t >= p.endT - (YEARS - y) * p.YL && m.t < p.endT - (YEARS - y - 1) * p.YL).length); return o; });
console.log(`   fires per seed-year: hist ${hist(fpy)}  (n ${fpy.length})`);
console.log(`   per seed: ${perSeed.map(s => `${s.seed}: off ${s.off} out ${s.so} lit ${s.li}`).join(' · ')}`);
// per (seed, day): the WINDOW's verdict and the MATCH's, so two builds can be diffed on
// the identical calendar at gates neither of them changed.
const grid = {};
for (const p of per) for (const d of [...new Set(p.W.map(w => w.d))]) {
  const ss = p.W.filter(w => w.d === d), m = p.M.find(x => x.d === d);
  grid[`${p.seed}:${d}`] = { out: ss.some(s => s.r) ? 1 : 0, why: ss.some(s => s.r) ? 'pass' : why(ss[0]),
                             lit: m ? (m.r && !m.sky ? 1 : 0) : 0, mwhy: m ? (m.r ? (m.sky ? 'sky' : 'pass') : why(m)) : '-' };
}
const jf = arg('--json', ''); if (jf) writeFileSync(jf, JSON.stringify({ LABEL, offDays, setOut, lit, perSeed, offPer, shedPer, grid }, null, 1));
