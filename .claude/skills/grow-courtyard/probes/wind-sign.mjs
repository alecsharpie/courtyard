#!/usr/bin/env node
/* probe: the wind's SIGN (#71). (a) 10 seeds x 30 d: sign per spell, share each way, any
 * flip while windF > 0.1, and whether seeds share a windy calendar. (b) identity: with
 * WIND_SALT = 0 and a windy instant, the whole-frame hash HERE == HEAD. (c) a windy noon
 * crop pair, sign +1 vs -1, everything else pinned. (d) litter centroid vs the linden
 * on a shed-season windy day under each sign.
 *   node .claude/skills/grow-courtyard/probes/wind-sign.mjs [a|b|c|d ...]   (default: all) */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HEAD = '/tmp/courtyard-head.html', HERE = resolve('courtyard.html');
const modes = process.argv.length > 2 ? process.argv.slice(2) : ['a', 'b', 'c', 'd'];
const b = await chromium.launch();
async function open(file, seed, t = 0){ const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=${t}`); await p.waitForFunction(() => window.__warp); return p; }
const SEEDS = [1, 3, 7, 11, 19, 42, 101, 1234, 5, 13], STEP = 0.25, DAYS = 30;

if (modes.includes('a')){
  let plus = 0, minus = 0, flips = 0, spells = 0; const cals = [];
  for (const seed of SEEDS){
    const p = await open(HERE, seed);
    const r = await p.evaluate(({STEP, DAYS}) => { window.__reseed(); window.__setTime(0);
      const o = { spells: [], flips: 0, cal: [] }; let inSpell = false, sg = 0, prevSign = windSign;
      for (let i = 0; i < DAYS * DAY_LEN / STEP; i++){
        window.__warp(STEP); const w = windF();
        if (w > 0.1 && windSign !== prevSign && inSpell) o.flips++;
        if (w > 0.1 && !inSpell){ inSpell = true; sg = windSign; o.spells.push({ day, sign: sg }); }
        if (w <= 0.1 && inSpell) inSpell = false;
        prevSign = windSign;
      }
      for (let d = 0; d < DAYS; d++) o.cal.push(hash(d, 99 + WIND_SALT) < 0.28 ? 1 : 0);
      return o; }, {STEP, DAYS});
    const pl = r.spells.filter(s => s.sign > 0).length, mi = r.spells.length - pl;
    plus += pl; minus += mi; flips += r.flips; spells += r.spells.length; cals.push(r.cal.join(''));
    console.log(`seed ${seed}: spells ${r.spells.length} (+${pl} / -${mi}) flips-in-spell ${r.flips}  ${r.spells.map(s => (s.sign > 0 ? '+' : '-') + s.day).join(' ')}`);
    await p.close();
  }
  console.log(`TOTAL spells ${spells}: west(+) ${plus} east(-) ${minus} = ${(100 * plus / spells).toFixed(0)}% +  · flips inside a spell: ${flips}  · distinct windy calendars: ${new Set(cals).size}/${SEEDS.length}`);
}
if (modes.includes('b')){
  // find a windy noon on the UNSALTED calendar (seed 7, WIND_SALT 0) with sign +1, then hash HERE vs HEAD
  const hashAt = async (file, T, salt0) => { const p = await open(file, 7);
    const r = await p.evaluate(async ({T, salt0}) => { if (salt0 && typeof WIND_SALT !== 'undefined'){ WIND_SALT = 0; if (salt0 === 'force') signFor = () => 1; } window.__reseed(); window.__setTime(0); window.__warp(T); drawScene(simT, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i+1] * 3 + d[i+2] * 7) >>> 0;
      return { h, w: +windF().toFixed(3), sign: typeof windSign === 'undefined' ? 'n/a' : windSign, day, hour: +hour.toFixed(2) }; }, {T, salt0});
    await p.close(); return r; };
  // pick, on the unsalted calendar, one windy noon whose LATCHED sign is +1 and one -1
  const p = await open(HERE, 7); const picks = await p.evaluate(() => { WIND_SALT = 0; window.__reseed(); window.__setTime(0); const out = { plus: -1, minus: -1 }; let T = 0;
    for (let d = 1; d < 40 && (out.plus < 0 || out.minus < 0); d++){ const T2 = d * DAY_LEN + DAY_LEN * 0.35; window.__warp(T2 - T); T = T2;
      if (windF() < 1) continue; if (windSign > 0 && out.plus < 0) out.plus = T2; if (windSign < 0 && out.minus < 0) out.minus = T2; }
    return out; }); await p.close();
  const T = picks.plus, T2 = picks.minus;
  console.log('identity instant T =', T);
  const a = await hashAt(HEAD, T, false), a1 = await hashAt(HEAD, T, false), c = await hashAt(HERE, T, true), cf = await hashAt(HERE, T, 'force');
  console.log('HEAD', JSON.stringify(a), 'HEAD again', a1.h === a.h ? 'repeatable' : 'NOT REPEATABLE');
  console.log('HERE (history has east spells)', JSON.stringify(c), a.h === c.h ? 'IDENTICAL' : 'DIFFERENT');
  console.log('HERE (every spell forced +1)  ', JSON.stringify(cf), a.h === cf.h ? 'IDENTICAL' : 'DIFFERENT');
  // and a sign -1 day on the same calendar must differ
  const a2 = await hashAt(HEAD, T2, false), c2 = await hashAt(HERE, T2, true);
  console.log('east-sign control T =', T2, 'HEAD', JSON.stringify(a2), 'HERE', JSON.stringify(c2), a2.h === c2.h ? 'IDENTICAL (bad)' : 'DIFFERENT (expected)');
}
if (modes.includes('c')){
  for (const sg of [1, -1]){
    const p = await open(HERE, 7);
    const r = await p.evaluate(sg => { WIND_SALT = 0; window.__reseed(); window.__setTime(0);
      let T = 0; for (let d = 1; d < 40; d++) if (hash(d, 99) < 0.28){ T = d * DAY_LEN + DAY_LEN * 0.30; break; }
      window.__warp(T); windSign = sg; window.__warp(6); drawScene(simT, 0);
      const c = document.querySelector('canvas').getBoundingClientRect(); const f = project(CX, CY, 0); return { T, w: windF(), sign: windSign, cx: c.x, cy: c.y, w0: c.width, h0: c.height }; }, sg);
    console.log('crop', JSON.stringify(r));
    await p.screenshot({ path: `shots/b68-windy-noon-sign${sg > 0 ? '+1' : '-1'}.png` });
    await p.close();
  }
}
if (modes.includes('d')){
  for (const sg of [1, -1]){
    const p = await open(HERE, 7);
    const r = await p.evaluate(sg => { WIND_SALT = 0; window.__reseed(); window.__setTime(0);
      // autumn: shed season ~ day 17; warp there, then hold a windy sign for a day of shedding
      window.__warp(14 * DAY_LEN); litter.fill(0);
      const before = leafShed();
      const samples = []; for (let i = 0; i < 1.5 * DAY_LEN / 0.25; i++){ wind = 1; windSign = sg; window.__warp(0.25); }
      let sx = 0, sy = 0, n = 0; for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++){ const v = litter[y * GW + x]; if (!v) continue; const dx = x + 0.5 - CX, dy = y + 0.5 - CY; sx += v * dx; sy += v * dy; n += v; }
      let cells = 0; for (const v of litter) if (v) cells++; return { shed: +before.toFixed(2), cells, mass: n, cxOff: +(sx / n).toFixed(2), cyOff: +(sy / n).toFixed(2), leaves: leaves.length }; }, sg);
    console.log('litter sign', sg, JSON.stringify(r), r.cxOff * sg > 0 ? '(downwind of the linden)' : '(NOT downwind)');
    await p.close();
  }
}
await b.close();
if (modes.includes('e')){
  // fountain spray x-centroid vs the basin centre, sign +1 vs -1, same instant; plus a tight crop pair
  const b2 = await chromium.launch(); const crops = {};
  for (const sg of [1, -1]){
    const p = await b2.newPage({ viewport:{width:1600, height:950} }); await p.goto(pathToFileURL(HERE).href + '?pause&seed=7&t=0'); await p.waitForFunction(() => window.__warp);
    const r = await p.evaluate(sg => { WIND_SALT = 0; window.__reseed(); window.__setTime(0);
      let T = 0; for (let d = 1; d < 40; d++) if (hash(d, 99) < 0.28){ T = d * DAY_LEN + DAY_LEN * 0.30; break; }
      window.__warp(T); windSign = sg; window.__warp(6); drawScene(simT, 0);
      const [fx, fy] = project(FOUNTAIN.x, FOUNTAIN.y, 0); const R0 = Math.round(cellW * 4);
      const d = ctx.getImageData(fx - R0, fy - R0 - 20, 2 * R0, 2 * R0).data;
      const c = document.querySelector('canvas').getBoundingClientRect();
      return { w: windF(), sign: windSign, R0, px: Array.from(d), clip: { x: c.x + fx - R0, y: c.y + fy - R0 - 20, width: 2 * R0, height: 2 * R0 } }; }, sg);
    crops[sg] = r; console.log('fountain sign', sg, 'w', r.w);
    await p.screenshot({ path: `shots/b68-fountain-sign${sg > 0 ? '+1' : '-1'}.png`, clip: r.clip }); await p.close();
  }
  await b2.close();
  // where the two crops differ, which side of the basin centre are the BRIGHT pixels of each?
  const A = crops[1].px, B = crops[-1].px, R0 = crops[1].R0, W2 = 2 * R0; let ax = 0, an = 0, bx = 0, bn = 0, diff = 0;
  for (let i = 0; i < A.length; i += 4){ const la = A[i] + A[i+1] + A[i+2], lb = B[i] + B[i+1] + B[i+2]; if (Math.abs(la - lb) < 30) continue; diff++;
    const x = (i / 4) % W2 - R0; if (la > lb){ ax += x; an++; } else { bx += x; bn++; } }
  console.log(`fountain crop: ${diff} px differ · brighter under sign +1 sit at mean x ${(ax / an).toFixed(1)} (${an} px) · brighter under sign -1 at mean x ${(bx / bn).toFixed(1)} (${bn} px)  [px from basin centre, +x = east]`);
}
