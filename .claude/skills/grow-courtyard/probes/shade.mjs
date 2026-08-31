#!/usr/bin/env node
/* shade — b92 / #94: the linden's shade as a PLACE.
 *
 *   node .claude/skills/grow-courtyard/probes/shade.mjs [file] [--seeds 10] [--days 3] [--day0 5] [--warmth W] [--force-false] [--hash] [--names]
 *
 * presence: 10 seeds × 3 summer days, every ~0.33 s: people inside the courtyard wall by kind
 *   (kid / napper / picnic / sitter / gardener), by hour, and in ±15 min windows at 10/13/16 h;
 *   seed 42 at 13:25 each day (c135). Plus the premise: what share of the picnic annulus
 *   (r 9–12) and of the inner lawn (r < bedIn) the shade ellipse covers at 10/13/16 h.
 * choice: every picnic set-out, AT SPAWN — hot (warmth > .65 & shadowF > .5) / cool (warmth < .45),
 *   inLindenShade(picnicAt) (the page's predicate; a copy of the drawn ellipse on HEAD), r.
 * --warmth W pins warmth after updateClock (phase and hour stay on the summer calendar).
 * --force-false patches inLindenShade to () => false (the identity control).
 * --hash: canvas hash after drawScene at day0+1 13:25 and day0+2 17:00 (viewport 1600×950).
 * --names: sundialName / a sleeper's personName at summer noon (crown out) and winter noon (bare), seed 7.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const has = n => process.argv.includes(n);
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../..', 'courtyard.html');
const NS = +arg('--seeds', 10), NDAYS = +arg('--days', 3), DAY0 = +arg('--day0', 5), WARM = arg('--warmth', null), FORCE = has('--force-false'), HASH = has('--hash');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77, 88, 91].slice(0, NS);
const KINDS = ['kid', 'napper', 'picnic', 'sitter', 'gardener'];
const b = await chromium.launch();
const SETUP = `
  const inShade = typeof inLindenShade === 'function' ? (x, y) => inLindenShade(x, y) : (x, y) => {
    if (daylight <= 0.05) return false;
    const m = maturity(), tR = 4.0 + m * 4.6, sunX = lerp(1.6, -1.6, clamp((hour - 6) / 14, 0, 1)) * daylight, sp = shSpread();
    const cx = CX + sunX * 1.6 * shOffset(), cy = CY + 1.2, rx = tR * 0.95 * sp, ry = tR * 0.8 * sp;
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; };
  if (WARM !== null){ const uc = updateClock; updateClock = function(){ uc(); warmth = +WARM; }; }
  if (FORCE && typeof inLindenShade === 'function') inLindenShade = () => false;
  const inYard = a => { const dx = a.x - CX, dy = a.y - CY; return Math.hypot(dx, dy) < gR(Math.atan2(dy, dx)) - 0.5; };
  const hashCanvas = () => { drawScene(simT, 1/30); const d = ctx.getImageData(0, 0, W * DPR, H * DPR).data; let h = 0; for (let i = 0; i < d.length; i += 4){ h = (h * 31 + d[i] + d[i+1] * 7 + d[i+2] * 13) | 0; } return h; };
`;
if (has('--names')){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=7');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(new Function("A", "const {WARM, FORCE} = A;" + SETUP + `
    window.__reseed(); const out = [];
    const at = (d, h) => { window.__warp(d * 55 + (h - 6) / 24 * 55 - simT); };
    const rec = (tag) => { const sl = agents.find(a => a.state === 'lie');
      out.push({tag, day, hour:+hour.toFixed(2), leafOut:+leafOut().toFixed(2), shadowF:+shadowF().toFixed(2), dialIn:inShade(SUNDIAL.x + 0.5, SUNDIAL.y + 0.5), name:sundialName(),
        sleeper: sl ? personName(sl) + ' @ ' + (inShade(sl.x, sl.y) ? 'IN' : 'OUT') : null,
        blanket: (agents.filter(a => a.blanket).map(a => personName(a) + ' @ ' + (inShade(a.x, a.y) ? 'IN' : 'OUT'))) }); };
    // summer: scan day 6 for a clear-sky noon; report every 30 min 10..16
    for (let h = 10; h <= 16; h += 1){ at(6, h); rec('summer'); }
    // a sleeper, wherever the day has one: step day 6 on and name the first one lying
    for (let i = 0; i < 1400; i++){ window.__warp(0.05); const sl = agents.find(a => a.state === 'lie'); if (sl){ rec('summer sleeper'); break; } }
    // winter: bare crown — find a CLEAR instant (shadowF > 0.5) so the flip is the crown's, not the sky's
    for (let d = 19; d <= 23; d++) for (let h = 10; h <= 15; h += 1){ at(d, h); if (shadowF() > 0.5){ rec('winter clear'); d = 99; break; } }
    if (!out.some(o => o.tag === 'winter clear')){ at(20, 12); rec('winter (lid)'); }
    return out;`), {WARM, FORCE});
  for (const o of r) console.log(JSON.stringify(o));
  await p.close(); await b.close(); process.exit(0);
}
const hourRows = {}, win = {10:[], 13:[], 16:[]}, winK = {}, c135 = [], cover = {10:[], 13:[], 16:[]};
const choice = {n:0, hot:0, hotIn:0, cool:0, coolIn:0, mid:0, midIn:0, rMin:99, rMax:0, inner:0, refused:0}; const hashes = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(new Function("A", "const {DAY0, NDAYS, WARM, FORCE, HASH, KINDS} = A;" + SETUP + `
    window.__reseed();
    window.__warp(DAY0 * 55 - simT);
    const hours = {}, win = {10:[], 13:[], 16:[]}, winK = {}, c135 = [], cover = {10:[], 13:[], 16:[]}, hashes = [];
    const ch = {n:0, hot:0, hotIn:0, cool:0, coolIn:0, mid:0, midIn:0, rMin:99, rMax:0, inner:0, refused:0};
    const seen = new WeakSet(); for (const a of agents) seen.add(a);
    const coverAt = () => { let an = 0, ai = 0, ln = 0, li = 0;
      for (let k = 0; k < 180; k++){ const th = k / 180 * Math.PI * 2;
        for (const r of [9.4, 10.2, 11, 11.8]){ an++; if (inShade(CX + Math.cos(th) * r, CY + Math.sin(th) * r)) ai++; }
        for (const r of [1.5, 2.6, 3.5]){ if (r < bedIn(th)){ ln++; if (inShade(CX + Math.cos(th) * r, CY + Math.sin(th) * r)) li++; } } }
      return [ai / an, li / ln]; };
    const doneWin = {}, doneCover = {}, doneHash = {}, wAcc = {}, wN = {};
    let i = 0;
    for (; day < DAY0 + NDAYS; i++){
      window.__warp(0.05);
      for (const a of agents){ if (seen.has(a)) continue; seen.add(a);
        if (a.kind === 'picnic' && a.lead && a.picnicAt){ ch.n++;
          const hot = warmth > 0.65 && shadowF() > 0.5, cool = warmth < 0.45, inn = inShade(a.picnicAt[0], a.picnicAt[1]);
          const r = Math.hypot(a.picnicAt[0] - CX, a.picnicAt[1] - CY); ch.rMin = Math.min(ch.rMin, r); ch.rMax = Math.max(ch.rMax, r); if (r < 6) ch.inner++;
          if (hot){ ch.hot++; if (inn) ch.hotIn++; } else if (cool){ ch.cool++; if (inn) ch.coolIn++; } else { ch.mid++; if (inn) ch.midIn++; } } }
      if (HASH){ const key = day + ':' + (day === DAY0 + 1 && hour >= 13.4 ? 'a' : day === DAY0 + 2 && hour >= 17 ? 'b' : ''); if (key.endsWith('a') || key.endsWith('b')){ if (!doneHash[key]){ doneHash[key] = 1; hashes.push({day, hour:+hour.toFixed(3), hash:hashCanvas()}); } } }
      if (i % 5) continue;
      const inY = agents.filter(inYard), h = Math.floor(hour);
      const byK = {}; for (const k of KINDS) byK[k] = inY.filter(a => a.kind === k).length;
      (hours[h] || (hours[h] = [])).push(inY.length);
      for (const H of [10, 13, 16]){ if (Math.abs(hour - H) <= 0.25){ const key = day + ':' + H;
        if (!wAcc[key]){ wAcc[key] = {n:0, tot:0, k:{}}; } wAcc[key].n++; wAcc[key].tot += inY.length; for (const k of KINDS) wAcc[key].k[k] = (wAcc[key].k[k] || 0) + byK[k];
        if (!doneCover[key]){ doneCover[key] = 1; cover[H].push(coverAt()); } } }
      if (Math.abs(hour - 13.42) < 0.03 && !c135.some(c => c.day === day)) c135.push({day, hour:+hour.toFixed(2), ...byK, all:inY.length, shadowF:+shadowF().toFixed(2), dialIn:inShade(SUNDIAL.x + 0.5, SUNDIAL.y + 0.5)});
    }
    for (const key in wAcc){ const H = key.split(':')[1], w = wAcc[key]; win[H].push(w.tot / w.n); for (const k of KINDS) (winK[H + ':' + k] || (winK[H + ':' + k] = [])).push(w.k[k] / w.n); }
    const hmean = {}; for (const h in hours) hmean[h] = hours[h].reduce((s, v) => s + v, 0) / hours[h].length;
    return {hmean, win, winK, c135, cover, ch, hashes, warmth:+warmth.toFixed(2), shadeIsPage: typeof inLindenShade === "function"};`), {DAY0, NDAYS, WARM, FORCE, HASH, KINDS});
  for (const h in out.hmean) (hourRows[h] || (hourRows[h] = [])).push(out.hmean[h]);
  for (const H in out.win){ win[H].push(...out.win[H]); for (const k of KINDS){ const key = H + ':' + k; (winK[key] || (winK[key] = [])).push(...(out.winK[key] || [])); } cover[H].push(...out.cover[H]); }
  if (seed === 42) c135.push(...out.c135);
  for (const k in choice) choice[k] = k === 'rMin' ? Math.min(choice[k], out.ch[k]) : k === 'rMax' ? Math.max(choice[k], out.ch[k]) : choice[k] + out.ch[k];
  if (out.hashes.length) hashes.push({seed, h:out.hashes});
  if (seed === SEEDS[0]) console.log(`file: ${file}  warmth ${out.warmth}${WARM !== null ? ' (pinned)' : ''}  predicate ${out.shadeIsPage ? 'page' : 'copy'}${FORCE ? ' FORCED FALSE' : ''}  days ${DAY0}..${DAY0 + NDAYS - 1}  seeds ${SEEDS.join(',')}`);
  await p.close();
}
await b.close();
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; }, mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
console.log('courtyard presence (inside the wall), mean by hour:');
let line = ''; for (let h = 0; h < 24; h++){ const r = hourRows[h] || []; line += `${String(h).padStart(2)}h ${mean(r).toFixed(2)}  `; if (h % 6 === 5){ console.log('  ' + line); line = ''; } }
for (const H of [10, 13, 16]){
  console.log(`${H}h ±15 min (n=${win[H].length} seed·days): all median ${med(win[H]).toFixed(2)} mean ${mean(win[H]).toFixed(2)}  ` + KINDS.map(k => `${k} ${mean(winK[H + ':' + k] || []).toFixed(2)}`).join(' · ')
    + `  | shade covers annulus r9–12 ${(100 * mean(cover[H].map(c => c[0]))).toFixed(0)}%, inner lawn ${(100 * mean(cover[H].map(c => c[1]))).toFixed(0)}%`);
}
console.log('seed 42 at 13:25:', c135.map(c => JSON.stringify(c)).join('\n                 '));
console.log(`picnic choices n=${choice.n}: hot ${choice.hot} (inside ${choice.hotIn} = ${(100 * choice.hotIn / Math.max(1, choice.hot)).toFixed(0)}%) · cool ${choice.cool} (inside ${choice.coolIn} = ${(100 * choice.coolIn / Math.max(1, choice.cool)).toFixed(0)}%) · neither ${choice.mid} (inside ${choice.midIn}) · r ${choice.rMin.toFixed(1)}–${choice.rMax.toFixed(1)}, inner lawn ${choice.inner}`);
if (hashes.length) console.log('hashes:', JSON.stringify(hashes));
