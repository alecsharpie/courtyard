#!/usr/bin/env node
/* probe-lawn-exit —  b179: the lawn's way OUT. Every lawn visit's EXIT leg is measured in
 * cells and hours at the instant it is routed, and every 0.25 s sample counts the lawn
 * people still on the frame after EVE_GONE (hourEve() 26.5 = half past two).
 * Controls: daytime lawn presence and stillness, which must not fall.
 *   node lawn-exit.mjs [file] [--seeds 6] [--days 27]
 */
import { writeFileSync } from 'node:fs'; import { homedir } from 'node:os'; import { resolve, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = resolve(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51].slice(0, +arg('--seeds', 6));
const DAYS = +arg('--days', 27);
const b = await chromium.launch(); const exits = []; const totals = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1200, height:720} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&t=0&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = JSON.parse(await p.evaluate(new Function('A', `const { DAYS } = A;
    window.__reseed(); window.__setTime(55);
    const STEP = 0.25, HPS = HOURS_PER_S, rows = []; const byPid = new Map();
    let pid = 0, fired = 0, routed = 0; const ins = [];
    // every lawn agent gets an id at its spawn
    const origSpawn = spawnLawnAgent;
    spawnLawnAgent = function(want){
      const n0 = agents.length; fired++;
      const r = origSpawn(want);
      for (let i = n0; i < agents.length; i++){ const a = agents[i]; if (!a.lawn || a.__pid) continue; a.__pid = ++pid;
        let d = 0, px = a.x, py = a.y;
        for (const q of a.wp){ d += Math.hypot(q[0]-px, q[1]-py); px=q[0]; py=q[1]; }
        ins.push({ pid:a.__pid, kind:a.kind, ex:a.exit.name, h:+hour.toFixed(2), le:+lawnEnd().toFixed(2),
                   priced:+(LAWN_WALK_MARGIN*(a.pred||0)).toFixed(2), realH:+(d/a.speed*HPS).toFixed(2), cells:+d.toFixed(1), sx:+a.x.toFixed(1) });
      }
      return r;
    };
    // ...and the EXIT leg is measured where it is built
    const origRoute = routeToExit;
    routeToExit = function(a){
      const r = origRoute(a);
      if (a.lawn){
        routed++;
        let d = 0, px = a.x, py = a.y;
        for (let i = a.i; i < a.wp.length; i++){ d += Math.hypot(a.wp[i][0] - px, a.wp[i][1] - py); px = a.wp[i][0]; py = a.wp[i][1]; }
        const last = a.wp[a.wp.length - 1] || [a.x, a.y];
        const rec = { pid:a.__pid, kind:a.kind, d:day, h:+hour.toFixed(3), le:+lawnEnd().toFixed(3),
                    cells:+d.toFixed(2), h_out:+(d / a.speed * HPS).toFixed(3),
                    endX:+last[0].toFixed(1), endY:+last[1].toFixed(1), out0:!!a.lawnOut,
                    land:+(hourEve() + d / a.speed * HPS).toFixed(3), late:0, seen:0, wentHome:0 };
        a.__rec = rec; rows.push(rec);
      }
      return r;
    };
    if (typeof lawnCut === 'undefined') {}
    const lateWhere = []; let lateOut = 0, lateIn = 0, lateSamples = 0, latePop = 0, lateWalk = 0, allSamples = 0;
    let openSamples = 0, openPop = 0, grassOpen = 0, wallOpen = 0;
    let darkSamples = 0, darkPop = 0, darkIn = 0, darkOut = 0; const darkHist = {};
    for (let i = 0; i < 400000 && day < DAYS; i++){
      window.__warp(STEP);
      allSamples++;
      const he = hourEve(), gone = lawnGone();
      const lawn = agents.filter(a => a.lawn);
      if (he >= EVE_GONE){ lateSamples++; latePop += lawn.length; lateWalk += lawn.filter(a => a.state === 'walk').length;
        lateOut += lawn.filter(a => a.lawnOut).length; lateIn += lawn.filter(a => !a.lawnOut).length;
        for (const a of lawn){ if (a.__rec) a.__rec.late++;
          lateWhere.push({ x:+a.x.toFixed(0), y:+a.y.toFixed(0), k:a.kind, st:a.state, out:!!a.lawnOut, he:+he.toFixed(1), pid:a.__pid||0 }); } }
      for (const a of lawn) if (a.__rec){ a.__rec.seen++; if (a.home) a.__rec.wentHome = 1; }
      if (gone){ darkSamples++; darkPop += lawn.length;
                 const ins2 = lawn.filter(a => Math.hypot(a.x - CX, a.y - CY) < 29);
                 darkIn += ins2.length;
                 for (const a of ins2){ const k = Math.floor(hourEve()); darkHist[k] = (darkHist[k]||0)+1; if (a.lawnOut) darkOut++; } }
      else { openSamples++; openPop += lawn.length;
             grassOpen += lawn.filter(a => !a.lawnOut && a.state !== 'walk').length;
             wallOpen  += agents.filter(a => !a.street && !a.home).length; }
    }
    if (!fired) throw new Error('spawnLawnAgent wrapper never fired');
    if (!routed) throw new Error('routeToExit wrapper never fired');
    return JSON.stringify({ darkHist, darkOut, lateOut, lateIn, ins, lateWhere: lateWhere.filter((_,i)=>i%7===0), rows, lateSamples, latePop, lateWalk, allSamples, openSamples, openPop,
                            grassOpen, wallOpen, darkSamples, darkPop, darkIn, STEP, HPS, EVE_GONE });`), { DAYS }));
  for (const r of out.rows) r.seed = seed;
  exits.push(...out.rows); totals.push({ seed, ...out });
  await p.close();
}
await b.close();
writeFileSync(arg('--out','probe-lawn-exit.json'), JSON.stringify({ exits, totals }));
const H = totals[0].STEP * totals[0].HPS;
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * f))] : NaN; };
const sum = a => a.reduce((s, x) => s + x, 0); const nSeed = SEEDS.length;
console.log(`file: ${file}   ${nSeed} seeds x ${DAYS - 1} days (a year is 26)   EVE_GONE ${totals[0].EVE_GONE}`);
console.log(`\n-- THE EXIT LEG, measured where it is built (${exits.length} exits, ${(exits.length/nSeed).toFixed(0)}/seed-year) --`);
console.log(`  cells: med ${q(exits.map(r=>r.cells),.5).toFixed(1)}  p90 ${q(exits.map(r=>r.cells),.9).toFixed(1)}  max ${Math.max(...exits.map(r=>r.cells)).toFixed(1)}  mean ${(sum(exits.map(r=>r.cells))/exits.length).toFixed(1)}`);
console.log(`  hours: med ${q(exits.map(r=>r.h_out),.5).toFixed(2)}  p90 ${q(exits.map(r=>r.h_out),.9).toFixed(2)}  max ${Math.max(...exits.map(r=>r.h_out)).toFixed(2)}`);
const late = exits.filter(r => r.land > totals[0].EVE_GONE);
console.log(`  exits whose priced LANDING is past EVE_GONE: ${late.length} / ${exits.length} = ${(100*late.length/exits.length).toFixed(1)}%`);
const ends = {}; for (const r of exits){ const k = r.endX < 0 ? 'W edge' : r.endX > 130 ? 'E edge' : r.endY < 0 ? 'N edge' : `(${r.endX},${r.endY})`; ends[k] = (ends[k]||0)+1; }
console.log(`  where the exit ENDS: ` + Object.entries(ends).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v} (${(100*v/exits.length).toFixed(0)}%)`).join('  '));
console.log(`\n-- STILL HERE AFTER EVE_GONE (the headline) --`);
console.log(`  mean lawn people on frame: ${(sum(totals.map(t=>t.latePop))/sum(totals.map(t=>t.lateSamples))).toFixed(3)}`);
console.log(`  ...of them WALKING:        ${(sum(totals.map(t=>t.lateWalk))/sum(totals.map(t=>t.lateSamples))).toFixed(3)}`);
console.log(`  ...still walking OUT (the vector): ${(sum(totals.map(t=>t.lateOut))/sum(totals.map(t=>t.lateSamples))).toFixed(3)}`);
console.log(`  ...walking IN, the next morning's early set-outs: ${(sum(totals.map(t=>t.lateIn))/sum(totals.map(t=>t.lateSamples))).toFixed(3)}`);
console.log(`  lawn agent-hours past EVE_GONE: ${(sum(totals.map(t=>t.latePop))*H).toFixed(1)}  (${(sum(totals.map(t=>t.latePop))*H/nSeed).toFixed(2)}/seed-year)`);
console.log(`\n-- the dark (b168's headline, the control that must not regress) --`);
console.log(`  mean lawn people while lawnGone(): ${(sum(totals.map(t=>t.darkPop))/sum(totals.map(t=>t.darkSamples))).toFixed(3)}   inside the wall ${(sum(totals.map(t=>t.darkIn))/sum(totals.map(t=>t.darkSamples))).toFixed(3)}`);
console.log(`\n-- PRESENCE, window OPEN (the thing not to trade away) --`);
console.log(`  mean lawn people on frame: ${(sum(totals.map(t=>t.openPop))/sum(totals.map(t=>t.openSamples))).toFixed(3)}`);
console.log(`  mean STOPPED on the grass: ${(sum(totals.map(t=>t.grassOpen))/sum(totals.map(t=>t.openSamples))).toFixed(3)}`);
console.log(`  mean people inside the wall: ${(sum(totals.map(t=>t.wallOpen))/sum(totals.map(t=>t.openSamples))).toFixed(3)}`);
