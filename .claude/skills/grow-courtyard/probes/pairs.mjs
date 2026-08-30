/* probe-pairs.mjs — do arrivals come in twos, and do the twos hold?
 *   share of lane/east arrivals that are pairs, counted AT the choice (withCompanion);
 *   separation histogram leader↔companion per 0.25 s; laneCount/eastCount peaks vs HEAD;
 *   companions that lost their leader while sitting; followers left behind (>3 cells). */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
// run from the repo root: node .claude/skills/grow-courtyard/probes/pairs.mjs [file...]  (default HEAD-copy vs working tree)
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = process.argv.slice(2).length ? process.argv.slice(2) : ['/tmp/courtyard-head.html', 'courtyard.html'];
const SEEDS = [3, 7, 11, 19, 42, 63, 101, 1234, 5, 77];
const browser = await chromium.launch();
async function run(file, seed){
  const p = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${pathToFileURL(resolve(file)).href}?pause&seed=${seed}&t=${55 * 2.1}`);
  await p.waitForFunction('typeof window.__census === "function"');
  const r = await p.evaluate(() => {
    const has = typeof withCompanion === 'function';
    let calls = 0, roomy = 0, pairs = 0;
    if (has){ const o = withCompanion; withCompanion = (a, room) => { calls++; if (room) roomy++; const n = agents.length; o(a, room); if (agents.length > n) pairs++; }; }
    const hist = {}, seps = []; let lanePk = 0, eastPk = 0, lost = 0, behind = 0, sitSame = 0, sitN = 0, samples = 0;
    for (let k = 0; k < 4 * 55 * 2; k++){          // two days, quarter-second steps
      __warp(0.25);
      if (daylight < 0.3) continue;
      const bandCount = agents.filter(a => a.band).length, eastCount = agents.filter(a => a.east && !a.band).length;
      const court = agents.filter(a => !a.street).length;
      const laneCount = agents.length - court - eastCount - bandCount - agents.filter(a => a.tap).length - agents.filter(a => a.homer).length;
      lanePk = Math.max(lanePk, laneCount); eastPk = Math.max(eastPk, eastCount);
      for (const b of agents){ if (!b.with) continue; const L = b.with;
        if (!agents.includes(L)){ if (b.state !== 'walk') lost++; continue; }
        const d = Math.hypot(b.x - L.x, b.y - L.y); samples++; seps.push(d);
        const bk = (Math.floor(d * 10) / 10).toFixed(1); hist[bk] = (hist[bk] || 0) + 1;
        if (d > 3) behind++;
        if (L.state === 'sit' || L.state === 'stand'){ sitN++; if (b.state === L.state) sitSame++; }
      }
    }
    seps.sort((a, b) => a - b);
    const q = f => seps.length ? seps[Math.floor(f * (seps.length - 1))] : NaN;
    const inBand = seps.filter(d => d >= 0.9 && d <= 1.6).length, under = seps.filter(d => d < 0.9).length;
    return { has, calls, roomy, pairs, samples, lanePk, eastPk, lost, behind, sitSame, sitN, inBand, under, min: q(0), p10: q(0.1), p50: q(0.5), p90: q(0.9), max: q(1), hist };
  });
  await p.close();
  return { ...r, errs };
}
for (const f of FILES){
  console.log('\n== ' + f);
  const T = { calls:0, roomy:0, pairs:0, samples:0, lost:0, behind:0, sitSame:0, sitN:0, inBand:0, under:0, lanePk:[], eastPk:[], hist:{} };
  for (const s of SEEDS){
    const r = await run(f, s);
    console.log(`seed ${String(s).padStart(4)}  arrivals ${r.calls} room ${r.roomy} pairs ${r.pairs}  lanePk ${r.lanePk} eastPk ${r.eastPk}  sep p10/50/90 ${[r.p10,r.p50,r.p90].map(x=>x.toFixed(2)).join('/')} min ${r.min.toFixed(2)} max ${r.max.toFixed(2)}  behind>3 ${r.behind} lost ${r.lost} sitSame ${r.sitSame}/${r.sitN}` + (r.errs.length ? '  ERR ' + r.errs[0] : ''));
    for (const k of ['calls','roomy','pairs','samples','lost','behind','sitSame','sitN','inBand','under']) T[k] += r[k];
    T.lanePk.push(r.lanePk); T.eastPk.push(r.eastPk);
    for (const k in r.hist) T.hist[k] = (T.hist[k] || 0) + r.hist[k];
  }
  console.log(`TOTAL arrivals ${T.calls} (room ${T.roomy}) pairs ${T.pairs} = ${(100*T.pairs/Math.max(1,T.calls)).toFixed(1)}% of arrivals, ${(100*T.pairs/Math.max(1,T.roomy)).toFixed(1)}% of roomy`);
  console.log(`  separation: ${T.samples} samples, in [0.9,1.6] ${(100*T.inBand/Math.max(1,T.samples)).toFixed(1)}%, under 0.9 ${T.under} (${(100*T.under/Math.max(1,T.samples)).toFixed(2)}%), >3 cells ${T.behind}; lost-while-seated ${T.lost}; sitSame ${T.sitSame}/${T.sitN}`);
  console.log(`  lanePk ${T.lanePk.join(',')}  eastPk ${T.eastPk.join(',')}`);
  console.log('  hist ' + Object.keys(T.hist).sort((a,b)=>a-b).map(k => k + ':' + T.hist[k]).join(' '));
}
await browser.close();
